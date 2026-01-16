import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getClientIP, 
  getRateLimitHeaders 
} from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration: 20 requests per minute
const RATE_LIMIT_CONFIG = {
  functionName: 'scrape-article',
  maxRequests: 20,
  windowMs: 60 * 1000,
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = await checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, RATE_LIMIT_CONFIG.maxRequests);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(rateLimitResult.resetIn / 1000).toString()
        } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has publisher or admin role
    const { data: roles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'publisher');
    if (!hasPermission) {
      console.warn(`Unauthorized scrape attempt by user ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Publisher or admin role required" }),
        { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get URL from request body
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping article from ${formattedUrl} for user ${user.id}`);

    // Call Firecrawl API to scrape the article
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('Firecrawl API error:', firecrawlData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: firecrawlData.error || `Failed to scrape article (status ${firecrawlResponse.status})`
        }),
        { status: firecrawlResponse.status, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!firecrawlData.success || !firecrawlData.data) {
      console.error('Firecrawl returned no data:', firecrawlData);
      return new Response(
        JSON.stringify({ success: false, error: "No content found at URL" }),
        { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapedData = firecrawlData.data;
    
    console.log(`Successfully scraped article: ${scrapedData.metadata?.title || 'No title'}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: scrapedData.metadata?.title || null,
          description: scrapedData.metadata?.description || null,
          content: scrapedData.html || null,
          markdown: scrapedData.markdown || null,
          url: scrapedData.metadata?.sourceURL || formattedUrl,
          siteName: scrapedData.metadata?.siteName || null,
          image: scrapedData.metadata?.ogImage || null,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in scrape-article:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

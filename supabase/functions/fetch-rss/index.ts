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

// Rate limit configuration: 30 requests per minute
const RATE_LIMIT_CONFIG = {
  functionName: 'fetch-rss',
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};

interface RSSItem {
  title: string;
  link: string;
  guid: string;
  description: string | null;
  pubDate: string | null;
  imageUrl: string | null;
}

// Extract image URL from various RSS formats
const extractImageUrl = (itemXml: string): string | null => {
  // Try media:content
  const mediaContentMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaContentMatch) return mediaContentMatch[1];
  
  // Try media:thumbnail
  const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaThumbnailMatch) return mediaThumbnailMatch[1];
  
  // Try enclosure (commonly used for images)
  const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/i);
  if (enclosureMatch) return enclosureMatch[1];
  
  // Try enclosure without type check
  const enclosureAnyMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+\.(jpg|jpeg|png|gif|webp))[^"']*["'][^>]*>/i);
  if (enclosureAnyMatch) return enclosureAnyMatch[1];
  
  // Try image tag
  const imageTagMatch = itemXml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>[\s\S]*?<\/image>/i);
  if (imageTagMatch) return imageTagMatch[1].trim();
  
  // Try img tag in description/content
  const imgTagMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgTagMatch) return imgTagMatch[1];
  
  // Try content:encoded for images
  const contentEncodedMatch = itemXml.match(/<content:encoded>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/content:encoded>/i);
  if (contentEncodedMatch) return contentEncodedMatch[1];
  
  return null;
};

// Fetch image from the article page using Firecrawl API
const fetchImageFromPage = async (link: string): Promise<string | null> => {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping page image extraction');
    return null;
  }

  try {
    console.log(`Fetching image from page via Firecrawl: ${link}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: link,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 1000,
      }),
    });

    if (!response.ok) {
      console.log(`Firecrawl request failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const metadata = data.data?.metadata || data.metadata;
    
    // Try og:image from metadata (Firecrawl extracts this)
    if (metadata?.ogImage) {
      console.log(`Found og:image: ${metadata.ogImage}`);
      return metadata.ogImage;
    }
    
    // Try twitter:image
    if (metadata?.twitterImage) {
      console.log(`Found twitter:image: ${metadata.twitterImage}`);
      return metadata.twitterImage;
    }
    
    // Try to extract from HTML if available
    const html = data.data?.html || data.html;
    if (html) {
      // Try Open Graph image
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch) return ogImageMatch[1];
      
      // Try alternate og:image format
      const ogImageAltMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogImageAltMatch) return ogImageAltMatch[1];
      
      // Try Twitter card image
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (twitterImageMatch) return twitterImageMatch[1];
    }
    
    console.log(`No image found for ${link}`);
    return null;
  } catch (error) {
    console.log(`Failed to fetch image from ${link}: ${error}`);
    return null;
  }
};

// Parse RSS feed XML
const parseRSSFeed = (xmlText: string): RSSItem[] => {
  const items: RSSItem[] = [];
  
  // Extract items from RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    
    const getTagContent = (tag: string): string | null => {
      const tagRegex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      const tagMatch = itemXml.match(tagRegex);
      return tagMatch ? tagMatch[1].trim() : null;
    };
    
    const title = getTagContent('title') || '';
    const link = getTagContent('link') || '';
    const guid = getTagContent('guid') || link || crypto.randomUUID();
    const description = getTagContent('description');
    const pubDate = getTagContent('pubDate');
    const imageUrl = extractImageUrl(itemXml);
    
    if (title && link) {
      items.push({
        title,
        link,
        guid,
        description,
        pubDate,
        imageUrl,
      });
    }
  }
  
  return items;
};

const handler = async (req: Request): Promise<Response> => {
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;
    let authMethod = '';

    // Check if this is a scheduled/cron call using service role key
    if (authHeader?.includes(supabaseServiceKey)) {
      isAuthorized = true;
      authMethod = 'service_role';
      console.log("RSS fetch triggered by scheduled cron job (service role)");
    } else if (authHeader) {
      // Verify user authentication
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        console.error("Authentication failed:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user has admin role
      const { data: roles, error: rolesError } = await userClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError.message);
        return new Response(
          JSON.stringify({ error: "Failed to verify permissions" }),
          { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
      }

      const isAdmin = roles?.some(r => r.role === 'admin');
      if (!isAdmin) {
        console.warn(`Unauthorized RSS fetch attempt by user ${user.id}`);
        return new Response(
          JSON.stringify({ error: "Admin role required to trigger RSS fetch" }),
          { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
      }

      isAuthorized = true;
      authMethod = 'admin_user';
      console.log(`RSS fetch triggered by admin user ${user.id}`);
    } else {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use admin client for actual database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional feed_id from request body
    let feedId: string | null = null;
    let fetchDueOnly = false;
    try {
      const body = await req.json();
      feedId = body.feed_id || null;
      fetchDueOnly = body.fetch_due_only || false;
    } catch {
      // No body provided, fetch all active feeds
    }

    // Fetch active RSS feeds
    let query = adminClient
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);
    
    if (feedId) {
      query = query.eq('id', feedId);
    }

    const { data: feeds, error: feedsError } = await query;

    if (feedsError) {
      console.error("Error fetching feeds:", feedsError);
      throw feedsError;
    }

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active feeds to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter feeds that are due for fetching based on their interval
    const now = new Date();
    const feedsToProcess = fetchDueOnly 
      ? feeds.filter(feed => {
          if (!feed.last_fetched_at) return true;
          const lastFetched = new Date(feed.last_fetched_at);
          const intervalMs = (feed.fetch_interval_minutes || 60) * 60 * 1000;
          return (now.getTime() - lastFetched.getTime()) >= intervalMs;
        })
      : feeds;

    if (feedsToProcess.length === 0) {
      console.log("No feeds due for fetching based on their intervals");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No feeds due for fetching", 
          processed: 0,
          totalFeeds: feeds.length,
          authMethod 
        }),
        { status: 200, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${feedsToProcess.length} feed(s) out of ${feeds.length} total active feeds`);

    let totalItemsAdded = 0;
    const results: { feedName: string; itemsAdded: number; error?: string }[] = [];

    for (const feed of feedsToProcess) {
      try {
        console.log(`Fetching RSS feed: ${feed.name} (${feed.url})`);
        
        // Fetch the RSS feed
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'TechPulse RSS Reader/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const xmlText = await response.text();
        const items = parseRSSFeed(xmlText);
        
        console.log(`Parsed ${items.length} items from ${feed.name}`);

        // Get existing GUIDs to avoid duplicates
        const { data: existingItems } = await adminClient
          .from('rss_items')
          .select('guid')
          .eq('feed_id', feed.id);

        const existingGuids = new Set(existingItems?.map(i => i.guid) || []);

        // Filter out duplicates
        const newItems = items.filter(item => !existingGuids.has(item.guid));

        if (newItems.length > 0) {
          // Fetch images from article pages for items without images (limit to 3 to avoid timeout)
          const itemsWithImages = await Promise.all(
            newItems.slice(0, 10).map(async (item, index) => {
              if (item.imageUrl) return item;
              // Only fetch from page for first 3 items to avoid timeout
              if (index < 3) {
                const pageImage = await fetchImageFromPage(item.link);
                return { ...item, imageUrl: pageImage };
              }
              return item;
            })
          );
          
          // Combine items with fetched images and remaining items
          const allItems = [...itemsWithImages, ...newItems.slice(10)];
          
          // Insert new items
          const { error: insertError } = await adminClient
            .from('rss_items')
            .insert(
              allItems.map(item => ({
                feed_id: feed.id,
                title: item.title,
                link: item.link,
                guid: item.guid,
                description: item.description,
                pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
                image_url: item.imageUrl,
              }))
            );

          if (insertError) {
            console.error(`Error inserting items for ${feed.name}:`, insertError);
            results.push({ feedName: feed.name, itemsAdded: 0, error: insertError.message });
          } else {
            totalItemsAdded += allItems.length;
            results.push({ feedName: feed.name, itemsAdded: allItems.length });
          }
        } else {
          results.push({ feedName: feed.name, itemsAdded: 0 });
        }

        // Update last_fetched_at
        await adminClient
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing feed ${feed.name}:`, errorMessage);
        results.push({ feedName: feed.name, itemsAdded: 0, error: errorMessage });
      }
    }

    console.log(`RSS fetch complete. Total items added: ${totalItemsAdded}. Auth method: ${authMethod}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: feedsToProcess.length,
        totalFeeds: feeds.length,
        totalItemsAdded,
        results,
        authMethod,
      }),
      { status: 200, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch RSS feeds";
    console.error("RSS fetch error:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Rate Limiting Configuration & Monitoring
// ============================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP
const FUNCTION_NAME = 'get-html-snippets';

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: number }>();

// Rate limit event logger with structured monitoring data
const logRateLimitEvent = (
  eventType: 'allowed' | 'blocked' | 'warning',
  ip: string,
  details: { remaining: number; count: number; windowResetIn: number }
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    function: FUNCTION_NAME,
    eventType,
    clientIP: ip,
    requestCount: details.count,
    remaining: details.remaining,
    windowResetInSeconds: Math.ceil(details.windowResetIn / 1000),
    limit: MAX_REQUESTS_PER_WINDOW,
    windowMs: RATE_LIMIT_WINDOW_MS,
  };

  if (eventType === 'blocked') {
    console.error(`[RATE_LIMIT_BLOCKED] ${JSON.stringify(logEntry)}`);
  } else if (eventType === 'warning') {
    console.warn(`[RATE_LIMIT_WARNING] ${JSON.stringify(logEntry)}`);
  } else {
    // Only log every 10th allowed request to reduce noise
    if (details.count % 10 === 0) {
      console.log(`[RATE_LIMIT_INFO] ${JSON.stringify(logEntry)}`);
    }
  }
};

// Clean up expired entries periodically
const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      // Log summary of blocked requests before cleanup
      if (value.blocked > 0) {
        console.warn(`[RATE_LIMIT_CLEANUP] IP ${key} had ${value.blocked} blocked requests in last window`);
      }
      rateLimitStore.delete(key);
    }
  }
};

// Check rate limit for an IP
const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  // Clean up old entries occasionally (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupRateLimitStore();
  }
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS, blocked: 0 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limited - increment blocked counter and log
    record.blocked++;
    logRateLimitEvent('blocked', ip, {
      remaining: 0,
      count: record.count,
      windowResetIn: record.resetTime - now,
    });
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  // Increment count
  record.count++;
  
  // Log warning when approaching limit (80% threshold)
  if (record.count >= MAX_REQUESTS_PER_WINDOW * 0.8) {
    logRateLimitEvent('warning', ip, {
      remaining: MAX_REQUESTS_PER_WINDOW - record.count,
      count: record.count,
      windowResetIn: record.resetTime - now,
    });
  } else {
    logRateLimitEvent('allowed', ip, {
      remaining: MAX_REQUESTS_PER_WINDOW - record.count,
      count: record.count,
      windowResetIn: record.resetTime - now,
    });
  }
  
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetTime - now };
};

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  // Try various headers used by proxies/load balancers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback
  return 'unknown';
};

// ============================================
// Trusted Script Domains
// ============================================
const TRUSTED_SCRIPT_DOMAINS = [
  'googletagmanager.com',
  'googlesyndication.com',
  'google-analytics.com',
  'googleadservices.com',
  'adsterra.com',
  'effectivegatecpm.com',
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'analytics.tiktok.com',
];

// Validate script source
const isScriptFromTrustedDomain = (src: string): boolean => {
  return TRUSTED_SCRIPT_DOMAINS.some(domain => src.includes(domain));
};

// Extract trusted scripts from HTML
const extractTrustedScripts = (html: string): { trustedScripts: string[]; cleanedHtml: string } => {
  const trustedScripts: string[] = [];
  let cleanedHtml = html;
  
  const scriptRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*><\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const srcUrl = match[1];
    
    if (isScriptFromTrustedDomain(srcUrl)) {
      trustedScripts.push(srcUrl);
      cleanedHtml = cleanedHtml.replace(fullTag, '');
    } else {
      // Remove untrusted scripts entirely
      cleanedHtml = cleanedHtml.replace(fullTag, '');
    }
  }
  
  // Remove inline scripts
  cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  return { trustedScripts, cleanedHtml };
};

// Basic HTML sanitization for server-side
const sanitizeHtml = (html: string): string => {
  let cleaned = html;
  cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed[^>]*>/gi, '');
  cleaned = cleaned.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  
  // Remove event handlers
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // Remove data: URLs in src/href
  cleaned = cleaned.replace(/(?:src|href)\s*=\s*["']data:text\/html[^"']*["']/gi, '');
  
  return cleaned;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================
    // Rate Limiting Check
    // ============================================
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    
    const rateLimitHeaders = {
      'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
    };
    
    if (!rateLimit.allowed) {
      // Logging handled by checkRateLimit
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": Math.ceil(rateLimit.resetIn / 1000).toString(),
            ...rateLimitHeaders,
            ...corsHeaders 
          } 
        }
      );
    }

    const { location } = await req.json();
    
    if (!location || typeof location !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Location is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...rateLimitHeaders, ...corsHeaders } }
      );
    }

    // Validate location
    const validLocations = ['head', 'body_start', 'body_end', 'article_top', 'article_bottom', 'sidebar', 'in-content', 'footer', 'header', 'body-start', 'body-end', 'custom'];
    if (!validLocations.includes(location)) {
      return new Response(
        JSON.stringify({ error: 'Invalid location' }),
        { status: 400, headers: { "Content-Type": "application/json", ...rateLimitHeaders, ...corsHeaders } }
      );
    }

    // Use service role to bypass RLS and fetch snippets
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: snippets, error } = await adminSupabase
      .from('html_snippets')
      .select('code, priority')
      .eq('location', location)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error("Error fetching snippets:", error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch snippets' }),
        { status: 500, headers: { "Content-Type": "application/json", ...rateLimitHeaders, ...corsHeaders } }
      );
    }

    if (!snippets || snippets.length === 0) {
      return new Response(
        JSON.stringify({ html: '', scripts: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...rateLimitHeaders, ...corsHeaders } }
      );
    }

    // Combine all snippet code
    const combinedHtml = snippets.map(s => s.code).join("\n");
    
    // Extract trusted scripts and sanitize HTML
    const { trustedScripts, cleanedHtml } = extractTrustedScripts(combinedHtml);
    const sanitizedHtml = sanitizeHtml(cleanedHtml);

    // Return sanitized content - raw code is never exposed
    return new Response(
      JSON.stringify({ 
        html: sanitizedHtml, 
        scripts: trustedScripts 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...rateLimitHeaders, ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in get-html-snippets function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

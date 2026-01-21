import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIP, getRateLimitHeaders, cleanupExpiredRecords } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  functionName: 'get-html-snippets',
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
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
  'highperformanceformat.com',
  'alwingulla.com',
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'analytics.tiktok.com',
  'adskeeper.com',
  'mgid.com',
  'taboola.com',
  'outbrain.com',
  'propellerads.com',
  'revcontent.com',
  'infolinks.com',
  'media.net',
  'amazon-adsystem.com',
  'bidvertiser.com',
  'adnxs.com',
  'criteo.com',
  'pubmatic.com',
];

// Validate script source
const isScriptFromTrustedDomain = (src: string): boolean => {
  return TRUSTED_SCRIPT_DOMAINS.some(domain => src.includes(domain));
};

// Safe ad config patterns that are allowed as inline scripts
const SAFE_INLINE_PATTERNS = [
  /^\s*atOptions\s*=/,           // Adsterra config
  /^\s*\(adsbygoogle\s*=/,       // Google AdSense
  /^\s*window\.adsbygoogle/,     // Google AdSense push
  /^\s*(var|let|const)?\s*atOptions\s*=/,  // Adsterra with var/let/const
  /^\s*dataLayer\s*=/,           // Google Tag Manager
  /^\s*gtag\s*\(/,               // Google Analytics gtag
  /^\s*fbq\s*\(/,                // Facebook Pixel
  /^\s*_tfa\s*\./,               // Taboola
  /^\s*mgid\s*\./,               // MGID
];

const isSafeInlineScript = (content: string): boolean => {
  const trimmed = content.trim();
  if (trimmed.length === 0) return true;
  
  // Check if matches safe patterns
  if (SAFE_INLINE_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  // Allow simple object assignments (common in ad configs)
  const simpleAdConfig = /^\s*(var|let|const)?\s*\w+\s*=\s*\{[\s\S]*\}\s*;?\s*$/;
  if (simpleAdConfig.test(trimmed)) {
    return true;
  }
  
  // Allow function invocations that look like ad SDK calls
  const adSdkCall = /^\s*\w+\s*\.\s*\w+\s*\(/;
  if (adSdkCall.test(trimmed)) {
    return true;
  }
  
  // Allow array pushes (common pattern for ads)
  const arrayPush = /^\s*\(\s*\w+\s*=\s*\w+\s*\|\|\s*\[\s*\]\s*\)\s*\.\s*push\s*\(/;
  return arrayPush.test(trimmed);
};

// Extract trusted scripts and safe inline scripts from HTML
const extractTrustedScripts = (html: string): { trustedScripts: string[]; inlineScripts: string[]; cleanedHtml: string } => {
  const trustedScripts: string[] = [];
  const inlineScripts: string[] = [];
  let cleanedHtml = html;
  
  // Process all script tags
  const allScriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = allScriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const attributes = match[1];
    const content = match[2];
    
    // Check if it's an external script
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
    
    if (srcMatch) {
      const srcUrl = srcMatch[1];
      if (isScriptFromTrustedDomain(srcUrl)) {
        trustedScripts.push(srcUrl);
      }
      // Remove external script tag from HTML
      cleanedHtml = cleanedHtml.replace(fullTag, '');
    } else {
      // It's an inline script
      if (isSafeInlineScript(content)) {
        // Keep safe inline scripts for later injection
        inlineScripts.push(content.trim());
      }
      // Remove inline script tag from HTML
      cleanedHtml = cleanedHtml.replace(fullTag, '');
    }
  }
  
  return { trustedScripts, inlineScripts, cleanedHtml };
};

// More specific event handler pattern to avoid false positives with things like 'format'
const EVENT_HANDLER_PATTERN = /\s+on(click|dblclick|mousedown|mouseup|mouseover|mouseout|mousemove|mouseenter|mouseleave|keydown|keyup|keypress|focus|blur|change|submit|reset|select|load|unload|error|resize|scroll|contextmenu|copy|cut|paste|drag|dragstart|dragend|dragenter|dragleave|dragover|drop|touchstart|touchmove|touchend|touchcancel)\s*=/gi;

// Basic HTML sanitization for server-side
const sanitizeHtml = (html: string): string => {
  let cleaned = html;
  cleaned = cleaned.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed[^>]*>/gi, '');
  cleaned = cleaned.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  
  // Remove specific event handlers (not the generic on\w+ pattern that matches format, content, etc.)
  cleaned = cleaned.replace(EVENT_HANDLER_PATTERN, '');
  
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
    // Periodically cleanup expired records (1% chance per request)
    if (Math.random() < 0.01) {
      cleanupExpiredRecords().catch(console.error);
    }

    // ============================================
    // Rate Limiting Check (Database-backed)
    // ============================================
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
    
    const rateLimitHeaders = getRateLimitHeaders(rateLimit, RATE_LIMIT_CONFIG.maxRequests);
    
    if (!rateLimit.allowed) {
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
    
    // Extract trusted scripts, inline scripts, and sanitize HTML
    const { trustedScripts, inlineScripts, cleanedHtml } = extractTrustedScripts(combinedHtml);
    const sanitizedHtml = sanitizeHtml(cleanedHtml);

    // Return sanitized content - raw code is never exposed
    return new Response(
      JSON.stringify({ 
        html: sanitizedHtml, 
        scripts: trustedScripts,
        inlineScripts: inlineScripts
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

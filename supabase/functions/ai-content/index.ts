import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============ RATE LIMITING & MONITORING ============
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute (AI is expensive)
const FUNCTION_NAME = 'ai-content';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit event logger with structured monitoring data
function logRateLimitEvent(
  eventType: 'allowed' | 'blocked' | 'warning',
  ip: string,
  details: { remaining: number; count: number; windowResetIn: number }
) {
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
    // Only log every 5th allowed request to reduce noise
    if (details.count % 5 === 0) {
      console.log(`[RATE_LIMIT_INFO] ${JSON.stringify(logEntry)}`);
    }
  }
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        // Log summary of blocked requests before cleanup
        if (value.blocked > 0) {
          console.warn(`[RATE_LIMIT_CLEANUP] IP ${key} had ${value.blocked} blocked requests in last window`);
        }
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // New window
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientIP, { count: 1, resetTime, blocked: 0 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limited - increment blocked counter and log
    entry.blocked++;
    logRateLimitEvent('blocked', clientIP, {
      remaining: 0,
      count: entry.count,
      windowResetIn: entry.resetTime - now,
    });
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  
  // Log warning when approaching limit (80% threshold)
  if (entry.count >= MAX_REQUESTS_PER_WINDOW * 0.8) {
    logRateLimitEvent('warning', clientIP, {
      remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
      count: entry.count,
      windowResetIn: entry.resetTime - now,
    });
  } else {
    logRateLimitEvent('allowed', clientIP, {
      remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
      count: entry.count,
      windowResetIn: entry.resetTime - now,
    });
  }
  
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetTime: entry.resetTime };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateArticleRequest {
  type: 'generate' | 'suggest-headline' | 'suggest-summary' | 'suggest-seo' | 'improve-content';
  topic?: string;
  content?: string;
  title?: string;
}

// Input validation constants
const MAX_TOPIC_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TITLE_LENGTH = 300;
const VALID_TYPES = ['generate', 'suggest-headline', 'suggest-summary', 'suggest-seo', 'improve-content'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  const rateLimitHeaders = {
    ...corsHeaders,
    "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString(),
  };

  if (!rateLimit.allowed) {
    // Logging handled by checkRateLimit
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait before making more AI requests." }),
      { 
        status: 429, 
        headers: { 
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          ...rateLimitHeaders 
        } 
      }
    );
  }

  try {
    // ====== AUTHENTICATION ======
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // ====== AUTHORIZATION ======
    // Check if user has publisher or admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasPublisherAccess = roles?.some(r => 
      r.role === 'publisher' || r.role === 'admin'
    );

    if (!hasPublisherAccess) {
      console.warn('User lacks publisher/admin role:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Publisher or Admin role required to use AI content tools' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized with roles:', roles?.map(r => r.role).join(', '));

    // ====== INPUT VALIDATION ======
    let requestBody: GenerateArticleRequest;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body: Expected JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, topic, content, title } = requestBody;

    // Validate type
    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate inputs based on type
    if (type === 'generate') {
      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Topic is required for article generation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (topic.length > MAX_TOPIC_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Topic must be ${MAX_TOPIC_LENGTH} characters or less` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (['suggest-headline', 'suggest-summary', 'suggest-seo', 'improve-content'].includes(type)) {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Content is required for this operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (['suggest-summary', 'suggest-seo', 'improve-content'].includes(type)) {
      if (title && title.length > MAX_TITLE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Title must be ${MAX_TITLE_LENGTH} characters or less` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('AI Content request validated:', { type, userId: user.id, topicLength: topic?.length, contentLength: content?.length });

    // ====== AI PROCESSING ======
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Sanitize user inputs by limiting their length in prompts
    const sanitizedTopic = topic?.substring(0, MAX_TOPIC_LENGTH) || '';
    const sanitizedContent = content?.substring(0, MAX_CONTENT_LENGTH) || '';
    const sanitizedTitle = title?.substring(0, MAX_TITLE_LENGTH) || '';

    switch (type) {
      case 'generate':
        systemPrompt = `You are an expert tech journalist writing for a professional technology news website. Your articles are well-researched, engaging, and informative. Write in a clear, authoritative voice suitable for tech-savvy readers. Always cite sources when mentioning specific facts or statistics.`;
        userPrompt = `Write a comprehensive tech news article about the following topic. Include:
- A compelling headline
- An engaging excerpt (2-3 sentences)
- Full article content (800-1200 words) with proper paragraphs
- Suggested category from: AI, Software, Startups, Big Tech, Cybersecurity, Cloud, Programming, Gadgets, Web3, Fintech, Data, Robotics, Policy, SaaS
- 3-5 relevant tags
- Estimated read time in minutes

Topic: ${sanitizedTopic}

Respond in JSON format:
{
  "title": "headline",
  "excerpt": "brief summary",
  "content": "full article with HTML paragraphs using <p> tags",
  "category": "suggested category",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": 5
}`;
        break;

      case 'suggest-headline':
        systemPrompt = `You are an expert headline writer for tech news. Create compelling, SEO-optimized headlines that are accurate and engaging.`;
        userPrompt = `Based on this article content, suggest 5 alternative headlines that are compelling and SEO-friendly:

${sanitizedContent.substring(0, 2000)}

Respond in JSON format:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"]
}`;
        break;

      case 'suggest-summary':
        systemPrompt = `You are a tech news editor skilled at writing concise, engaging article summaries.`;
        userPrompt = `Write 3 alternative summaries/excerpts (2-3 sentences each) for this article:

Title: ${sanitizedTitle}
Content: ${sanitizedContent.substring(0, 2000)}

Respond in JSON format:
{
  "summaries": ["summary1", "summary2", "summary3"]
}`;
        break;

      case 'suggest-seo':
        systemPrompt = `You are an SEO expert specializing in tech news content optimization.`;
        userPrompt = `Analyze this article and provide SEO recommendations:

Title: ${sanitizedTitle}
Content: ${sanitizedContent.substring(0, 2000)}

Provide:
- Optimized meta title (under 60 characters)
- Meta description (under 160 characters)
- 5-10 SEO keywords
- Content improvement suggestions

Respond in JSON format:
{
  "seoTitle": "optimized title",
  "seoDescription": "meta description",
  "keywords": ["keyword1", "keyword2"],
  "suggestions": ["improvement1", "improvement2"]
}`;
        break;

      case 'improve-content':
        systemPrompt = `You are a tech news editor who improves article quality while maintaining the author's voice.`;
        userPrompt = `Improve this article for clarity, engagement, and accuracy. Keep the core message but enhance readability:

Title: ${sanitizedTitle}
Content: ${sanitizedContent}

Respond in JSON format:
{
  "improvedContent": "improved article with HTML paragraphs",
  "changes": ["change1", "change2", "change3"]
}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid request type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Calling Lovable AI with type:', type, 'for user:', user.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('No response content from AI');
      return new Response(
        JSON.stringify({ error: 'No response from AI service' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, length:', aiResponse.length, 'for user:', user.id);

    // Parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from response if wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      parsedResponse = { raw: aiResponse };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Content error:', error);
    // Don't expose internal error details to client
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

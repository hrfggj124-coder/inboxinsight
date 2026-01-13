import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// Persistent Rate Limiter with Database Storage
// ============================================

interface RateLimitConfig {
  functionName: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  count: number;
}

interface RateLimitRecord {
  id: string;
  client_ip: string;
  function_name: string;
  request_count: number;
  blocked_count: number;
  window_start: string;
  window_end: string;
}

// In-memory fallback cache (used if DB is unavailable)
const memoryFallback = new Map<string, { count: number; resetTime: number; blocked: number }>();

// Rate limit event logger with structured monitoring data
export function logRateLimitEvent(
  functionName: string,
  eventType: 'allowed' | 'blocked' | 'warning' | 'db_fallback',
  ip: string,
  details: { remaining: number; count: number; windowResetIn: number; limit: number }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    function: functionName,
    eventType,
    clientIP: ip,
    requestCount: details.count,
    remaining: details.remaining,
    windowResetInSeconds: Math.ceil(details.windowResetIn / 1000),
    limit: details.limit,
  };

  if (eventType === 'blocked') {
    console.error(`[RATE_LIMIT_BLOCKED] ${JSON.stringify(logEntry)}`);
  } else if (eventType === 'warning') {
    console.warn(`[RATE_LIMIT_WARNING] ${JSON.stringify(logEntry)}`);
  } else if (eventType === 'db_fallback') {
    console.warn(`[RATE_LIMIT_DB_FALLBACK] ${JSON.stringify(logEntry)}`);
  } else {
    // Only log periodically to reduce noise
    if (details.count % 5 === 0) {
      console.log(`[RATE_LIMIT_INFO] ${JSON.stringify(logEntry)}`);
    }
  }
}

// Get client IP from request headers
export function getClientIP(req: Request): string {
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
  
  return 'unknown';
}

// Create admin Supabase client for rate limiting
function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Memory fallback rate limiter (used when DB is unavailable)
function checkRateLimitMemory(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${config.functionName}:${ip}`;
  const record = memoryFallback.get(key);
  
  if (!record || now > record.resetTime) {
    memoryFallback.set(key, { count: 1, resetTime: now + config.windowMs, blocked: 0 });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs, count: 1 };
  }
  
  if (record.count >= config.maxRequests) {
    record.blocked++;
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now, count: record.count };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - record.count, 
    resetIn: record.resetTime - now,
    count: record.count 
  };
}

// Main rate limit check function with database persistence
export async function checkRateLimit(
  clientIP: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + config.windowMs);
  
  try {
    const adminClient = createAdminClient();
    
    // Find existing rate limit record for this IP and function within active window
    const { data: existingRecord, error: fetchError } = await adminClient
      .from('rate_limits')
      .select('*')
      .eq('client_ip', clientIP)
      .eq('function_name', config.functionName)
      .gt('window_end', now.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (fetchError) {
      console.error('[RATE_LIMIT_DB_ERROR] Fetch error:', fetchError.message);
      // Fall back to in-memory rate limiting
      const result = checkRateLimitMemory(clientIP, config);
      logRateLimitEvent(config.functionName, 'db_fallback', clientIP, {
        ...result,
        limit: config.maxRequests,
        windowResetIn: result.resetIn,
      });
      return result;
    }
    
    if (!existingRecord) {
      // Create new rate limit window
      const { error: insertError } = await adminClient
        .from('rate_limits')
        .insert({
          client_ip: clientIP,
          function_name: config.functionName,
          request_count: 1,
          blocked_count: 0,
          window_start: now.toISOString(),
          window_end: windowEnd.toISOString(),
        });
      
      if (insertError) {
        console.error('[RATE_LIMIT_DB_ERROR] Insert error:', insertError.message);
        const result = checkRateLimitMemory(clientIP, config);
        logRateLimitEvent(config.functionName, 'db_fallback', clientIP, {
          ...result,
          limit: config.maxRequests,
          windowResetIn: result.resetIn,
        });
        return result;
      }
      
      const result = { 
        allowed: true, 
        remaining: config.maxRequests - 1, 
        resetIn: config.windowMs,
        count: 1 
      };
      
      logRateLimitEvent(config.functionName, 'allowed', clientIP, {
        ...result,
        limit: config.maxRequests,
        windowResetIn: result.resetIn,
      });
      
      return result;
    }
    
    // Check if limit exceeded
    const record = existingRecord as RateLimitRecord;
    const windowEndTime = new Date(record.window_end).getTime();
    const resetIn = Math.max(0, windowEndTime - now.getTime());
    
    if (record.request_count >= config.maxRequests) {
      // Update blocked count
      await adminClient
        .from('rate_limits')
        .update({ 
          blocked_count: record.blocked_count + 1,
          updated_at: now.toISOString()
        })
        .eq('id', record.id);
      
      const result = { 
        allowed: false, 
        remaining: 0, 
        resetIn,
        count: record.request_count 
      };
      
      logRateLimitEvent(config.functionName, 'blocked', clientIP, {
        ...result,
        limit: config.maxRequests,
        windowResetIn: result.resetIn,
      });
      
      return result;
    }
    
    // Increment request count
    const newCount = record.request_count + 1;
    await adminClient
      .from('rate_limits')
      .update({ 
        request_count: newCount,
        updated_at: now.toISOString()
      })
      .eq('id', record.id);
    
    const remaining = config.maxRequests - newCount;
    const result = { 
      allowed: true, 
      remaining, 
      resetIn,
      count: newCount 
    };
    
    // Log warning when approaching limit (80% threshold)
    if (newCount >= config.maxRequests * 0.8) {
      logRateLimitEvent(config.functionName, 'warning', clientIP, {
        ...result,
        limit: config.maxRequests,
        windowResetIn: result.resetIn,
      });
    } else {
      logRateLimitEvent(config.functionName, 'allowed', clientIP, {
        ...result,
        limit: config.maxRequests,
        windowResetIn: result.resetIn,
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('[RATE_LIMIT_ERROR] Unexpected error:', error);
    // Fall back to in-memory rate limiting
    const result = checkRateLimitMemory(clientIP, config);
    logRateLimitEvent(config.functionName, 'db_fallback', clientIP, {
      ...result,
      limit: config.maxRequests,
      windowResetIn: result.resetIn,
    });
    return result;
  }
}

// Cleanup expired rate limit records (call periodically)
export async function cleanupExpiredRecords(): Promise<number> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc('cleanup_expired_rate_limits');
    
    if (error) {
      console.error('[RATE_LIMIT_CLEANUP_ERROR]', error.message);
      return 0;
    }
    
    if (data && data > 0) {
      console.log(`[RATE_LIMIT_CLEANUP] Removed ${data} expired records`);
    }
    
    return data || 0;
  } catch (error) {
    console.error('[RATE_LIMIT_CLEANUP_ERROR] Unexpected error:', error);
    return 0;
  }
}

// Generate rate limit headers for response
export function getRateLimitHeaders(
  result: RateLimitResult,
  maxRequests: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  };
}

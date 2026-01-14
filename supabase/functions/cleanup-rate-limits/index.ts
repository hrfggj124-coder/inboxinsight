import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for cleanup operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Call the cleanup function
    const { data, error } = await adminClient.rpc('cleanup_expired_rate_limits');

    if (error) {
      console.error('[CLEANUP_ERROR] Failed to clean up rate limits:', error);
      throw error;
    }

    const deletedCount = data || 0;

    // Log cleanup results
    const logEntry = {
      timestamp: new Date().toISOString(),
      function: 'cleanup-rate-limits',
      action: 'cleanup_complete',
      deletedRecords: deletedCount,
    };

    if (deletedCount > 0) {
      console.log(`[CLEANUP_SUCCESS] ${JSON.stringify(logEntry)}`);
    } else {
      console.log(`[CLEANUP_INFO] ${JSON.stringify({ ...logEntry, message: 'No expired records found' })}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedRecords: deletedCount,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to clean up rate limits';
    console.error('[CLEANUP_ERROR] Unexpected error:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

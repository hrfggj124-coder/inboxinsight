import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the date to aggregate (default: yesterday)
    const { date } = await req.json().catch(() => ({}));
    const aggregateDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Aggregating ad performance for date: ${aggregateDate}`);

    // Query impressions and clicks grouped by location and snippet
    const { data: impressions, error: impError } = await supabase
      .from('ad_impressions')
      .select('location, snippet_id, event_type')
      .gte('created_at', `${aggregateDate}T00:00:00Z`)
      .lt('created_at', `${aggregateDate}T23:59:59.999Z`);

    if (impError) {
      console.error("Error fetching impressions:", impError);
      throw impError;
    }

    // Group by location and snippet_id
    const aggregated: Record<string, { impressions: number; clicks: number; snippet_id: string | null }> = {};

    for (const record of impressions || []) {
      const key = `${record.location}:${record.snippet_id || 'null'}`;
      
      if (!aggregated[key]) {
        aggregated[key] = { impressions: 0, clicks: 0, snippet_id: record.snippet_id };
      }
      
      if (record.event_type === 'impression') {
        aggregated[key].impressions++;
      } else if (record.event_type === 'click') {
        aggregated[key].clicks++;
      }
    }

    // Upsert aggregated data into ad_performance_daily
    const upsertData = Object.entries(aggregated).map(([key, stats]) => {
      const [location] = key.split(':');
      return {
        date: aggregateDate,
        location,
        snippet_id: stats.snippet_id,
        impressions: stats.impressions,
        clicks: stats.clicks,
      };
    });

    if (upsertData.length > 0) {
      // Delete existing records for this date first
      const { error: deleteError } = await supabase
        .from('ad_performance_daily')
        .delete()
        .eq('date', aggregateDate);

      if (deleteError) {
        console.error("Error deleting old records:", deleteError);
      }

      // Insert new aggregated data
      const { error: insertError } = await supabase
        .from('ad_performance_daily')
        .insert(upsertData);

      if (insertError) {
        console.error("Error inserting aggregated data:", insertError);
        throw insertError;
      }
    }

    // Optionally clean up old raw impressions (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cleanupError, count } = await supabase
      .from('ad_impressions')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    if (cleanupError) {
      console.error("Error cleaning up old impressions:", cleanupError);
    } else {
      console.log(`Cleaned up ${count || 0} old impression records`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: aggregateDate,
        recordsAggregated: upsertData.length,
        locations: Object.keys(aggregated)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in aggregate-ad-performance:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  guid: string;
  description: string | null;
  pubDate: string | null;
}

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
    
    if (title && link) {
      items.push({
        title,
        link,
        guid,
        description,
        pubDate,
      });
    }
  }
  
  return items;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional feed_id from request body
    let feedId: string | null = null;
    try {
      const body = await req.json();
      feedId = body.feed_id || null;
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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalItemsAdded = 0;
    const results: { feedName: string; itemsAdded: number; error?: string }[] = [];

    for (const feed of feeds) {
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
          // Insert new items
          const { error: insertError } = await adminClient
            .from('rss_items')
            .insert(
              newItems.map(item => ({
                feed_id: feed.id,
                title: item.title,
                link: item.link,
                guid: item.guid,
                description: item.description,
                pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              }))
            );

          if (insertError) {
            console.error(`Error inserting items for ${feed.name}:`, insertError);
            results.push({ feedName: feed.name, itemsAdded: 0, error: insertError.message });
          } else {
            totalItemsAdded += newItems.length;
            results.push({ feedName: feed.name, itemsAdded: newItems.length });
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

    console.log(`RSS fetch complete. Total items added: ${totalItemsAdded}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: feeds.length,
        totalItemsAdded,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch RSS feeds";
    console.error("RSS fetch error:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
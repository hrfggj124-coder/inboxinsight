import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeRSS = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("rss-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rss_items",
        },
        (payload) => {
          console.log("RSS item change detected:", payload);
          // Invalidate all RSS item queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["rss-items"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rss_feeds",
        },
        (payload) => {
          console.log("RSS feed change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["rss-feeds"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

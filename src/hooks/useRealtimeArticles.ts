import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeArticles = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("articles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "articles",
        },
        (payload) => {
          console.log("Article change detected:", payload);
          
          // Invalidate articles queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["articles"] });
          
          // If it's an update or insert, also invalidate the specific article
          if (payload.new && typeof payload.new === "object" && "slug" in payload.new) {
            queryClient.invalidateQueries({ 
              queryKey: ["article", payload.new.slug] 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

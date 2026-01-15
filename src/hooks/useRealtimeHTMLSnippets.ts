import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeHTMLSnippets = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("html-snippets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "html_snippets",
        },
        (payload) => {
          console.log("HTML snippet change detected:", payload);
          // Invalidate all HTML snippet queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["html-snippets-secure"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useRealtimePublisher = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Listen to articles changes for the current user
    const articlesChannel = supabase
      .channel("publisher-articles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "articles",
          filter: `author_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Publisher article change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["publisher-articles"] });
          queryClient.invalidateQueries({ queryKey: ["articles"] });
        }
      )
      .subscribe();

    // Listen to categories changes
    const categoriesChannel = supabase
      .channel("publisher-categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        (payload) => {
          console.log("Category change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(articlesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [queryClient, user?.id]);
};

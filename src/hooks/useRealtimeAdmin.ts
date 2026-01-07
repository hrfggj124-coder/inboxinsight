import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeAdmin = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen to articles changes
    const articlesChannel = supabase
      .channel("admin-articles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "articles",
        },
        (payload) => {
          console.log("Admin article change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["admin-pending-articles"] });
          queryClient.invalidateQueries({ queryKey: ["admin-recent-articles"] });
          queryClient.invalidateQueries({ queryKey: ["admin-all-articles"] });
          queryClient.invalidateQueries({ queryKey: ["publisher-articles"] });
          queryClient.invalidateQueries({ queryKey: ["articles"] });
        }
      )
      .subscribe();

    // Listen to user roles changes
    const rolesChannel = supabase
      .channel("admin-roles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        (payload) => {
          console.log("User role change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }
      )
      .subscribe();

    // Listen to profiles changes
    const profilesChannel = supabase
      .channel("admin-profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Profile change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }
      )
      .subscribe();

    // Listen to publisher applications changes
    const applicationsChannel = supabase
      .channel("admin-applications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "publisher_applications",
        },
        (payload) => {
          console.log("Application change detected:", payload);
          queryClient.invalidateQueries({ queryKey: ["pending-applications"] });
        }
      )
      .subscribe();

    // Listen to categories changes
    const categoriesChannel = supabase
      .channel("admin-categories-changes")
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
          queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(articlesChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [queryClient]);
};

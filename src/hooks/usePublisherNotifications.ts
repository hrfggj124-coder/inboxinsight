import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Request browser notification permission
const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

// Show browser notification
const showBrowserNotification = (title: string, body: string, icon?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      tag: "article-status",
    });
  }
};

export const usePublisherNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const previousStatusesRef = useRef<Map<string, string>>(new Map());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    // Request permission on mount
    requestNotificationPermission();

    // Fetch initial article statuses
    const initializeStatuses = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, status, title")
        .eq("author_id", user.id);

      if (data) {
        data.forEach((article) => {
          previousStatusesRef.current.set(article.id, article.status);
        });
      }
      isInitializedRef.current = true;
    };

    initializeStatuses();

    // Listen to article status changes
    const channel = supabase
      .channel("publisher-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "articles",
          filter: `author_id=eq.${user.id}`,
        },
        (payload) => {
          if (!isInitializedRef.current) return;

          const newArticle = payload.new as {
            id: string;
            status: string;
            title: string;
          };
          const previousStatus = previousStatusesRef.current.get(newArticle.id);

          // Only notify on status changes to approved or rejected
          if (previousStatus && previousStatus !== newArticle.status) {
            if (newArticle.status === "published") {
              // Article approved
              toast({
                title: "🎉 Article Approved!",
                description: `"${newArticle.title}" has been approved and published.`,
              });
              showBrowserNotification(
                "Article Approved!",
                `"${newArticle.title}" has been approved and published.`
              );
            } else if (newArticle.status === "rejected") {
              // Article rejected
              toast({
                title: "Article Rejected",
                description: `"${newArticle.title}" was not approved. Check for feedback.`,
                variant: "destructive",
              });
              showBrowserNotification(
                "Article Rejected",
                `"${newArticle.title}" was not approved.`
              );
            }
          }

          // Update the stored status
          previousStatusesRef.current.set(newArticle.id, newArticle.status);

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["publisher-articles"] });
          queryClient.invalidateQueries({ queryKey: ["articles"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);
};

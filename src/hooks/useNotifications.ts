import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  notification_type: string;
  subject: string;
  body: string;
  status: string | null;
  created_at: string | null;
  sent_at: string | null;
  metadata: Record<string, unknown> | null;
}

export const useNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notification_queue")
        .select("id, notification_type, subject, body, status, created_at, sent_at, metadata")
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });
};

export const useUnreadNotificationsCount = (userId?: string) => {
  return useQuery({
    queryKey: ["notifications-unread-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("notification_queue")
        .select("*", { count: "exact", head: true })
        .eq("recipient_user_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
};

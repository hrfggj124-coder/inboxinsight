import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_on_approval: boolean;
  email_on_rejection: boolean;
  email_on_comment: boolean;
  email_on_like: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const defaultSettings = {
  email_on_approval: true,
  email_on_rejection: true,
  email_on_comment: true,
  email_on_like: false,
};

export const useNotificationSettings = (userId?: string) => {
  return useQuery({
    queryKey: ["notification-settings", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // Return existing settings or default values
      if (data) {
        return data as NotificationSettings;
      }
      
      return null;
    },
    enabled: !!userId,
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      settings 
    }: { 
      userId: string; 
      settings: Partial<Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>> 
    }) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("notification_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from("notification_settings")
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("notification_settings")
          .insert({
            user_id: userId,
            ...defaultSettings,
            ...settings,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings", variables.userId] });
      toast.success("Notification preferences saved");
    },
    onError: (error) => {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to save notification preferences");
    },
  });
};

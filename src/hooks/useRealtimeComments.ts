import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeComments = (articleId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!articleId) return;

    const channel = supabase
      .channel(`comments-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          // Invalidate and refetch comments when any change occurs
          queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, queryClient]);
};

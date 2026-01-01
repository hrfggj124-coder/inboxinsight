import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeLikes = (articleId: string, userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!articleId) return;

    const channel = supabase
      .channel(`likes-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          // Invalidate and refetch likes when any change occurs
          queryClient.invalidateQueries({ queryKey: ['likes', articleId] });
          if (userId) {
            queryClient.invalidateQueries({ queryKey: ['userLike', articleId, userId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, userId, queryClient]);
};

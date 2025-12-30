import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLikes = (articleId: string) => {
  return useQuery({
    queryKey: ['likes', articleId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!articleId,
  });
};

export const useUserLike = (articleId: string, userId?: string) => {
  return useQuery({
    queryKey: ['userLike', articleId, userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!articleId && !!userId,
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, isLiked }: { articleId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to like articles');

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            article_id: articleId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      return { articleId, userId: user.id };
    },
    onSuccess: ({ articleId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['likes', articleId] });
      queryClient.invalidateQueries({ queryKey: ['userLike', articleId, userId] });
    },
  });
};

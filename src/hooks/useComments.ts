import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Comment = Database['public']['Tables']['comments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface CommentWithAuthor extends Comment {
  author: Pick<Profile, 'display_name' | 'avatar_url'> | null;
  replies?: CommentWithAuthor[];
}

export const useComments = (articleId: string) => {
  return useQuery({
    queryKey: ['comments', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch author profiles for all comments
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const profiles: Record<string, Pick<Profile, 'display_name' | 'avatar_url'>> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        
        profilesData?.forEach(p => {
          profiles[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }

      // Map authors and organize into threaded structure
      const commentsWithAuthor = (data || []).map(comment => ({
        ...comment,
        author: profiles[comment.user_id] || null,
        replies: [] as CommentWithAuthor[],
      }));

      const commentsMap = new Map<string, CommentWithAuthor>();
      const rootComments: CommentWithAuthor[] = [];

      commentsWithAuthor.forEach(comment => {
        commentsMap.set(comment.id, comment);
      });

      commentsMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return rootComments;
    },
    enabled: !!articleId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      articleId,
      content,
      parentId,
    }: {
      articleId: string;
      content: string;
      parentId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to comment');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.articleId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, articleId }: { id: string; articleId: string }) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return articleId;
    },
    onSuccess: (articleId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
    },
  });
};

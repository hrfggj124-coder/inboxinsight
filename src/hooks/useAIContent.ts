import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GenerateArticleResponse {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
}

interface SuggestHeadlinesResponse {
  headlines: string[];
}

interface SuggestSummariesResponse {
  summaries: string[];
}

interface SuggestSEOResponse {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  suggestions: string[];
}

interface ImproveContentResponse {
  improvedContent: string;
  changes: string[];
}

// Helper function to handle common error responses
const handleAIError = (error: unknown, data: unknown): never => {
  if (error) throw error;
  
  const errorData = data as { error?: string };
  if (errorData?.error) {
    throw new Error(errorData.error);
  }
  
  throw new Error('Unknown error occurred');
};

export const useGenerateArticle = () => {
  return useMutation({
    mutationFn: async (topic: string): Promise<GenerateArticleResponse> => {
      // Validate topic on client side as well
      if (!topic || topic.trim().length === 0) {
        throw new Error('Topic is required');
      }
      if (topic.length > 500) {
        throw new Error('Topic must be 500 characters or less');
      }

      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'generate', topic: topic.trim() },
      });

      if (error || data?.error) {
        handleAIError(error, data);
      }
      return data.data as GenerateArticleResponse;
    },
  });
};

export const useSuggestHeadlines = () => {
  return useMutation({
    mutationFn: async (content: string): Promise<SuggestHeadlinesResponse> => {
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required');
      }
      if (content.length > 50000) {
        throw new Error('Content must be 50000 characters or less');
      }

      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-headline', content: content.trim() },
      });

      if (error || data?.error) {
        handleAIError(error, data);
      }
      return data.data as SuggestHeadlinesResponse;
    },
  });
};

export const useSuggestSummaries = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<SuggestSummariesResponse> => {
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required');
      }
      if (content.length > 50000) {
        throw new Error('Content must be 50000 characters or less');
      }
      if (title && title.length > 300) {
        throw new Error('Title must be 300 characters or less');
      }

      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-summary', title: title?.trim(), content: content.trim() },
      });

      if (error || data?.error) {
        handleAIError(error, data);
      }
      return data.data as SuggestSummariesResponse;
    },
  });
};

export const useSuggestSEO = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<SuggestSEOResponse> => {
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required');
      }
      if (content.length > 50000) {
        throw new Error('Content must be 50000 characters or less');
      }
      if (title && title.length > 300) {
        throw new Error('Title must be 300 characters or less');
      }

      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-seo', title: title?.trim(), content: content.trim() },
      });

      if (error || data?.error) {
        handleAIError(error, data);
      }
      return data.data as SuggestSEOResponse;
    },
  });
};

export const useImproveContent = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<ImproveContentResponse> => {
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required');
      }
      if (content.length > 50000) {
        throw new Error('Content must be 50000 characters or less');
      }
      if (title && title.length > 300) {
        throw new Error('Title must be 300 characters or less');
      }

      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'improve-content', title: title?.trim(), content: content.trim() },
      });

      if (error || data?.error) {
        handleAIError(error, data);
      }
      return data.data as ImproveContentResponse;
    },
  });
};

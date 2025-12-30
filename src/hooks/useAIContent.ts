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

export const useGenerateArticle = () => {
  return useMutation({
    mutationFn: async (topic: string): Promise<GenerateArticleResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'generate', topic },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as GenerateArticleResponse;
    },
  });
};

export const useSuggestHeadlines = () => {
  return useMutation({
    mutationFn: async (content: string): Promise<SuggestHeadlinesResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-headline', content },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as SuggestHeadlinesResponse;
    },
  });
};

export const useSuggestSummaries = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<SuggestSummariesResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-summary', title, content },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as SuggestSummariesResponse;
    },
  });
};

export const useSuggestSEO = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<SuggestSEOResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'suggest-seo', title, content },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as SuggestSEOResponse;
    },
  });
};

export const useImproveContent = () => {
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }): Promise<ImproveContentResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { type: 'improve-content', title, content },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as ImproveContentResponse;
    },
  });
};

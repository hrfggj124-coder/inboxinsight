import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface HTMLSnippet {
  id: string;
  name: string;
  code: string;
  location: string;
  priority: number;
  is_active: boolean;
}

// Hook to fetch and render HTML snippets for a specific location
export const useHTMLSnippets = (location: string) => {
  const { data: snippets, isLoading } = useQuery({
    queryKey: ["html-snippets", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("html_snippets")
        .select("*")
        .eq("location", location)
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as HTMLSnippet[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { snippets, isLoading };
};

// Component to render HTML snippets at a specific location
interface HTMLSnippetRendererProps {
  location: "head" | "body_start" | "body_end" | "article_top" | "article_bottom";
  className?: string;
}

export const HTMLSnippetRenderer = ({ location, className = "" }: HTMLSnippetRendererProps) => {
  const { snippets, isLoading } = useHTMLSnippets(location);

  const combinedHTML = useMemo(() => {
    if (!snippets || snippets.length === 0) return "";
    return snippets.map(s => s.code).join("\n");
  }, [snippets]);

  if (isLoading || !combinedHTML) return null;

  // For head snippets, we'd need to use Helmet
  // For body snippets, we can render directly
  if (location === "head") {
    return null; // Head snippets need special handling with Helmet
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: combinedHTML }}
    />
  );
};

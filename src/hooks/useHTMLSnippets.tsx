import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import DOMPurify from "dompurify";

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

  const sanitizedHTML = useMemo(() => {
    if (!snippets || snippets.length === 0) return "";
    const combinedHTML = snippets.map(s => s.code).join("\n");
    
    // Sanitize HTML to prevent XSS attacks
    // Remove all script tags to prevent code injection even from admin accounts
    // For analytics/ads, use external script loading via iframe or trusted embed codes
    const sanitized = DOMPurify.sanitize(combinedHTML, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'a', 'img', 'iframe', 'ins',
        'noscript', 'style', 'section', 'article',
        'header', 'footer', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u'
      ],
      ALLOWED_ATTR: [
        'id', 'class', 'style', 'href', 'src', 'alt', 'title', 'target', 'rel',
        'width', 'height', 'frameborder', 'allowfullscreen', 'loading',
        'data-ad-client', 'data-ad-slot', 'data-ad-format', 'data-full-width-responsive',
        'name', 'content'
      ],
      // Disallow data: URIs in src attributes to prevent XSS
      ALLOW_DATA_ATTR: false,
      FORCE_BODY: true,
      // Forbid dangerous tags and attributes
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    });
    
    return sanitized;
  }, [snippets]);

  if (isLoading || !sanitizedHTML) return null;

  // For head snippets, we'd need to use Helmet
  // For body snippets, we can render directly
  if (location === "head") {
    return null; // Head snippets need special handling with Helmet
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

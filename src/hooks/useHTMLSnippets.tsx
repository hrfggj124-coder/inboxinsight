import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface SnippetResponse {
  html: string;
  scripts: string[];
  inlineScripts?: string[];
}

// Track ad impression
const trackImpression = async (location: string) => {
  try {
    await supabase.from("ad_impressions").insert({
      location,
      event_type: "impression",
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      page_url: window.location.href,
    });
  } catch (error) {
    // Silently fail - tracking should not break the app
    console.debug("Failed to track impression:", error);
  }
};

// Hook to fetch HTML snippets via secure edge function
// This prevents exposure of raw ad code while still serving sanitized content
export const useHTMLSnippets = (location: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["html-snippets-secure", location],
    queryFn: async (): Promise<SnippetResponse> => {
      const { data, error } = await supabase.functions.invoke('get-html-snippets', {
        body: { location }
      });

      if (error) {
        console.error("Error fetching html snippets:", error);
        return { html: '', scripts: [], inlineScripts: [] };
      }
      
      return data as SnippetResponse;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { 
    snippetData: data || { html: '', scripts: [], inlineScripts: [] }, 
    isLoading 
  };
};

// Component to render HTML snippets at a specific location
interface HTMLSnippetRendererProps {
  location: "head" | "body_start" | "body_end" | "body-start" | "body-end" | "article_top" | "article_bottom" | "header" | "sidebar" | "in-content" | "footer" | "custom";
  className?: string;
}

export const HTMLSnippetRenderer = ({ location, className = "" }: HTMLSnippetRendererProps) => {
  const { snippetData, isLoading } = useHTMLSnippets(location);
  const hasTrackedRef = useRef(false);

  // Additional client-side sanitization for defense in depth
  const sanitizedHTML = useMemo(() => {
    if (!snippetData.html) return "";
    
    // Double-sanitize on client for defense in depth
    return DOMPurify.sanitize(snippetData.html, {
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
      ALLOW_DATA_ATTR: false,
      FORCE_BODY: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    });
  }, [snippetData.html]);

  // Dynamically inject trusted scripts and inline scripts into the document
  useEffect(() => {
    const hasScripts = snippetData.scripts.length > 0;
    const hasInlineScripts = snippetData.inlineScripts && snippetData.inlineScripts.length > 0;
    
    if (!hasScripts && !hasInlineScripts) return;
    
    const scriptElements: HTMLScriptElement[] = [];
    
    // First inject inline scripts (config variables)
    if (hasInlineScripts) {
      snippetData.inlineScripts!.forEach((code, index) => {
        const scriptId = `html-snippet-inline-${location}-${index}`;
        const existingScript = document.getElementById(scriptId);
        if (existingScript) return;
        
        const script = document.createElement('script');
        script.id = scriptId;
        script.textContent = code;
        script.dataset.htmlSnippet = 'true';
        
        if (location === 'head') {
          document.head.appendChild(script);
        } else {
          document.body.appendChild(script);
        }
        
        scriptElements.push(script);
      });
    }
    
    // Then inject external scripts
    snippetData.scripts.forEach((src) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) return;
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.htmlSnippet = 'true';
      
      if (location === 'head') {
        document.head.appendChild(script);
      } else {
        document.body.appendChild(script);
      }
      
      scriptElements.push(script);
    });
    
    return () => {
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [snippetData.scripts, snippetData.inlineScripts, location]);

  // Track impression when content is rendered
  useEffect(() => {
    if (!hasTrackedRef.current && sanitizedHTML && location !== "head") {
      hasTrackedRef.current = true;
      trackImpression(location);
    }
  }, [sanitizedHTML, location]);

  if (isLoading || (!sanitizedHTML && snippetData.scripts.length === 0)) return null;

  if (location === "head") {
    return null;
  }

  if (!sanitizedHTML) return null;

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

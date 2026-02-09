import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";

interface SnippetResponse {
  html: string;
  scripts: string[];
  inlineScripts?: string[];
}

// Track ad event (impression or click)
export const trackAdEvent = async (location: string, eventType: 'impression' | 'click', snippetId?: string) => {
  try {
    await supabase.from("ad_impressions").insert({
      location,
      event_type: eventType,
      snippet_id: snippetId || null,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      page_url: window.location.href,
    });
  } catch (error) {
    // Silently fail - tracking should not break the app
    console.debug(`Failed to track ${eventType}:`, error);
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Additional client-side sanitization for defense in depth
  // Allow data attributes for ad network containers
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
      ALLOW_DATA_ATTR: true, // Allow all data attributes for ad network containers
      FORCE_BODY: true,
      FORBID_TAGS: ['object', 'embed', 'form', 'input', 'button'], // Don't forbid script - handled server-side
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    });
  }, [snippetData.html]);

  // Handle click tracking
  const handleClick = useCallback(() => {
    if (location !== "head") {
      trackAdEvent(location, 'click');
    }
  }, [location]);

  // Dynamically inject trusted scripts and inline scripts into the document
  useEffect(() => {
    const hasScripts = snippetData.scripts.length > 0;
    const hasInlineScripts = snippetData.inlineScripts && snippetData.inlineScripts.length > 0;
    
    if (!hasScripts && !hasInlineScripts) return;
    
    const scriptElements: HTMLScriptElement[] = [];
    
    // First inject inline scripts (config variables like atOptions)
    if (hasInlineScripts) {
      snippetData.inlineScripts!.forEach((code, index) => {
        const scriptId = `html-snippet-inline-${location}-${index}`;
        const existingScript = document.getElementById(scriptId);
        if (existingScript) return;
        
        const script = document.createElement('script');
        script.id = scriptId;
        script.textContent = code;
        script.dataset.htmlSnippet = 'true';
        
        // For non-head locations, insert inline scripts near the container
        if (location === 'head') {
          document.head.appendChild(script);
        } else if (containerRef.current) {
          // Insert before the container so config is available when external script runs
          containerRef.current.parentNode?.insertBefore(script, containerRef.current);
        } else {
          document.body.appendChild(script);
        }
        
        scriptElements.push(script);
      });
    }
    
    // Then inject external scripts (with a small delay to ensure inline configs are set)
    const scriptTimeout = setTimeout(() => {
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
        } else if (containerRef.current) {
          // Insert after the container div so the script can find it
          containerRef.current.parentNode?.insertBefore(script, containerRef.current.nextSibling);
        } else {
          document.body.appendChild(script);
        }
        
        scriptElements.push(script);
      });
    }, 50); // Small delay ensures inline config scripts execute first
    
    return () => {
      clearTimeout(scriptTimeout);
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [snippetData.scripts, snippetData.inlineScripts, location]);

  // Track impression when content is rendered
  useEffect(() => {
    if (!hasTrackedRef.current && (sanitizedHTML || snippetData.scripts.length > 0) && location !== "head") {
      hasTrackedRef.current = true;
      trackAdEvent(location, 'impression');
    }
  }, [sanitizedHTML, snippetData.scripts.length, location]);

  if (isLoading) return null;

  // For head location, only scripts matter
  if (location === "head") {
    return null;
  }

  // Show container if we have HTML or scripts (ads may inject content dynamically)
  const hasContent = sanitizedHTML || snippetData.scripts.length > 0;
  if (!hasContent) return null;

  return (
    <div 
      ref={containerRef}
      className={`ad-container ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

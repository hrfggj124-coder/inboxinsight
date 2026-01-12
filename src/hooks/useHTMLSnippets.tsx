import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect } from "react";
import DOMPurify from "dompurify";

interface HTMLSnippet {
  id: string;
  name: string;
  code: string;
  location: string;
  priority: number;
  is_active: boolean;
}

// Trusted ad network domains - scripts from these sources are allowed
const TRUSTED_SCRIPT_DOMAINS = [
  'googletagmanager.com',
  'googlesyndication.com',
  'google-analytics.com',
  'googleadservices.com',
  'adsterra.com',
  'effectivegatecpm.com', // Adsterra CDN
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'analytics.tiktok.com',
];

// Extract and validate script tags from HTML
const extractTrustedScripts = (html: string): { trustedScripts: string[]; cleanedHtml: string } => {
  const trustedScripts: string[] = [];
  let cleanedHtml = html;
  
  // Match script tags with src attributes
  const scriptRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*><\/script>/gi;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const srcUrl = match[1];
    
    // Check if script is from trusted domain
    const isTrusted = TRUSTED_SCRIPT_DOMAINS.some(domain => 
      srcUrl.includes(domain)
    );
    
    if (isTrusted) {
      trustedScripts.push(srcUrl);
      cleanedHtml = cleanedHtml.replace(fullTag, '');
    }
  }
  
  return { trustedScripts, cleanedHtml };
};

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

  // Extract trusted scripts and sanitized HTML
  const { sanitizedHTML, trustedScripts } = useMemo(() => {
    if (!snippets || snippets.length === 0) return { sanitizedHTML: "", trustedScripts: [] };
    
    const combinedHTML = snippets.map(s => s.code).join("\n");
    
    // Extract trusted ad scripts before sanitization
    const { trustedScripts, cleanedHtml } = extractTrustedScripts(combinedHTML);
    
    // Sanitize remaining HTML to prevent XSS attacks
    // Keep iframe-based ads and safe HTML elements
    const sanitized = DOMPurify.sanitize(cleanedHtml, {
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
      // Forbid dangerous tags and attributes - scripts handled separately
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    });
    
    return { sanitizedHTML: sanitized, trustedScripts };
  }, [snippets]);

  // Dynamically inject trusted scripts into the document
  useEffect(() => {
    if (trustedScripts.length === 0) return;
    
    const scriptElements: HTMLScriptElement[] = [];
    
    trustedScripts.forEach((src) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) return;
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.htmlSnippet = 'true'; // Mark as snippet script for cleanup
      
      // Append to appropriate location
      if (location === 'head') {
        document.head.appendChild(script);
      } else {
        document.body.appendChild(script);
      }
      
      scriptElements.push(script);
    });
    
    // Cleanup on unmount
    return () => {
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [trustedScripts, location]);

  if (isLoading || (!sanitizedHTML && trustedScripts.length === 0)) return null;

  // For head snippets, we handle scripts via useEffect
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

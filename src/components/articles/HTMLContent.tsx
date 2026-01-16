import { useMemo, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface HTMLContentProps {
  content: string;
  className?: string;
  trusted?: boolean; // When true, allows more HTML features for admin/publisher content
}

// Trusted domains for external scripts and iframes
const TRUSTED_DOMAINS = [
  'adsterra.com',
  'alwingulla.com',
  'googlesyndication.com',
  'googleadservices.com',
  'google.com',
  'doubleclick.net',
  'facebook.net',
  'facebook.com',
  'twitter.com',
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com',
  'instagram.com',
  'tiktok.com',
  'cdn.embedly.com',
  'platform.twitter.com',
  'connect.facebook.net',
];

const isTrustedSource = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return TRUSTED_DOMAINS.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

// Sanitize HTML content to prevent XSS attacks while allowing safe HTML
export const HTMLContent = ({ content, className = "", trusted = false }: HTMLContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sanitizedContent = useMemo(() => {
    // Configure DOMPurify based on trust level
    const baseConfig = {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "hr",
        "ul", "ol", "li",
        "a", "strong", "em", "b", "i", "u", "s", "strike",
        "blockquote", "code", "pre",
        "img", "figure", "figcaption",
        "table", "thead", "tbody", "tr", "th", "td",
        "div", "span", "section", "article",
        "iframe", "video", "audio", "source",
        "ins", "noscript",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "title", "alt", "src", "width", "height",
        "class", "id", "style",
        "frameborder", "allowfullscreen", "allow", "loading",
        "data-ad-client", "data-ad-slot", "data-ad-format", "data-full-width-responsive",
        "controls", "autoplay", "muted", "loop", "poster", "preload",
        "type", "name", "content",
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ["target"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    };

    // For trusted content, allow scripts from known ad networks
    if (trusted) {
      // Don't forbid script tags for trusted content - we'll handle them separately
      const trustedConfig = {
        ...baseConfig,
        ALLOWED_TAGS: [...baseConfig.ALLOWED_TAGS, "script"],
        FORBID_TAGS: [] as string[],
      };
      return DOMPurify.sanitize(content, trustedConfig);
    }

    // Standard config forbids scripts
    const standardConfig = {
      ...baseConfig,
      FORBID_TAGS: ["script", "style", "form", "input", "button"],
    };

    // Sanitize the content
    const clean = DOMPurify.sanitize(content, standardConfig);
    
    // Add target="_blank" and rel="noopener noreferrer" to external links
    const wrapper = document.createElement("div");
    wrapper.innerHTML = clean;
    
    wrapper.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    return wrapper.innerHTML;
  }, [content, trusted]);

  // Handle script execution for trusted content
  useEffect(() => {
    if (!trusted || !containerRef.current) return;

    // Find and execute scripts from trusted sources
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    
    const scripts = tempDiv.querySelectorAll("script");
    const scriptElements: HTMLScriptElement[] = [];
    
    scripts.forEach((script, index) => {
      const src = script.getAttribute("src");
      const inlineCode = script.textContent || "";
      
      // Only execute scripts from trusted sources or config-style inline scripts
      const isExternalTrusted = src && isTrustedSource(src);
      const isConfigScript = !src && (
        inlineCode.includes("atOptions") || 
        inlineCode.includes("adsbygoogle") ||
        inlineCode.includes("dataLayer") ||
        /^\s*\w+\s*=\s*{/.test(inlineCode) // Variable assignment pattern
      );
      
      if (isExternalTrusted || isConfigScript) {
        const newScript = document.createElement("script");
        newScript.dataset.trustedContent = "true";
        newScript.id = `trusted-script-${index}-${Date.now()}`;
        
        if (src) {
          newScript.src = src;
          newScript.async = true;
        } else {
          newScript.textContent = inlineCode;
        }
        
        document.body.appendChild(newScript);
        scriptElements.push(newScript);
      }
    });
    
    return () => {
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [content, trusted]);

  // Check if content appears to be HTML
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (!isHTML) {
    // Render as plain text paragraphs
    return (
      <div className={`prose prose-lg prose-invert max-w-none ${className}`}>
        {content.split("\n\n").map((paragraph, index) => (
          <p key={index} className="text-foreground/90 leading-relaxed mb-6">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`prose prose-lg prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

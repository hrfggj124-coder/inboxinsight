import { useMemo, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface HTMLContentProps {
  content: string;
  className?: string;
  trusted?: boolean; // When true, allows more HTML features for admin/publisher content
}

// Trusted domains for external scripts and iframes
const TRUSTED_DOMAINS = [
  // Ad networks
  'adsterra.com',
  'alwingulla.com',
  'highperformanceformat.com',
  'effectivegatecpm.com',
  'googlesyndication.com',
  'googleadservices.com',
  'google.com',
  'doubleclick.net',
  'adskeeper.com',
  'mgid.com',
  'taboola.com',
  'outbrain.com',
  'propellerads.com',
  'revcontent.com',
  'adblade.com',
  'infolinks.com',
  'media.net',
  'amazon-adsystem.com',
  'bidvertiser.com',
  'adnxs.com',
  'criteo.com',
  'pubmatic.com',
  // Social platforms
  'facebook.net',
  'facebook.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com',
  'instagram.com',
  'tiktok.com',
  'pinterest.com',
  'linkedin.com',
  'reddit.com',
  // Embeds and widgets
  'cdn.embedly.com',
  'platform.twitter.com',
  'connect.facebook.net',
  'player.vimeo.com',
  'codepen.io',
  'jsfiddle.net',
  'codesandbox.io',
  'gist.github.com',
  'giphy.com',
  'spotify.com',
  'soundcloud.com',
  'anchor.fm',
  'buzzsprout.com',
  'simplecast.com',
  // Analytics and tracking
  'googletagmanager.com',
  'google-analytics.com',
  'clarity.ms',
  'hotjar.com',
  'cdn.segment.com',
  // CDNs
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'jsdelivr.net',
  'stackpath.bootstrapcdn.com',
  'maxcdn.bootstrapcdn.com',
];

// Trusted inline script patterns (beyond variable assignment)
const TRUSTED_INLINE_PATTERNS = [
  'atOptions',           // Adsterra
  'adsbygoogle',         // Google AdSense
  'dataLayer',           // Google Tag Manager
  'fbq(',                // Facebook Pixel
  'gtag(',               // Google Analytics
  '_tfa.',               // Taboola
  'mgid.',               // MGID
  'outbrain.',           // Outbrain
  'disqus_config',       // Disqus comments
  'DISQUS.',             // Disqus
  'instgrm.',            // Instagram embeds
  'twttr.',              // Twitter embeds
  'SC.Widget',           // SoundCloud
  'Spotify.',            // Spotify embeds
  'Codepen.',            // CodePen embeds
];

const isTrustedSource = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return TRUSTED_DOMAINS.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

const isTrustedInlineScript = (code: string): boolean => {
  // Check for known patterns
  if (TRUSTED_INLINE_PATTERNS.some(pattern => code.includes(pattern))) {
    return true;
  }
  // Variable assignment pattern (config objects)
  if (/^\s*\w+\s*=\s*{/.test(code)) {
    return true;
  }
  // Function call patterns for known services
  if (/^\s*(function|var|let|const|window\.)/.test(code)) {
    return true;
  }
  // IIFE patterns
  if (/^\s*\(function/.test(code) || /^\s*\(\s*\(\s*\)/.test(code)) {
    return true;
  }
  return false;
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
      
      // Only execute scripts from trusted sources or verified inline patterns
      const isExternalTrusted = src && isTrustedSource(src);
      const isConfigScript = !src && isTrustedInlineScript(inlineCode);
      
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

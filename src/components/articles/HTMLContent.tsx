import { useMemo } from "react";
import DOMPurify from "dompurify";

interface HTMLContentProps {
  content: string;
  className?: string;
}

// Sanitize HTML content to prevent XSS attacks while allowing safe HTML
export const HTMLContent = ({ content, className = "" }: HTMLContentProps) => {
  const sanitizedContent = useMemo(() => {
    // Configure DOMPurify to allow safe HTML elements
    const config = {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "hr",
        "ul", "ol", "li",
        "a", "strong", "em", "b", "i", "u", "s", "strike",
        "blockquote", "code", "pre",
        "img", "figure", "figcaption",
        "table", "thead", "tbody", "tr", "th", "td",
        "div", "span",
        "iframe"
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "title", "alt", "src", "width", "height",
        "class", "id", "style",
        "frameborder", "allowfullscreen", "allow"
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ["target"],
      FORBID_TAGS: ["script", "style", "form", "input", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    };

    // Sanitize the content
    const clean = DOMPurify.sanitize(content, config);
    
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
  }, [content]);

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
      className={`prose prose-lg prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

import { useState, useEffect, useRef } from "react";
import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";
import { AlertCircle } from "lucide-react";

interface AdPlaceholderProps {
  location: "header" | "body_start" | "body_end" | "body-start" | "body-end" | "article_top" | "article_bottom" | "sidebar" | "in-content" | "footer" | "custom";
  className?: string;
  fallbackHeight?: string;
  showFallback?: boolean;
}

export const AdPlaceholder = ({
  location,
  className = "",
  fallbackHeight = "90px",
  showFallback = true,
}: AdPlaceholderProps) => {
  const [hasContent, setHasContent] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if ad content loaded after a delay
    checkTimeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const adContainer = container.querySelector('.ad-container');
        
        // Check if there's actual visible content
        if (adContainer) {
          const hasVisibleContent = 
            adContainer.innerHTML.trim().length > 0 ||
            adContainer.querySelector('iframe') !== null ||
            adContainer.querySelector('img') !== null ||
            adContainer.querySelector('script') !== null;
          
          setHasContent(hasVisibleContent);
        } else {
          setHasContent(false);
        }
      }
    }, 3000); // Wait 3 seconds for ads to load

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [location]);

  // Listen for network errors on ad scripts
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('403') || event.message?.includes('blocked')) {
        setLoadError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div ref={containerRef} className={`ad-placeholder-wrapper ${className}`}>
      {/* Actual ad content */}
      <HTMLSnippetRenderer location={location} className="w-full" />
      
      {/* Fallback placeholder when no content or error */}
      {showFallback && hasContent === false && (
        <div 
          className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground/50"
          style={{ minHeight: fallbackHeight }}
        >
          <div className="text-center text-xs">
            <div className="font-medium">Ad Space</div>
            <div className="text-[10px]">{location}</div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div 
          className="bg-destructive/5 border border-dashed border-destructive/20 rounded-lg flex items-center justify-center text-destructive/50"
          style={{ minHeight: fallbackHeight }}
        >
          <div className="text-center text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Ad blocked or unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

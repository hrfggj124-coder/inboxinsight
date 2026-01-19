import { useEffect, useRef } from "react";
import { HTMLSnippetRenderer, useHTMLSnippets } from "@/hooks/useHTMLSnippets";
import { supabase } from "@/integrations/supabase/client";

interface InContentAdProps {
  className?: string;
}

// Track ad impression
const trackImpression = async (location: string, snippetId?: string) => {
  try {
    await supabase.from("ad_impressions").insert({
      snippet_id: snippetId || null,
      location,
      event_type: "impression",
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      page_url: window.location.href,
    });
  } catch (error) {
    console.error("Failed to track impression:", error);
  }
};

export const InContentAd = ({ className = "" }: InContentAdProps) => {
  const hasTracked = useRef(false);
  const { snippetData } = useHTMLSnippets("in-content");

  useEffect(() => {
    if (!hasTracked.current && snippetData.html) {
      hasTracked.current = true;
      trackImpression("in-content");
    }
  }, [snippetData.html]);

  return (
    <div className={`my-8 ${className}`}>
      <HTMLSnippetRenderer location="in-content" className="w-full" />
    </div>
  );
};

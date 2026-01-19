import { useMemo } from "react";
import { HTMLContent } from "./HTMLContent";
import { InContentAd } from "@/components/ads/InContentAd";

interface ArticleContentWithAdsProps {
  content: string;
  className?: string;
  trusted?: boolean;
  adInterval?: number; // Number of paragraphs between ads
}

// Split content into sections and inject ads between them
export const ArticleContentWithAds = ({
  content,
  className = "",
  trusted = false,
  adInterval = 3, // Default: ad after every 3 paragraphs
}: ArticleContentWithAdsProps) => {
  const contentSections = useMemo(() => {
    // Check if content is HTML
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    
    if (!isHTML) {
      // Split plain text by double newlines
      return content.split("\n\n").filter(p => p.trim());
    }

    // Parse HTML and split by paragraphs/headers
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    
    const sections: string[] = [];
    let currentSection = "";
    let blockCount = 0;
    
    const blockElements = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "UL", "OL", "PRE", "TABLE", "FIGURE"];
    
    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName;
        
        if (blockElements.includes(tagName)) {
          currentSection += element.outerHTML;
          blockCount++;
          
          // Create a new section after reaching the interval
          if (blockCount >= adInterval) {
            sections.push(currentSection);
            currentSection = "";
            blockCount = 0;
          }
        } else {
          currentSection += element.outerHTML;
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        currentSection += `<p>${node.textContent}</p>`;
        blockCount++;
        
        if (blockCount >= adInterval) {
          sections.push(currentSection);
          currentSection = "";
          blockCount = 0;
        }
      }
    });
    
    // Add remaining content
    if (currentSection.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  }, [content, adInterval]);

  // If content is very short, don't inject ads
  if (contentSections.length <= 1) {
    return <HTMLContent content={content} className={className} trusted={trusted} />;
  }

  return (
    <div className={className}>
      {contentSections.map((section, index) => (
        <div key={index}>
          <HTMLContent content={section} trusted={trusted} />
          {/* Insert ad after each section except the last one */}
          {index < contentSections.length - 1 && (
            <InContentAd />
          )}
        </div>
      ))}
    </div>
  );
};

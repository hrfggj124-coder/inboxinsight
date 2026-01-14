import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline" | "footer" | "header";
  className?: string;
}

// Map ad slot types to HTML snippet locations
const locationMap: Record<string, "header" | "body_start" | "body_end" | "article_top" | "article_bottom" | "sidebar" | "in-content" | "footer" | "custom"> = {
  banner: "body_start",
  header: "header",
  sidebar: "sidebar",
  inline: "in-content",
  footer: "footer",
};

export const AdSlot = ({ type, className = "" }: AdSlotProps) => {
  const location = locationMap[type] || "custom";

  return (
    <div className={`w-full ${className}`}>
      <HTMLSnippetRenderer location={location} className="w-full" />
    </div>
  );
};
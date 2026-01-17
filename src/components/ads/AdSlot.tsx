import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline" | "footer" | "header";
  className?: string;
}

// Map ad slot types to HTML snippet locations
// Note: Database uses "body-start" format, not "body_start"
const locationMap: Record<string, "header" | "body-start" | "body-end" | "article_top" | "article_bottom" | "sidebar" | "in-content" | "footer" | "custom"> = {
  banner: "body-start",
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
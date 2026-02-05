import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Rss, LayoutGrid } from "lucide-react";

export type ContentFilterType = "all" | "articles" | "rss";

interface ContentFilterProps {
  value: ContentFilterType;
  onChange: (value: ContentFilterType) => void;
}

export const ContentFilter = ({ value, onChange }: ContentFilterProps) => {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(v) => v && onChange(v as ContentFilterType)}
      className="bg-muted/50 p-1 rounded-lg"
    >
      <ToggleGroupItem 
        value="all" 
        aria-label="Show all content"
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        All
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="articles" 
        aria-label="Show only articles"
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <FileText className="h-3.5 w-3.5" />
        Articles
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="rss" 
        aria-label="Show only RSS feeds"
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Rss className="h-3.5 w-3.5" />
        RSS
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

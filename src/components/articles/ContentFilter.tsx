import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileText, Rss, LayoutGrid, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type ContentFilterType = "all" | "articles" | "rss";

interface ContentFilterProps {
  value: ContentFilterType;
  onChange: (value: ContentFilterType) => void;
  counts?: {
    all: number;
    articles: number;
    rss: number;
  };
  isLoading?: boolean;
}

export const ContentFilter = ({ value, onChange, counts, isLoading = false }: ContentFilterProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    );
  }

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
        All{counts ? ` (${counts.all})` : ''}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="articles" 
        aria-label="Show only articles"
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <FileText className="h-3.5 w-3.5" />
        Articles{counts ? ` (${counts.articles})` : ''}
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="rss" 
        aria-label="Show only RSS feeds"
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Rss className="h-3.5 w-3.5" />
        RSS{counts ? ` (${counts.rss})` : ''}
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

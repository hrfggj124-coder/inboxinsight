import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useSuggestHeadlines, 
  useSuggestSEO, 
  useSuggestSummaries, 
  useImproveContent 
} from "@/hooks/useAIContent";
import { 
  Sparkles, 
  Heading, 
  Search, 
  FileText, 
  Wand2,
  Loader2,
  Check,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIToolsPanelProps {
  title: string;
  content: string;
  onApplyHeadline: (headline: string) => void;
  onApplySEO: (seo: { title: string; description: string; keywords: string[] }) => void;
  onApplySummary: (summary: string) => void;
  onApplyContent: (content: string) => void;
}

export const AIToolsPanel = ({
  title,
  content,
  onApplyHeadline,
  onApplySEO,
  onApplySummary,
  onApplyContent,
}: AIToolsPanelProps) => {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<string[]>([]);
  const [seoSuggestions, setSeoSuggestions] = useState<{
    seoTitle: string;
    seoDescription: string;
    keywords: string[];
    suggestions: string[];
  } | null>(null);
  const [improvedContent, setImprovedContent] = useState<{
    content: string;
    changes: string[];
  } | null>(null);

  const headlineMutation = useSuggestHeadlines();
  const seoMutation = useSuggestSEO();
  const summaryMutation = useSuggestSummaries();
  const improveMutation = useImproveContent();

  const handleGenerateHeadlines = async () => {
    if (!content) {
      toast({
        title: "Content required",
        description: "Please add some content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await headlineMutation.mutateAsync(content);
      setHeadlines(result.headlines);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate headlines. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSEO = async () => {
    if (!title || !content) {
      toast({
        title: "Title and content required",
        description: "Please add a title and content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await seoMutation.mutateAsync({ title, content });
      setSeoSuggestions(result);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate SEO suggestions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSummaries = async () => {
    if (!title || !content) {
      toast({
        title: "Title and content required",
        description: "Please add a title and content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await summaryMutation.mutateAsync({ title, content });
      setSummaries(result.summaries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summaries. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImproveContent = async () => {
    if (!title || !content) {
      toast({
        title: "Title and content required",
        description: "Please add a title and content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await improveMutation.mutateAsync({ title, content });
      setImprovedContent({
        content: result.improvedContent,
        changes: result.changes,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to improve content. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sticky top-24">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Writing Tools
          </CardTitle>
          <CardDescription>
            Use AI to enhance your article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headline Generator */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleGenerateHeadlines}
              disabled={headlineMutation.isPending}
            >
              {headlineMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heading className="h-4 w-4" />
              )}
              Generate Headlines
            </Button>
            
            {headlines.length > 0 && (
              <ScrollArea className="h-[120px] rounded-md border border-border p-3">
                <div className="space-y-2">
                  {headlines.map((headline, i) => (
                    <button
                      key={i}
                      onClick={() => onApplyHeadline(headline)}
                      className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-start gap-2 group"
                    >
                      <span className="flex-1">{headline}</span>
                      <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* SEO Optimizer */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleGenerateSEO}
              disabled={seoMutation.isPending}
            >
              {seoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Optimize SEO
            </Button>
            
            {seoSuggestions && (
              <div className="rounded-md border border-border p-3 space-y-3">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase">Suggested Title</p>
                  <p className="text-sm">{seoSuggestions.seoTitle}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase">Meta Description</p>
                  <p className="text-sm">{seoSuggestions.seoDescription}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {seoSuggestions.keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => onApplySEO({
                    title: seoSuggestions.seoTitle,
                    description: seoSuggestions.seoDescription,
                    keywords: seoSuggestions.keywords,
                  })}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply SEO Settings
                </Button>
              </div>
            )}
          </div>

          {/* Summary Generator */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleGenerateSummaries}
              disabled={summaryMutation.isPending}
            >
              {summaryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Generate Summaries
            </Button>
            
            {summaries.length > 0 && (
              <ScrollArea className="h-[150px] rounded-md border border-border p-3">
                <div className="space-y-2">
                  {summaries.map((summary, i) => (
                    <button
                      key={i}
                      onClick={() => onApplySummary(summary)}
                      className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-start gap-2 group"
                    >
                      <span className="flex-1">{summary}</span>
                      <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Content Improver */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleImproveContent}
              disabled={improveMutation.isPending}
            >
              {improveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Improve Content
            </Button>
            
            {improvedContent && (
              <div className="rounded-md border border-border p-3 space-y-3">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase">Changes Made</p>
                  <ul className="list-disc list-inside space-y-1">
                    {improvedContent.changes.slice(0, 3).map((change, i) => (
                      <li key={i} className="text-xs text-muted-foreground">{change}</li>
                    ))}
                  </ul>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => onApplyContent(improvedContent.content)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply Improved Content
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Keep headlines under 60 characters</li>
            <li>• Use active voice for better engagement</li>
            <li>• Include relevant keywords naturally</li>
            <li>• Break up long paragraphs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

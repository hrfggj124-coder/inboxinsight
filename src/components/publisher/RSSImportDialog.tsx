import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Rss, ExternalLink, Import, Loader2, FileText, Sparkles, ArrowLeft, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { HTMLContent } from "@/components/articles/HTMLContent";

interface RSSItem {
  id: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: string | null;
  feed: {
    name: string;
  } | null;
}

interface ScrapedData {
  title: string | null;
  description: string | null;
  content: string | null;
  markdown: string | null;
  url: string;
  siteName: string | null;
  coverImage: string | null;
  author: string | null;
  publishedTime: string | null;
}

interface RSSImportDialogProps {
  onImport: (data: {
    title: string;
    content: string;
    excerpt: string;
    sourceName: string;
    sourceUrl: string;
    coverImage?: string;
  }) => void;
}

export const RSSImportDialog = ({ onImport }: RSSImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [fetchingFullId, setFetchingFullId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<{
    item: RSSItem;
    scraped: ScrapedData;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['rss-items-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_items')
        .select(`
          id,
          title,
          link,
          description,
          pub_date,
          feed:feed_id (name)
        `)
        .eq('is_imported', false)
        .order('pub_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as RSSItem[];
    },
    enabled: open && !previewMode,
  });

  const markImportedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('rss_items')
        .update({ is_imported: true })
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-items'] });
      queryClient.invalidateQueries({ queryKey: ['rss-items-for-import'] });
    },
  });

  const handleBasicImport = async (item: RSSItem) => {
    setImportingId(item.id);
    
    try {
      const attributionHtml = `
<p><em>Originally published on <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.feed?.name || 'External Source'}</a>.</em></p>

${item.description ? `<p>${item.description}</p>` : '<p>[Add your article content here]</p>'}

<hr />

<p><strong>Source:</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.link}</a></p>
      `.trim();

      onImport({
        title: item.title,
        content: attributionHtml,
        excerpt: item.description?.substring(0, 160) || '',
        sourceName: item.feed?.name || 'External Source',
        sourceUrl: item.link,
      });

      await markImportedMutation.mutateAsync(item.id);
      
      toast.success("RSS article imported to editor");
      setOpen(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import article");
    } finally {
      setImportingId(null);
    }
  };

  const handleFetchForPreview = async (item: RSSItem) => {
    setFetchingFullId(item.id);
    
    try {
      toast.info("Fetching full article content...", { duration: 2000 });
      
      const { data, error } = await supabase.functions.invoke('scrape-article', {
        body: { url: item.link },
      });

      if (error) {
        console.error("Scrape function error:", error);
        throw new Error(error.message || "Failed to fetch content");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch article content");
      }

      // Show preview
      setPreviewData({
        item,
        scraped: data.data as ScrapedData,
      });
      setPreviewMode(true);
      
    } catch (error) {
      console.error("Full content fetch error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch full content";
      toast.error(errorMessage);
    } finally {
      setFetchingFullId(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    
    setImportingId(previewData.item.id);
    
    try {
      const { item, scraped } = previewData;
      
      const fullContent = `
<p><em>Originally published on <a href="${item.link}" target="_blank" rel="noopener noreferrer">${scraped.siteName || item.feed?.name || 'External Source'}</a>.</em></p>

${scraped.content || scraped.markdown || '<p>[Content could not be extracted]</p>'}

<hr />

<p><strong>Source:</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.link}</a></p>
      `.trim();

      const title = scraped.title || item.title;
      const excerpt = scraped.description || item.description?.substring(0, 160) || '';

      onImport({
        title,
        content: fullContent,
        excerpt,
        sourceName: scraped.siteName || item.feed?.name || 'External Source',
        sourceUrl: item.link,
        coverImage: scraped.coverImage || undefined,
      });

      await markImportedMutation.mutateAsync(item.id);
      
      toast.success("Full article content imported successfully");
      setOpen(false);
      setPreviewMode(false);
      setPreviewData(null);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import article");
    } finally {
      setImportingId(null);
    }
  };

  const handleBackToList = () => {
    setPreviewMode(false);
    setPreviewData(null);
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPreviewMode(false);
      setPreviewData(null);
    }
  };

  const isProcessing = (itemId: string) => importingId === itemId || fetchingFullId === itemId;

  // Preview Mode UI
  if (previewMode && previewData) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Rss className="h-4 w-4" />
            Import from RSS
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToList}
                className="gap-1 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Preview Scraped Content
            </DialogTitle>
            <DialogDescription>
              Review the extracted content before importing to the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cover Image Preview */}
            {previewData.scraped.coverImage && (
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Cover Image (will be auto-set)</span>
                </div>
                <div className="p-2 bg-muted/20">
                  <img 
                    src={previewData.scraped.coverImage} 
                    alt="Cover" 
                    className="max-h-48 w-auto mx-auto rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-lg">{previewData.scraped.title || previewData.item.title}</h3>
              {previewData.scraped.description && (
                <p className="text-sm text-muted-foreground">{previewData.scraped.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {previewData.scraped.siteName && (
                  <Badge variant="secondary">{previewData.scraped.siteName}</Badge>
                )}
                {previewData.scraped.author && (
                  <span>By: {previewData.scraped.author}</span>
                )}
                <a 
                  href={previewData.item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Original
                </a>
              </div>
            </div>

            {/* Content Preview */}
            <ScrollArea className="h-[400px] border border-border rounded-lg">
              <div className="p-4">
                {previewData.scraped.content ? (
                  <HTMLContent 
                    content={previewData.scraped.content} 
                    trusted={true}
                  />
                ) : previewData.scraped.markdown ? (
                  <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                    {previewData.scraped.markdown}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No content could be extracted</p>
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={handleBackToList}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmImport}
                disabled={importingId !== null}
                className="gap-2"
              >
                {importingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirm Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // List Mode UI
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Rss className="h-4 w-4" />
          Import from RSS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            Import RSS Article
          </DialogTitle>
          <DialogDescription>
            Select an article to import. Use "Quick Import" for the RSS summary or "Fetch Full Content" to scrape the complete article with preview.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-border">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : !items?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Rss className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No RSS Articles Available</h3>
              <p className="text-sm text-muted-foreground">
                All RSS articles have been imported or no feeds have been fetched yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {item.feed?.name && (
                          <Badge variant="secondary" className="text-xs">
                            {item.feed.name}
                          </Badge>
                        )}
                        {item.pub_date && (
                          <span>{format(new Date(item.pub_date), 'MMM d, yyyy')}</span>
                        )}
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Original
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBasicImport(item)}
                        disabled={isProcessing(item.id)}
                        className="gap-1.5"
                      >
                        {importingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Quick Import
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleFetchForPreview(item)}
                        disabled={isProcessing(item.id)}
                        className="gap-1.5"
                      >
                        {fetchingFullId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Fetch & Preview
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

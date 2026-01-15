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
import { Rss, ExternalLink, Import, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface RSSImportDialogProps {
  onImport: (data: {
    title: string;
    content: string;
    excerpt: string;
    sourceName: string;
    sourceUrl: string;
  }) => void;
}

export const RSSImportDialog = ({ onImport }: RSSImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
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
    enabled: open,
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

  const handleImport = async (item: RSSItem) => {
    setImportingId(item.id);
    
    try {
      // Create attribution HTML
      const attributionHtml = `
<p><em>Originally published on <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.feed?.name || 'External Source'}</a>.</em></p>

${item.description ? `<p>${item.description}</p>` : '<p>[Add your article content here]</p>'}

<hr />

<p><strong>Source:</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.link}</a></p>
      `.trim();

      // Pass data to editor
      onImport({
        title: item.title,
        content: attributionHtml,
        excerpt: item.description?.substring(0, 160) || '',
        sourceName: item.feed?.name || 'External Source',
        sourceUrl: item.link,
      });

      // Mark as imported
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Select an article from your RSS feeds to import into the editor with proper attribution.
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
                  <div className="flex items-start justify-between gap-4">
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
                    
                    <Button
                      size="sm"
                      onClick={() => handleImport(item)}
                      disabled={importingId === item.id}
                      className="shrink-0"
                    >
                      {importingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Import className="h-4 w-4 mr-1" />
                          Import
                        </>
                      )}
                    </Button>
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

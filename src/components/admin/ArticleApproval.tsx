import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export const ArticleApproval = () => {
  const queryClient = useQueryClient();
  const [previewArticle, setPreviewArticle] = useState<any>(null);

  const { data: pendingArticles, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-articles'],
    queryFn: async () => {
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`*, categories:category_id (name, slug)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author profiles separately
      const authorIds = [...new Set(articles?.map(a => a.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);

      return articles?.map(article => ({
        ...article,
        author_name: profiles?.find(p => p.user_id === article.author_id)?.display_name || 'Unknown'
      }));
    },
  });

  const { data: recentArticles, isLoading: recentLoading } = useQuery({
    queryKey: ['admin-recent-articles'],
    queryFn: async () => {
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`*, categories:category_id (name, slug)`)
        .in('status', ['published', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const authorIds = [...new Set(articles?.map(a => a.author_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);

      return articles?.map(article => ({
        ...article,
        author_name: profiles?.find(p => p.user_id === article.author_id)?.display_name || 'Unknown'
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ articleId, status }: { articleId: string; status: ArticleStatus }) => {
      const updateData: any = { status };
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-articles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-articles'] });
      toast({
        title: status === 'published' ? "Article published" : "Article rejected",
        description: status === 'published' 
          ? "The article is now live on the site."
          : "The article has been rejected.",
      });
      setPreviewArticle(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      published: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isLoading = pendingLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingArticles?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Recent History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingArticles && pendingArticles.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingArticles.map((article) => (
                    <TableRow key={article.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-medium line-clamp-1 max-w-[300px]">
                          {article.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {article.author_name}
                      </TableCell>
                      <TableCell>
                        {article.categories?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(article.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewArticle(article)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({
                              articleId: article.id,
                              status: 'rejected',
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({
                              articleId: article.id,
                              status: 'published',
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No articles pending review.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {recentArticles && recentArticles.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentArticles.map((article) => (
                    <TableRow key={article.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-medium line-clamp-1 max-w-[300px]">
                          {article.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {article.author_name}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(article.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(article.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No history yet</h3>
              <p className="text-muted-foreground">
                Reviewed articles will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{previewArticle?.title}</DialogTitle>
            <DialogDescription>
              By {previewArticle?.author_name} • {previewArticle?.categories?.name || 'Uncategorized'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="prose prose-invert max-w-none">
              {previewArticle?.excerpt && (
                <p className="text-muted-foreground italic border-l-2 border-primary pl-4 mb-4">
                  {previewArticle.excerpt}
                </p>
              )}
              <div className="whitespace-pre-wrap">{previewArticle?.content}</div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewArticle(null)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                updateStatusMutation.mutate({
                  articleId: previewArticle.id,
                  status: 'rejected',
                });
              }}
              disabled={updateStatusMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => {
                updateStatusMutation.mutate({
                  articleId: previewArticle.id,
                  status: 'published',
                });
              }}
              disabled={updateStatusMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

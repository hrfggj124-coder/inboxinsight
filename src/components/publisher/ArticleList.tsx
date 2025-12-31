import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Send,
  FileText 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleListProps {
  onEdit: (articleId: string) => void;
  onNew: () => void;
}

type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export const ArticleList = ({ onEdit, onNew }: ArticleListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['publisher-articles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories:category_id (name, slug)
        `)
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publisher-articles'] });
      toast({
        title: "Article deleted",
        description: "The article has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'pending' as ArticleStatus })
        .eq('id', articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publisher-articles'] });
      toast({
        title: "Submitted for review",
        description: "Your article has been submitted for admin review.",
      });
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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending: { variant: "outline", label: "Pending Review" },
      published: { variant: "default", label: "Published" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-semibold">Your Articles</h2>
          <p className="text-sm text-muted-foreground">
            {articles?.length || 0} articles total
          </p>
        </div>
        <Button onClick={onNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      {articles && articles.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-medium line-clamp-1 max-w-[300px]">
                      {article.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.categories?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(article.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(article.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.views_count || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(article.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {article.status === 'published' && (
                          <DropdownMenuItem asChild>
                            <a href={`/article/${article.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </DropdownMenuItem>
                        )}
                        {article.status === 'draft' && (
                          <DropdownMenuItem 
                            onClick={() => submitMutation.mutate(article.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit for Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(article.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No articles yet</h3>
          <p className="text-muted-foreground mb-6">
            Start writing your first article to share with the world.
          </p>
          <Button onClick={onNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Article
          </Button>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIToolsPanel } from "@/components/publisher/AIToolsPanel";
import { Save, Send, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ArticleEditorProps {
  articleId: string | null;
  onClose: () => void;
}

type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export const ArticleEditor = ({ articleId, onClose }: ArticleEditorProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch article if editing
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  // Populate form when article loads
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setContent(article.content || "");
      setExcerpt(article.excerpt || "");
      setCategoryId(article.category_id || "");
      setCoverImage(article.cover_image || "");
      setSeoTitle(article.seo_title || "");
      setSeoDescription(article.seo_description || "");
      setSeoKeywords(article.seo_keywords || []);
    } else if (!articleId) {
      // Reset form for new article
      setTitle("");
      setContent("");
      setExcerpt("");
      setCategoryId("");
      setCoverImage("");
      setSeoTitle("");
      setSeoDescription("");
      setSeoKeywords([]);
    }
  }, [article, articleId]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const saveMutation = useMutation({
    mutationFn: async (status: ArticleStatus) => {
      const slug = generateSlug(title);
      const readTime = Math.ceil(content.split(/\s+/).length / 200);
      
      const articleData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 160),
        slug,
        category_id: categoryId || null,
        cover_image: coverImage || null,
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt || content.substring(0, 160),
        seo_keywords: seoKeywords,
        read_time: readTime,
        status,
        author_id: user?.id,
      };

      if (articleId) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert(articleData);
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['publisher-articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      
      const message = status === 'pending' 
        ? "Article submitted for review" 
        : "Article saved as draft";
      
      toast({
        title: "Success",
        description: message,
      });
      
      if (status === 'pending') {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => saveMutation.mutate('draft');
  const handleSubmit = () => saveMutation.mutate('pending');

  const handleApplyHeadline = (headline: string) => {
    setTitle(headline);
  };

  const handleApplySEO = (seo: { title: string; description: string; keywords: string[] }) => {
    setSeoTitle(seo.title);
    setSeoDescription(seo.description);
    setSeoKeywords(seo.keywords);
  };

  const handleApplySummary = (summary: string) => {
    setExcerpt(summary);
  };

  const handleApplyContent = (improvedContent: string) => {
    setContent(improvedContent);
  };

  if (isLoading && articleId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={saveMutation.isPending || !title}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !title || !content}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit for Review
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here..."
              rows={15}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* SEO Section */}
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="font-display font-semibold">SEO Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO optimized title..."
              />
              <p className="text-xs text-muted-foreground">
                {seoTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">Meta Description</Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="SEO meta description..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {seoDescription.length}/160 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoKeywords">Keywords (comma-separated)</Label>
              <Input
                id="seoKeywords"
                value={seoKeywords.join(", ")}
                onChange={(e) => setSeoKeywords(e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                placeholder="AI, technology, innovation..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Tools Sidebar */}
      <div className="lg:col-span-1">
        <AIToolsPanel
          title={title}
          content={content}
          onApplyHeadline={handleApplyHeadline}
          onApplySEO={handleApplySEO}
          onApplySummary={handleApplySummary}
          onApplyContent={handleApplyContent}
        />
      </div>
    </div>
  );
};

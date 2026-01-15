import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIToolsPanel } from "@/components/publisher/AIToolsPanel";
import { RSSImportDialog } from "@/components/publisher/RSSImportDialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { HTMLContent } from "@/components/articles/HTMLContent";
import { Save, Send, ArrowLeft, Loader2, Eye, Code } from "lucide-react";
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
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

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
      setSourceName(article.source_name || "");
      setSourceUrl(article.source_url || "");
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
      setSourceName("");
      setSourceUrl("");
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
        source_name: sourceName || null,
        source_url: sourceUrl || null,
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

  const handleRSSImport = (data: {
    title: string;
    content: string;
    excerpt: string;
    sourceName: string;
    sourceUrl: string;
  }) => {
    setTitle(data.title);
    setContent(data.content);
    setExcerpt(data.excerpt);
    setSourceName(data.sourceName);
    setSourceUrl(data.sourceUrl);
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
            {!articleId && <RSSImportDialog onImport={handleRSSImport} />}
          </div>
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

        {/* Source Attribution Notice */}
        {sourceName && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Imported from:</span>
              <span className="font-medium">{sourceName}</span>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-auto"
                >
                  View Original
                </a>
              )}
            </div>
          </div>
        )}

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
            <Label>Content (supports HTML)</Label>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="edit" className="gap-2">
                  <Code className="h-4 w-4" /> Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-0">
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article content here... You can use HTML tags for formatting."
                  rows={15}
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supports HTML: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;blockquote&gt;, &lt;a&gt;, &lt;img&gt;, and more.
                </p>
              </TabsContent>
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[400px] border border-border rounded-md p-4 bg-background overflow-auto">
                  {content ? (
                    <HTMLContent content={content} />
                  ) : (
                    <p className="text-muted-foreground italic">No content to preview</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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

            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              label="Cover Image"
            />
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

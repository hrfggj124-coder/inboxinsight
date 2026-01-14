import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Rss, ExternalLink, Loader2, RefreshCw, Play } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category_id: string | null;
  is_active: boolean;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  created_at: string;
}

export const RSSFeedManager = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category_id: "",
    is_active: true,
    fetch_interval_minutes: 60,
  });

  const { data: feeds, isLoading } = useQuery({
    queryKey: ['admin-rss-feeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_feeds')
        .select(`
          *,
          categories:category_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const feedData = {
        name: formData.name,
        url: formData.url,
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        fetch_interval_minutes: formData.fetch_interval_minutes,
      };

      if (editingFeed) {
        const { error } = await supabase
          .from('rss_feeds')
          .update(feedData)
          .eq('id', editingFeed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rss_feeds')
          .insert(feedData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rss-feeds'] });
      toast({
        title: editingFeed ? "Feed updated" : "Feed added",
        description: editingFeed 
          ? "RSS feed has been updated successfully."
          : "RSS feed has been added successfully.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (feedId: string) => {
      const { error } = await supabase
        .from('rss_feeds')
        .delete()
        .eq('id', feedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rss-feeds'] });
      toast({
        title: "Feed deleted",
        description: "RSS feed has been removed.",
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

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ feedId, isActive }: { feedId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('rss_feeds')
        .update({ is_active: isActive })
        .eq('id', feedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rss-feeds'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchFeedMutation = useMutation({
    mutationFn: async (feedId?: string) => {
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: feedId ? { feed_id: feedId } : {}
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rss-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['rss-items'] });
      toast({
        title: "RSS Fetched",
        description: `Added ${data.totalItemsAdded} new items from ${data.processed} feed(s).`,
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

  const handleOpenDialog = (feed?: RSSFeed) => {
    if (feed) {
      setEditingFeed(feed);
      setFormData({
        name: feed.name,
        url: feed.url,
        category_id: feed.category_id || "",
        is_active: feed.is_active,
        fetch_interval_minutes: feed.fetch_interval_minutes || 60,
      });
    } else {
      setEditingFeed(null);
      setFormData({
        name: "",
        url: "",
        category_id: "",
        is_active: true,
        fetch_interval_minutes: 60,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFeed(null);
    setFormData({
      name: "",
      url: "",
      category_id: "",
      is_active: true,
      fetch_interval_minutes: 60,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-semibold">RSS Feeds</h2>
          <p className="text-sm text-muted-foreground">
            {feeds?.length || 0} feeds configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => fetchFeedMutation.mutate(undefined)}
            disabled={fetchFeedMutation.isPending}
            className="gap-2"
          >
            {fetchFeedMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Fetch All
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Feed
          </Button>
        </div>
      </div>

      {feeds && feeds.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Last Fetched</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds.map((feed: any) => (
                <TableRow key={feed.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feed.name}</span>
                      <a 
                        href={feed.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {feed.categories?.name || 'None'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {feed.fetch_interval_minutes} min
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {feed.last_fetched_at 
                      ? format(new Date(feed.last_fetched_at), 'MMM d, HH:mm')
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={feed.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ feedId: feed.id, isActive: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => fetchFeedMutation.mutate(feed.id)}
                        disabled={fetchFeedMutation.isPending}
                        title="Fetch this feed"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(feed)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(feed.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
          <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No RSS feeds</h3>
          <p className="text-muted-foreground mb-6">
            Add RSS feeds to automatically import content.
          </p>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Feed
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeed ? 'Edit Feed' : 'Add RSS Feed'}</DialogTitle>
            <DialogDescription>
              {editingFeed 
                ? 'Update the RSS feed configuration.'
                : 'Add a new RSS feed to import content automatically.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feed Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tech News RSS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Feed URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/rss.xml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Default Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
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
              <Label htmlFor="interval">Fetch Interval (minutes)</Label>
              <Input
                id="interval"
                type="number"
                value={formData.fetch_interval_minutes}
                onChange={(e) => setFormData({ ...formData, fetch_interval_minutes: parseInt(e.target.value) || 60 })}
                min={15}
                max={1440}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.name || !formData.url}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFeed ? 'Update' : 'Add Feed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

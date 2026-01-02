import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Settings, Users, Shield, Bell, Globe, Palette, 
  Save, RefreshCw, CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AppSettings {
  site_name: string;
  site_description: string;
  allow_comments: boolean;
  require_approval: boolean;
  allow_registrations: boolean;
  allow_publisher_applications: boolean;
  featured_articles_count: number;
  articles_per_page: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  site_name: 'TechPulse',
  site_description: 'Your source for tech news and insights',
  allow_comments: true,
  require_approval: true,
  allow_registrations: true,
  allow_publisher_applications: true,
  featured_articles_count: 5,
  articles_per_page: 10,
};

export const SettingsPanel = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings from html_snippets as a simple key-value store
  const { isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('html_snippets')
        .select('*')
        .eq('location', 'settings')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.code) {
        try {
          const parsed = JSON.parse(data.code);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          return parsed;
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
      return DEFAULT_SETTINGS;
    },
  });

  const { data: roleStats } = useQuery({
    queryKey: ['role-stats'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role');
      
      if (error) throw error;
      
      const counts = {
        admin: 0,
        publisher: 0,
        reader: 0,
      };
      
      roles?.forEach(r => {
        if (r.role in counts) {
          counts[r.role as keyof typeof counts]++;
        }
      });
      
      return counts;
    },
  });

  const { data: contentStats } = useQuery({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const [articlesRes, categoriesRes, commentsRes] = await Promise.all([
        supabase.from('articles').select('status', { count: 'exact' }),
        supabase.from('categories').select('*', { count: 'exact' }),
        supabase.from('comments').select('*', { count: 'exact' }),
      ]);
      
      const articles = articlesRes.data || [];
      const published = articles.filter(a => a.status === 'published').length;
      const pending = articles.filter(a => a.status === 'pending').length;
      const draft = articles.filter(a => a.status === 'draft').length;
      
      return {
        total_articles: articlesRes.count || 0,
        published,
        pending,
        draft,
        categories: categoriesRes.count || 0,
        comments: commentsRes.count || 0,
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      // Check if settings record exists
      const { data: existing } = await supabase
        .from('html_snippets')
        .select('id')
        .eq('location', 'settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('html_snippets')
          .update({ 
            code: JSON.stringify(newSettings),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('html_snippets')
          .insert({
            name: 'App Settings',
            location: 'settings',
            code: JSON.stringify(newSettings),
            is_active: true,
            priority: 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ 
        title: "Settings saved", 
        description: "Your settings have been updated successfully." 
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="destructive">{roleStats?.admin || 0} Admins</Badge>
              <Badge variant="default">{roleStats?.publisher || 0} Publishers</Badge>
              <Badge variant="secondary">{roleStats?.reader || 0} Readers</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Content Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">{contentStats?.published || 0} Published</Badge>
              <Badge variant="outline">{contentStats?.pending || 0} Pending</Badge>
              <Badge variant="secondary">{contentStats?.draft || 0} Drafts</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Site Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{contentStats?.categories || 0} Categories</Badge>
              <Badge variant="outline">{contentStats?.comments || 0} Comments</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Application Settings
              </CardTitle>
              <CardDescription>
                Configure your site's behavior and appearance
              </CardDescription>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="h-3 w-3" />
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="general">
            <AccordionItem value="general">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  General Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      placeholder="Your site name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description</Label>
                    <Input
                      id="site_description"
                      value={settings.site_description}
                      onChange={(e) => updateSetting('site_description', e.target.value)}
                      placeholder="Brief description of your site"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="content">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Content Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable commenting on articles
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow_comments}
                      onCheckedChange={(val) => updateSetting('allow_comments', val)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Article Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Publishers must submit articles for review
                      </p>
                    </div>
                    <Switch
                      checked={settings.require_approval}
                      onCheckedChange={(val) => updateSetting('require_approval', val)}
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="featured_count">Featured Articles Count</Label>
                      <Input
                        id="featured_count"
                        type="number"
                        min="1"
                        max="20"
                        value={settings.featured_articles_count}
                        onChange={(e) => updateSetting('featured_articles_count', parseInt(e.target.value) || 5)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="per_page">Articles Per Page</Label>
                      <Input
                        id="per_page"
                        type="number"
                        min="5"
                        max="50"
                        value={settings.articles_per_page}
                        onChange={(e) => updateSetting('articles_per_page', parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="users">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        New users can create accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow_registrations}
                      onCheckedChange={(val) => updateSetting('allow_registrations', val)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Publisher Applications</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can apply to become publishers
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow_publisher_applications}
                      onCheckedChange={(val) => updateSetting('allow_publisher_applications', val)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

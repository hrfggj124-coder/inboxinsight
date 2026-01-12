import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Code, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface HTMLSnippet {
  id: string;
  name: string;
  location: string;
  code: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_CODE_LENGTH = 50000;
const MIN_CODE_LENGTH = 1;

// Trusted ad network domains - scripts from these sources are allowed
const TRUSTED_SCRIPT_DOMAINS = [
  'googletagmanager.com',
  'googlesyndication.com',
  'google-analytics.com',
  'googleadservices.com',
  'adsterra.com',
  'effectivegatecpm.com', // Adsterra CDN
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'analytics.tiktok.com',
];

// Check if a script tag uses a trusted domain
const isScriptFromTrustedDomain = (code: string): boolean => {
  // Match script tags with src attributes
  const scriptSrcRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = scriptSrcRegex.exec(code)) !== null) {
    const srcUrl = match[1];
    const isTrusted = TRUSTED_SCRIPT_DOMAINS.some(domain => 
      srcUrl.includes(domain)
    );
    if (!isTrusted) {
      return false;
    }
  }
  
  return true;
};

// Check if code contains inline scripts (not just external script tags)
const hasInlineScripts = (code: string): boolean => {
  // Check for script tags with content (not just src)
  const inlineScriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
  const matches = code.match(inlineScriptRegex) || [];
  
  for (const match of matches) {
    // If script has content but no src, it's inline
    if (!match.includes('src=') && match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim().length > 0) {
      return true;
    }
  }
  return false;
};

// Forbidden patterns for security - dangerous inline JavaScript
const FORBIDDEN_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /javascript:/i, message: "JavaScript URLs are not allowed for security reasons." },
  { pattern: /on\w+\s*=/i, message: "Inline event handlers (onclick, onerror, etc.) are not allowed for security reasons." },
  { pattern: /data:text\/html/i, message: "Data URLs with HTML content are not allowed for security reasons." },
  { pattern: /<object\b/i, message: "Object tags are not allowed for security reasons." },
  { pattern: /<embed\b/i, message: "Embed tags are not allowed for security reasons. Use iframe instead." },
  { pattern: /eval\s*\(/i, message: "The eval() function is not allowed for security reasons." },
];

// Check if code contains forbidden patterns
const containsForbiddenPatterns = (code: string): string | null => {
  // Check inline scripts first
  if (hasInlineScripts(code)) {
    return "Inline scripts are not allowed. Only external scripts from trusted ad networks are permitted.";
  }
  
  // Check for script tags from untrusted sources
  if (/<script\b/i.test(code) && !isScriptFromTrustedDomain(code)) {
    return "Script tags are only allowed from trusted ad networks (Google, Adsterra, Facebook, TikTok). Use iframe-based embeds for other sources.";
  }
  
  // Check other forbidden patterns
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return message;
    }
  }
  
  return null;
};

// Validation helper
const validateSnippet = (name: string, code: string): string | null => {
  if (!name || name.trim().length === 0) {
    return "Name is required";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  }
  if (!code || code.trim().length < MIN_CODE_LENGTH) {
    return "Code is required";
  }
  if (code.length > MAX_CODE_LENGTH) {
    return `Code must be ${MAX_CODE_LENGTH} characters or less`;
  }
  
  // Security check - validate script sources and patterns
  const securityError = containsForbiddenPatterns(code);
  if (securityError) {
    return securityError;
  }
  
  return null;
};

const LOCATIONS = [
  { value: 'header', label: 'Header (before </head>)' },
  { value: 'body-start', label: 'Body Start (after <body>)' },
  { value: 'body-end', label: 'Body End (before </body>)' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'in-content', label: 'In-Content' },
  { value: 'footer', label: 'Footer' },
  { value: 'custom', label: 'Custom' },
];

export const HTMLSnippets = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<HTMLSnippet | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "header",
    code: "",
    is_active: true,
    priority: 0,
  });

  const { data: snippets, isLoading } = useQuery({
    queryKey: ['admin-html-snippets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('html_snippets')
        .select('*')
        .order('location')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as HTMLSnippet[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs before saving
      const error = validateSnippet(formData.name, formData.code);
      if (error) {
        throw new Error(error);
      }

      const snippetData = {
        name: formData.name.trim().substring(0, MAX_NAME_LENGTH),
        location: formData.location,
        code: formData.code.substring(0, MAX_CODE_LENGTH),
        is_active: formData.is_active,
        priority: Math.max(0, Math.min(1000, formData.priority)), // Limit priority range
      };

      if (editingSnippet) {
        const { error } = await supabase
          .from('html_snippets')
          .update(snippetData)
          .eq('id', editingSnippet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('html_snippets')
          .insert(snippetData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-html-snippets'] });
      toast({
        title: editingSnippet ? "Snippet updated" : "Snippet added",
        description: editingSnippet 
          ? "HTML snippet has been updated successfully."
          : "HTML snippet has been added successfully.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      setValidationError(error instanceof Error ? error.message : "An error occurred");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      const { error } = await supabase
        .from('html_snippets')
        .delete()
        .eq('id', snippetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-html-snippets'] });
      toast({
        title: "Snippet deleted",
        description: "HTML snippet has been removed.",
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
    mutationFn: async ({ snippetId, isActive }: { snippetId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('html_snippets')
        .update({ is_active: isActive })
        .eq('id', snippetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-html-snippets'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (snippet?: HTMLSnippet) => {
    if (snippet) {
      setEditingSnippet(snippet);
      setFormData({
        name: snippet.name,
        location: snippet.location,
        code: snippet.code,
        is_active: snippet.is_active,
        priority: snippet.priority,
      });
    } else {
      setEditingSnippet(null);
      setFormData({
        name: "",
        location: "header",
        code: "",
        is_active: true,
        priority: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSnippet(null);
    setValidationError(null);
    setFormData({
      name: "",
      location: "header",
      code: "",
      is_active: true,
      priority: 0,
    });
  };

  const getLocationLabel = (location: string) => {
    return LOCATIONS.find(l => l.value === location)?.label || location;
  };

  const getLocationBadgeVariant = (location: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      header: "default",
      'body-start': "secondary",
      'body-end': "secondary",
      sidebar: "outline",
      'in-content': "outline",
      footer: "secondary",
      custom: "outline",
    };
    return variants[location] || "outline";
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
          <h2 className="font-display text-xl font-semibold">HTML Snippets</h2>
          <p className="text-sm text-muted-foreground">
            Add ad codes, tracking scripts, and custom HTML
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Snippet
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h3 className="font-medium text-sm mb-2">Placement Guide</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li><strong>Header:</strong> Analytics, meta tags, CSS (injected in &lt;head&gt;)</li>
          <li><strong>Body Start:</strong> Tracking pixels, above-the-fold scripts</li>
          <li><strong>Body End:</strong> AdSense, deferred scripts</li>
          <li><strong>Sidebar/In-Content/Footer:</strong> Display ads in specific locations</li>
        </ul>
      </div>

      {snippets && snippets.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snippets.map((snippet) => (
                <TableRow key={snippet.id} className="hover:bg-muted/20">
                  <TableCell>
                    <span className="font-medium">{snippet.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLocationBadgeVariant(snippet.location)}>
                      {getLocationLabel(snippet.location)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {snippet.priority}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(snippet.updated_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={snippet.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ snippetId: snippet.id, isActive: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(snippet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(snippet.id)}
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
          <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No HTML snippets</h3>
          <p className="text-muted-foreground mb-6">
            Add ad codes, tracking scripts, or custom HTML.
          </p>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Snippet
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? 'Edit Snippet' : 'Add HTML Snippet'}</DialogTitle>
            <DialogDescription>
              {editingSnippet 
                ? 'Update the HTML snippet configuration.'
                : 'Add a new HTML snippet for ads, tracking, or custom functionality.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Security Warning */}
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>Security Notice:</strong> Only add trusted code from verified sources. 
                Malicious scripts can compromise your site and users.
              </AlertDescription>
            </Alert>

            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Snippet Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setValidationError(null);
                    setFormData({ ...formData, name: e.target.value.substring(0, MAX_NAME_LENGTH) });
                  }}
                  placeholder="Google AdSense Header"
                  maxLength={MAX_NAME_LENGTH}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/{MAX_NAME_LENGTH} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">HTML Code</Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) => {
                  setValidationError(null);
                  setFormData({ ...formData, code: e.target.value.substring(0, MAX_CODE_LENGTH) });
                }}
                placeholder="<script>...</script>"
                className="font-mono text-sm min-h-[200px]"
                maxLength={MAX_CODE_LENGTH}
              />
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Only add code from trusted sources like Google AdSense, Analytics, etc.
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.code.length.toLocaleString()}/{MAX_CODE_LENGTH.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (higher = first, max 1000)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  max={1000}
                  value={formData.priority}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    priority: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) 
                  })}
                />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.name || !formData.code}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSnippet ? 'Update' : 'Add Snippet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

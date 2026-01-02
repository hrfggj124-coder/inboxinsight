import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, FolderPlus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16'
];

export const CategoryManagement = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description: string | null; color: string | null }) => {
      const { error } = await supabase
        .from('categories')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Category created", description: "New category has been added." });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Category updated", description: "Category has been updated." });
      closeDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: "Category deleted", description: "Category has been removed." });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '', color: DEFAULT_COLORS[0] });
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0],
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    const slug = generateSlug(formData.name);
    
    if (selectedCategory) {
      updateMutation.mutate({
        id: selectedCategory.id,
        data: {
          name: formData.name,
          slug,
          description: formData.description || null,
          color: formData.color,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        slug,
        description: formData.description || null,
        color: formData.color,
      });
    }
  };

  const autoGenerateCategories = async () => {
    setIsAutoGenerating(true);
    
    const defaultCategories = [
      { name: 'Technology', description: 'Latest tech news, gadgets, and innovations', color: '#3B82F6' },
      { name: 'Business', description: 'Business strategies, startups, and market trends', color: '#10B981' },
      { name: 'Science', description: 'Scientific discoveries and research', color: '#8B5CF6' },
      { name: 'Health', description: 'Health tips, medical news, and wellness', color: '#EF4444' },
      { name: 'Entertainment', description: 'Movies, music, gaming, and pop culture', color: '#EC4899' },
      { name: 'Sports', description: 'Sports news, scores, and analysis', color: '#F59E0B' },
      { name: 'Lifestyle', description: 'Lifestyle tips, travel, and personal development', color: '#06B6D4' },
      { name: 'Opinion', description: 'Editorial pieces and opinion columns', color: '#84CC16' },
    ];

    const existingSlugs = categories?.map(c => c.slug) || [];
    const newCategories = defaultCategories
      .filter(cat => !existingSlugs.includes(generateSlug(cat.name)))
      .map(cat => ({
        name: cat.name,
        slug: generateSlug(cat.name),
        description: cat.description,
        color: cat.color,
      }));

    if (newCategories.length === 0) {
      toast({ title: "Info", description: "All default categories already exist." });
      setIsAutoGenerating(false);
      return;
    }

    try {
      const { error } = await supabase.from('categories').insert(newCategories);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ 
        title: "Categories created", 
        description: `${newCategories.length} categories have been auto-generated.` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAutoGenerating(false);
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">
            {categories?.length || 0} categories total
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={autoGenerateCategories}
            disabled={isAutoGenerating}
          >
            {isAutoGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Auto Generate
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {categories && categories.length > 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => openDeleteDialog(category)}
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
          <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">
            Create categories to organize your articles.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Update the category details.' : 'Create a new category for articles.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

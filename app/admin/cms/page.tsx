"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { listPages, savePage, deletePage } from "@/lib/cms.functions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: async () => {
      const res = await listPages();
      return Array.isArray(res) ? res : [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: savePage,
    onSuccess: () => {
      toast.success(editId ? "Page updated" : "Page created");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save page");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      toast.success("Page deleted");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    }
  });

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setPublished(false);
  };

  const handleCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (page: any) => {
    setEditId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setPublished(Boolean(page.published));
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error("Title and slug are required");
      return;
    }
    saveMutation.mutate({ data: { id: editId, title, slug, content, published } });
  };

  return (
    <AppShell 
      title="Content Management" 
      subtitle="Manage pages and content for your application."
      actions={
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Page
        </Button>
      }
    >
      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Page" : "Create Page"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col pt-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={title} onChange={e => {
                  setTitle(e.target.value);
                  if (!editId && !slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }
                }} placeholder="e.g. Terms of Service" />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL path)</Label>
                <Input required value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. terms-of-service" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="published">Publish (make available to public)</Label>
            </div>

            <div className="flex-1 space-y-2 flex flex-col">
              <Label>Content (Markdown or HTML)</Label>
              <Textarea 
                className="flex-1 font-mono resize-none min-h-[300px]" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Write your page content here..."
              />
            </div>

            <div className="flex justify-end pt-4 mt-auto">
              <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pages.length === 0 ? (
          <Card className="shadow-sm border-border w-full">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display">No Pages Found</h3>
                <p className="mt-2 text-muted-foreground max-w-[300px]">Create your first page to get started with the CMS.</p>
                <Button variant="outline" className="mt-6" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Page
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">/{page.slug}</TableCell>
                      <TableCell>
                        {page.published ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <Globe className="w-3.5 h-3.5" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            <Lock className="w-3.5 h-3.5" />
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                          if (confirm("Are you sure you want to delete this page?")) {
                            deleteMutation.mutate({ data: { id: page.id } });
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

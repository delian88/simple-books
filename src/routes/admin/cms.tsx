import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPages, upsertPage, deletePage } from "@/lib/cms.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/cms")({
  component: CmsDashboard,
});

function CmsDashboard() {
  const queryClient = useQueryClient();
  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin_pages"],
    queryFn: () => listPages(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePage({ data: { id } }),
    onSuccess: () => {
      toast.success("Page deleted");
      queryClient.invalidateQueries({ queryKey: ["admin_pages"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppShell title="Content Management">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CMS</h1>
            <p className="text-muted-foreground">Manage dynamic pages for the website.</p>
          </div>
          <PageDialog mode="create" />
        </div>

        <Card>
          <CardContent className="pt-6">
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
                {pages?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No pages found.</TableCell>
                  </TableRow>
                )}
                {pages?.map((page: any) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell>/{page.slug}</TableCell>
                    <TableCell>{page.published ? "Published" : "Draft"}</TableCell>
                    <TableCell>{new Date(page.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <PageDialog mode="edit" initialData={page} />
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm("Are you sure?")) deleteMutation.mutate(page.id);
                      }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function PageDialog({ mode, initialData }: { mode: "create" | "edit", initialData?: any }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    published: initialData?.published || false,
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => upsertPage({ data }),
    onSuccess: () => {
      toast.success(`Page ${mode === "create" ? "created" : "updated"}`);
      queryClient.invalidateQueries({ queryKey: ["admin_pages"] });
      setOpen(false);
      if (mode === "create") setFormData({ title: "", slug: "", content: "", published: false });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "outline"} size="sm">
          {mode === "create" ? "Add New Page" : "Edit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Page" : "Edit Page"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Content (HTML/Markdown)</Label>
            <Textarea 
              rows={10} 
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })} 
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={formData.published} onCheckedChange={c => setFormData({ ...formData, published: c })} />
            <Label>Published</Label>
          </div>
          <Button 
            onClick={() => mutation.mutate({ id: initialData?.id, ...formData })} 
            disabled={mutation.isPending}
            className="w-full"
          >
            Save Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

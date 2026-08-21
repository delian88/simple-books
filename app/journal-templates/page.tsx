"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyPlus, Plus, Trash2 } from "lucide-react";
import { listAccounts } from "@/lib/accounting.functions";
import { listJournalTemplates, createJournalTemplate } from "@/lib/ledger.functions";
import { toast } from "sonner";

export default function JournalTemplatesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([{ accountId: "", debitRatio: 0, creditRatio: 0 }]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await listAccounts();
      return Array.isArray(res) ? res : [];
    }
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["journal-templates"],
    queryFn: async () => {
      const res = await listJournalTemplates();
      return Array.isArray(res) ? res : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: createJournalTemplate,
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["journal-templates"] });
      setOpen(false);
      setName("");
      setDescription("");
      setLines([{ accountId: "", debitRatio: 0, creditRatio: 0 }]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create template");
    }
  });

  const handleAddLine = () => {
    setLines([...lines, { accountId: "", debitRatio: 0, creditRatio: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (lines.some(l => !l.accountId)) {
      toast.error("All template lines must have an account selected");
      return;
    }
    createMutation.mutate({ data: { name, description, lines } });
  };

  return (
    <AppShell 
      title="Journal Templates" 
      subtitle="Manage reusable templates for common journal entries."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create Journal Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Rent" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Template Lines (Use ratios like 100 or 1 for amounts)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </div>
                
                {lines.map((line, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Account</Label>
                      <Select value={line.accountId} onValueChange={(val) => updateLine(index, 'accountId', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Debit Ratio</Label>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={line.debitRatio} 
                        onChange={(e) => updateLine(index, 'debitRatio', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Credit Ratio</Label>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={line.creditRatio} 
                        onChange={(e) => updateLine(index, 'creditRatio', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-destructive" onClick={() => handleRemoveLine(index)} disabled={lines.length <= 2}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-6 mt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="shadow-sm border-border w-full">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                    <CopyPlus className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display">No Templates</h3>
                <p className="mt-2 text-muted-foreground max-w-[300px]">Create templates for journal entries you record often.</p>
                <Button variant="outline" className="mt-6" onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && <CardDescription>{template.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Lines</div>
                    {template.templateLines?.map((line: any) => (
                      <div key={line.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-medium">{line.account?.name || 'Unknown Account'}</span>
                        <div className="flex gap-4 text-muted-foreground font-mono">
                          {line.debitRatio > 0 && <span>DR: {line.debitRatio}</span>}
                          {line.creditRatio > 0 && <span>CR: {line.creditRatio}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

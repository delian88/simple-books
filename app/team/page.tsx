"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { listMembers, inviteMember, updateMemberRole, removeMember } from "@/lib/modules.functions";

export default function TeamPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "ACCOUNTANT", password: "" });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const r = await listMembers();
      return Array.isArray(r) ? r : [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["team-members"] });

  const inviteMut = useMutation({
    mutationFn: () => inviteMember(form),
    onSuccess: () => {
      refresh();
      setOpen(false);
      setForm({ email: "", role: "ACCOUNTANT", password: "" });
      toast.success("Team member invited");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateMemberRole(id, role),
    onSuccess: () => {
      refresh();
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      refresh();
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Team & Accountant Access"
      subtitle="Collaborate live with your CA, bookkeeper, staff or read-only auditor."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2">
              <UserPlus className="h-4 w-4" /> Invite Accountant / Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                inviteMut.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required placeholder="ca@firm.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="ACCOUNTANT">Accountant / CA (entries, reconciliation, reports)</option>
                  <option value="AUDITOR">Auditor (view-only, cannot edit or delete)</option>
                  <option value="STAFF">Staff (invoicing &amp; expenses)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Temporary Password (min 6 chars)</Label>
                <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={inviteMut.isPending} className="bg-[#0B3D2B] text-white">
                  {inviteMut.isPending ? "Inviting..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Owner</p><p className="text-xs text-muted-foreground mt-1">Full access to books, settings and team invites.</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-semibold">Accountant / CA</p><p className="text-xs text-muted-foreground mt-1">Post journals, reconcile banks and review tax summaries.</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="font-semibold">Auditor (Read-only)</p><p className="text-xs text-muted-foreground mt-1">Inspect every report and ledger; write requests are blocked.</p></CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.email}</TableCell>
                    <TableCell>
                      {m.role === "OWNER" ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">OWNER</span>
                      ) : (
                        <select
                          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                          value={m.role}
                          onChange={(e) => roleMut.mutate({ id: m.id, role: e.target.value })}
                        >
                          <option value="ACCOUNTANT">ACCOUNTANT</option>
                          <option value="AUDITOR">AUDITOR</option>
                          <option value="STAFF">STAFF</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{m.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {m.role !== "OWNER" && (
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => confirm("Remove this member?") && delMut.mutate(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

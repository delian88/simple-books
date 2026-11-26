"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listRecords, importBankLines, confirmLine, deleteRecord, money } from "@/lib/modules.functions";

function parseCsvLines(text: string) {
  const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!rows.length) return [];
  const split = (s: string) => s.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
  const header = split(rows[0]!).map((h) => h.toLowerCase());
  const hasHead = header.some((h) => /date|desc|narrat|amount|debit|credit/.test(h));
  const body = hasHead ? rows.slice(1) : rows;
  const idx = (rx: RegExp) => header.findIndex((h) => rx.test(h));
  const dIdx = hasHead ? Math.max(0, idx(/date/)) : 0;
  const nIdx = hasHead ? Math.max(1, idx(/desc|narrat|particular|detail/)) : 1;
  const crIdx = hasHead ? idx(/credit|deposit|inflow/) : -1;
  const drIdx = hasHead ? idx(/debit|withdraw|outflow/) : -1;
  const aIdx = hasHead ? idx(/amount|value/) : 2;

  const out: Array<{ date: string; narration: string; amount: number; direction: "inflow" | "outflow" }> = [];
  for (const line of body) {
    const c = split(line);
    let amt = 0;
    let dir: "inflow" | "outflow" = "outflow";
    if (crIdx >= 0 && Number((c[crIdx] || "").replace(/[^0-9.-]/g, "")) > 0) {
      amt = Number((c[crIdx] || "").replace(/[^0-9.-]/g, ""));
      dir = "inflow";
    } else if (drIdx >= 0 && Number((c[drIdx] || "").replace(/[^0-9.-]/g, "")) > 0) {
      amt = Number((c[drIdx] || "").replace(/[^0-9.-]/g, ""));
      dir = "outflow";
    } else {
      const raw = Number((c[aIdx >= 0 ? aIdx : c.length - 1] || "").replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(raw) || raw === 0) continue;
      dir = raw > 0 ? "inflow" : "outflow";
      amt = Math.abs(raw);
    }
    const dStr = c[dIdx] || new Date().toISOString().slice(0, 10);
    const parsed = new Date(dStr);
    const date = Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
    out.push({ date, narration: (c[nIdx] || "Bank transaction").slice(0, 140), amount: amt, direction: dir });
  }
  return out;
}

export default function BankReconciliationPage() {
  const qc = useQueryClient();
  const [cats, setCats] = useState<Record<string, string>>({});
  const [manual, setManual] = useState({ date: new Date().toISOString().slice(0, 10), narration: "", amount: "", direction: "inflow" as "inflow" | "outflow" });

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ["records", "bank_line"],
    queryFn: async () => {
      const res = await listRecords("bank_line");
      return Array.isArray(res) ? res : [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["records", "bank_line"] });

  const importMut = useMutation({
    mutationFn: importBankLines,
    onSuccess: (r: any) => {
      refresh();
      toast.success(`Imported: ${r.matched || 0} matched, ${r.categorised || 0} rule-categorised, ${r.review || 0} need review`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmMut = useMutation({
    mutationFn: ({ id, category }: { id: string; category?: string }) => confirmLine(id, category),
    onSuccess: () => {
      refresh();
      toast.success("Bank line reconciled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRecord("bank_line", id),
    onSuccess: refresh,
  });

  const onFile = async (file?: File) => {
    if (!file) return;
    const parsed = parseCsvLines(await file.text());
    if (!parsed.length) return toast.error("No valid statement lines found in CSV.");
    importMut.mutate(parsed);
  };

  const reconciledCount = lines.filter((l: any) => l.status === "reconciled").length;

  return (
    <AppShell
      title="Bank Reconciliation"
      subtitle="Upload statements, auto-match invoices & bills, apply bank rules and reconcile."
      actions={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <b>{reconciledCount}</b> / {lines.length} reconciled
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#0B3D2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B3D2B]/90">
            <Upload className="h-4 w-4" /> Import CSV Statement
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
      }
    >
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">Add a single bank statement line</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!manual.narration || !Number(manual.amount)) return;
              importMut.mutate([{ ...manual, amount: Number(manual.amount) }]);
              setManual((m) => ({ ...m, narration: "", amount: "" }));
            }}
          >
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={manual.date} onChange={(e) => setManual((m) => ({ ...m, date: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Bank Narration</Label>
              <Input placeholder="e.g. UPI/MERIDIAN DESIGN or GOOGLE WORKSPACE" value={manual.narration} onChange={(e) => setManual((m) => ({ ...m, narration: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Amount &amp; Type</Label>
              <div className="flex gap-2">
                <Input type="number" step="any" placeholder="Amount" value={manual.amount} onChange={(e) => setManual((m) => ({ ...m, amount: e.target.value }))} />
                <select className="h-9 rounded-md border border-input bg-transparent px-2 text-xs" value={manual.direction} onChange={(e) => setManual((m) => ({ ...m, direction: e.target.value as any }))}>
                  <option value="inflow">In (+)</option>
                  <option value="outflow">Out (−)</option>
                </select>
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={importMut.isPending} className="w-full bg-[#0B3D2B] text-white">
                Add &amp; Auto-Match
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : lines.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No imported bank lines yet. Upload a CSV statement or add a line above to auto-match against invoices, bills and bank rules.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Match / Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.date}</TableCell>
                    <TableCell className="font-medium">{l.narration}</TableCell>
                    <TableCell className={`text-right font-semibold ${l.direction === "inflow" ? "text-emerald-700" : "text-red-600"}`}>
                      {l.direction === "inflow" ? "+" : "−"}{money(l.amount)}
                    </TableCell>
                    <TableCell>
                      {l.match_ref ? (
                        <span className="text-xs font-medium text-emerald-800">{l.match_ref}</span>
                      ) : l.status === "reconciled" ? (
                        <span className="text-xs text-muted-foreground">{l.category}</span>
                      ) : (
                        <Input
                          className="h-8 w-44 text-xs"
                          placeholder="Category (e.g. Software)"
                          value={cats[l.id] ?? l.category ?? ""}
                          onChange={(e) => setCats((c) => ({ ...c, [l.id]: e.target.value }))}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.status === "reconciled" ? "bg-emerald-100 text-emerald-800" :
                        l.status === "matched" ? "bg-blue-100 text-blue-800" :
                        l.status === "categorised" ? "bg-purple-100 text-purple-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {l.status !== "reconciled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={confirmMut.isPending}
                            onClick={() => confirmMut.mutate({ id: l.id, category: cats[l.id] ?? l.category })}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Confirm
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => delMut.mutate(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

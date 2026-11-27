"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAccounts } from "@/lib/accounting.functions";
import { listRecords, postSimpleEntry, money } from "@/lib/modules.functions";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function SimpleAccountingPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    debit_account_id: "",
    credit_account_id: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["pb_records", "simple_entry"],
    queryFn: () => listRecords("simple_entry"),
  });

  const postMutation = useMutation({
    mutationFn: () =>
      postSimpleEntry({
        debit_account_id: form.debit_account_id,
        credit_account_id: form.credit_account_id,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        reference: form.reference || undefined,
      }),
    onSuccess: (res: any) => {
      setSuccessMsg(`Entry posted successfully! Reference: ${res.reference}`);
      setForm({
        debit_account_id: "",
        credit_account_id: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: "",
        reference: "",
      });
      qc.invalidateQueries({ queryKey: ["pb_records", "simple_entry"] });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["trial_balance"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to post accounting entry");
    },
  });

  const accountMap = new Map((Array.isArray(accounts) ? accounts : []).map((a: any) => [a.id, a]));

  return (
    <AppShell
      title="Simple Accounting Entries"
      subtitle="Easy double-entry bookkeeping with guaranteed debit and credit accuracy."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Creator Card */}
        <Card className="lg:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">New Accounting Entry</CardTitle>
            <CardDescription>
              Select accounts to debit and credit. Total debits will equal total credits automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-700 text-sm rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-emerald-700 font-semibold">Debit Account (Asset / Expense)</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1"
                value={form.debit_account_id}
                onChange={(e) => setForm({ ...form, debit_account_id: e.target.value })}
                required
              >
                <option value="">Select account to debit...</option>
                {(Array.isArray(accounts) ? accounts : []).map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div>
              <Label className="text-blue-700 font-semibold">Credit Account (Liability / Revenue / Equity)</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm mt-1"
                value={form.credit_account_id}
                onChange={(e) => setForm({ ...form, credit_account_id: e.target.value })}
                required
              >
                <option value="">Select account to credit...</option>
                {(Array.isArray(accounts) ? accounts : []).map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g. Office supplies purchased via Bank Transfer"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="e.g. JV-001"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>

            <Button
              className="w-full bg-[#0B3D2B] text-white hover:bg-[#145C42]"
              disabled={postMutation.isPending || !form.debit_account_id || !form.credit_account_id || !form.amount}
              onClick={() => postMutation.mutate()}
            >
              {postMutation.isPending ? "Posting..." : "Post Accounting Entry"}
            </Button>
          </CardContent>
        </Card>

        {/* Entries History Table */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Simple Entries</CardTitle>
            <CardDescription>
              Double-entry postings saved directly to your General Journal and General Ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No simple accounting entries yet. Create your first entry on the left.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.date}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {e.reference}
                        </span>
                      </TableCell>
                      <TableCell className="text-emerald-700 font-medium">
                        {accountMap.get(e.debit_account_id)?.name || "Debit Account"}
                      </TableCell>
                      <TableCell className="text-blue-700 font-medium">
                        {accountMap.get(e.credit_account_id)?.name || "Credit Account"}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{e.description}</TableCell>
                      <TableCell className="text-right font-semibold">{money(e.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

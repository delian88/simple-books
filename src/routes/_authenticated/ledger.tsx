import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listJournalEntries, approveJournalEntry, reverseJournalEntry } from "@/lib/ledger.functions";
import { useState, useRef } from "react";
import { CheckCircle, Undo2, Clock, FileText, Plus, UploadCloud, RefreshCw, Check } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ledger")({
  component: Ledger,
});

function Ledger() {
  const getJournals = useServerFn(listJournalEntries);
  const approve = useServerFn(approveJournalEntry);
  const reverse = useServerFn(reverseJournalEntry);
  const queryClient = useQueryClient();

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["journals"],
    queryFn: () => getJournals(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approve({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journals"] }),
  });

  const reverseMutation = useMutation({
    mutationFn: (id: string) => reverse({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journals"] }),
  });

  const [filter, setFilter] = useState("ALL");
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [reconcileResults, setReconcileResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredJournals = journals.filter(j => {
    if (filter === "ALL") return true;
    return j.status === filter;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      // Simple mock reconciliation algorithm
      const lines = csv.split('\n').filter(l => l.trim().length > 0);
      const matches = lines.slice(1).map((line, idx) => {
        const parts = line.split(',');
        const amount = parseFloat(parts[2]);
        // Find a matching journal within ±10% amount for demo
        const match = journals.find(j => {
          const total = j.lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
          return Math.abs(total - amount) < (amount * 0.1);
        });

        return {
          id: idx,
          date: parts[0],
          desc: parts[1],
          amount: amount,
          matched: !!match,
          confidence: match ? 98 : 0,
          journalId: match?.id
        };
      });
      setReconcileResults(matches);
      toast.success("Bank statement analyzed.");
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading ledger...</div>;

  return (
    <AppShell
      title="General Ledger"
      subtitle="View and manage all journal entries."
      actions={
        <div className="flex gap-4">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="ALL">All Entries</option>
            <option value="POSTED">Posted</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="REVERSED">Reversed</option>
          </select>
          <Button onClick={() => setReconcileModalOpen(true)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2">
            <RefreshCw className="w-4 h-4" /> Smart Reconcile
          </Button>
          <Link to="/journal-entry-new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-emerald-500/25 flex items-center gap-2 text-sm">
            <Plus size={16} /> New Journal Entry
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 animate-in fade-in duration-500">
        {filteredJournals.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
            No journal entries found.
          </div>
        ) : (
          filteredJournals.map(journal => (
            <div key={journal.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{journal.description}</h3>
                    <div className="flex gap-3 text-sm text-gray-500 mt-1">
                      <span>{format(new Date(journal.date), "MMM d, yyyy")}</span>
                      {journal.reference && <span>• Ref: {journal.reference}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {journal.status === "POSTED" && (
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200">
                      POSTED
                    </span>
                  )}
                  {journal.status === "PENDING_APPROVAL" && (
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  )}
                  {journal.status === "REVERSED" && (
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-200">
                      REVERSED
                    </span>
                  )}

                  {journal.status === "PENDING_APPROVAL" && (
                    <button 
                      onClick={() => approveMutation.mutate(journal.id)}
                      disabled={approveMutation.isPending}
                      className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                      title="Approve Entry"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {journal.status === "POSTED" && !journal.reversalId && (
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to reverse this entry?")) {
                          reverseMutation.mutate(journal.id);
                        }
                      }}
                      disabled={reverseMutation.isPending}
                      className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                      title="Reverse Entry"
                    >
                      <Undo2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-lg border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium text-right">Debit</th>
                      <th className="px-4 py-3 font-medium text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {journal.lines.map((line: any) => (
                      <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-gray-500 mr-2 bg-gray-100 px-1.5 py-0.5 rounded">{line.account.code}</span>
                          <span className="text-gray-900 font-medium">{line.account.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : '-'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="font-semibold text-gray-900 bg-gray-50/50 border-t-2 border-gray-100">
                      <td className="px-4 py-3 text-right">Totals:</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {journal.lines.reduce((sum: number, l: any) => sum + Number(l.debit), 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {journal.lines.reduce((sum: number, l: any) => sum + Number(l.credit), 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={reconcileModalOpen} onOpenChange={setReconcileModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" /> Smart Reconciliation
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {!reconcileResults ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <UploadCloud className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-blue-800 mb-1">Upload Bank Statement (CSV)</p>
                <p className="text-xs text-blue-600/70">Format: Date, Description, Amount</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Analyzed {reconcileResults.length} transactions from your bank statement.</p>
                </div>
                {reconcileResults.map((res: any) => (
                  <div key={res.id} className="p-3 border rounded-lg flex items-center justify-between bg-white">
                    <div>
                      <p className="font-medium text-sm">{res.desc}</p>
                      <p className="text-xs text-gray-500">{res.date} • ₦{res.amount.toFixed(2)}</p>
                    </div>
                    {res.matched ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                          <Check className="h-3 w-3" /> {res.confidence}% MATCH
                        </span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          UNMATCHED
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setReconcileResults(null)}>Reset</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                    toast.success("Reconciliation complete.");
                    setReconcileModalOpen(false);
                  }}>
                    Approve Matches
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

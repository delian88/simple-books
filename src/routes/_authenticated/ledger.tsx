import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listJournalEntries, approveJournalEntry, reverseJournalEntry } from "@/lib/ledger.functions";
import { useState } from "react";
import { CheckCircle, Undo2, Clock, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

import { AppShell } from "@/components/AppShell";

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

  const filteredJournals = journals.filter(j => {
    if (filter === "ALL") return true;
    return j.status === filter;
  });

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
    </AppShell>
  );
}

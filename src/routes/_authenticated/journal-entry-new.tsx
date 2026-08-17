import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createJournalEntry } from "@/lib/ledger.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/journal-entry-new")({
  component: NewJournalEntry,
});

function NewJournalEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getAccounts = useServerFn(listAccounts);
  const saveJournal = useServerFn(createJournalEntry);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
  });

  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState([
    { id: '1', accountId: "", debit: "", credit: "" },
    { id: '2', accountId: "", debit: "", credit: "" },
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: "", debit: "", credit: "" }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return toast.error("Journal must have at least 2 lines.");
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: string) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      // Prevent both debit and credit having values
      if (field === 'debit' && value !== "" && Number(value) > 0) newLine.credit = "";
      if (field === 'credit' && value !== "" && Number(value) > 0) newLine.debit = "";
      return newLine;
    }));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const mutation = useMutation({
    mutationFn: (data: any) => saveJournal({ data }),
    onSuccess: () => {
      toast.success("Journal entry posted successfully");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      navigate({ to: "/ledger" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to post journal entry");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return toast.error("Description is required.");
    if (!isBalanced) return toast.error("Debits and credits must be equal.");
    if (totalDebit === 0) return toast.error("Journal entry cannot be zero.");
    
    // Ensure all lines have accounts
    const validLines = lines.filter(l => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (validLines.length < 2) return toast.error("At least two valid lines are required.");

    mutation.mutate({
      date,
      description,
      reference: reference || null,
      status: "POSTED",
      lines: validLines.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      }))
    });
  };

  return (
    <AppShell
      title="New Journal Entry"
      subtitle="Record a manual double-entry transaction."
      actions={
        <Link to="/ledger" className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-2 pr-4 text-sm font-medium">
          <ArrowLeft size={16} className="ml-1" /> Back to Ledger
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-500 max-w-5xl">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Depreciation for Q3"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference # (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. ADJ-2026"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Lines Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Journal Lines</h2>
            <button 
              type="button"
              onClick={addLine}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
            >
              <Plus size={16} /> Add Line
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-6">Account</div>
              <div className="col-span-3 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-1"></div>
            </div>

            {lines.map((line, index) => (
              <div key={line.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">
                <div className="col-span-6">
                  <select 
                    required
                    value={line.accountId}
                    onChange={e => updateLine(line.id, 'accountId', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  >
                    <option value="" disabled>Select Account</option>
                    {(Array.isArray(accounts) ? accounts : []).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code ? acc.code + ' - ' : ''}{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={line.debit}
                    onChange={e => updateLine(line.id, 'debit', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-right tabular-nums"
                  />
                </div>
                <div className="col-span-2 relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">₦</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={line.credit}
                    onChange={e => updateLine(line.id, 'credit', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-right tabular-nums"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button 
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-50 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-16 pr-[8%]">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Total Debit</p>
              <p className={`text-xl tabular-nums font-bold ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                {totalDebit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Total Credit</p>
              <p className={`text-xl tabular-nums font-bold ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                {totalCredit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </p>
            </div>
          </div>
          
          {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
            <div className="mt-2 text-right pr-[8%] text-amber-600 text-sm font-medium animate-pulse">
              Difference: {Math.abs(totalDebit - totalCredit).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        <div className="flex justify-end gap-4">
          <Link 
            to="/ledger"
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button 
            type="submit"
            disabled={mutation.isPending || !isBalanced || totalDebit === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {mutation.isPending ? 'Saving...' : <><Save size={20} /> Post Journal</>}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

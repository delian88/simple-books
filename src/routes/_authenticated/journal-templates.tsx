import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listJournalTemplates, createJournalTemplate } from "@/lib/ledger.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { useState } from "react";
import { Plus, Trash2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/journal-templates")({
  component: JournalTemplates,
});

function JournalTemplates() {
  const getTemplates = useServerFn(listJournalTemplates);
  const getAccounts = useServerFn(listAccounts);
  const saveTemplate = useServerFn(createJournalTemplate);
  const queryClient = useQueryClient();

  const { data: templates = [], error: templatesError } = useQuery({ queryKey: ["templates"], queryFn: () => getTemplates() });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: () => getAccounts() });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [lines, setLines] = useState([
    { id: '1', accountId: "", debitRatio: "", creditRatio: "" },
    { id: '2', accountId: "", debitRatio: "", creditRatio: "" },
  ]);

  const addLine = () => setLines([...lines, { id: Math.random().toString(), accountId: "", debitRatio: "", creditRatio: "" }]);
  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));
  
  const updateLine = (id: string, field: string, value: string) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      if (field === 'debitRatio' && value !== "" && Number(value) > 0) newLine.creditRatio = "";
      if (field === 'creditRatio' && value !== "" && Number(value) > 0) newLine.debitRatio = "";
      return newLine;
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: any) => saveTemplate({ data }),
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setIsModalOpen(false);
      setFormData({ name: "", description: "" });
      setLines([{ id: '1', accountId: "", debitRatio: "", creditRatio: "" }, { id: '2', accountId: "", debitRatio: "", creditRatio: "" }]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create template");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter(l => l.accountId && (Number(l.debitRatio) > 0 || Number(l.creditRatio) > 0));
    if (validLines.length < 2) return toast.error("At least two valid lines are required.");
    
    mutation.mutate({
      name: formData.name,
      description: formData.description || null,
      lines: validLines.map(l => ({
        accountId: l.accountId,
        debitRatio: Number(l.debitRatio) || 0,
        creditRatio: Number(l.creditRatio) || 0,
        isFixedAmount: true // Simplifying for now, assuming fixed amounts
      }))
    });
  };

  return (
    <AppShell title="Journal Templates" subtitle="Manage recurring and standard journal entries.">
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-emerald-500/25 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-500">
        {templatesError && (
          <div className="col-span-2 text-center p-8 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-600 font-medium">Failed to load templates: {templatesError.message}</p>
          </div>
        )}
        {!templatesError && (!templates || templates.length === 0) && (
          <div className="col-span-2 text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No templates found. Debug: {JSON.stringify(templates)}</p>
          </div>
        )}
        {Array.isArray(templates) && templates.map(template => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                {template.description && <p className="text-sm text-gray-500 mt-1">{template.description}</p>}
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              {template.templateLines.map((line: any) => (
                <div key={line.id} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{line.account.name}</span>
                  <span className="tabular-nums font-mono text-gray-500 font-medium">
                    {Number(line.debitRatio) > 0 ? `DR ${line.debitRatio}` : `CR ${line.creditRatio}`}
                  </span>
                </div>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-emerald-700 py-2 rounded-lg font-medium transition-colors text-sm">
              <Calendar size={16} /> Schedule Recurring
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Journal Template</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Template Lines</label>
                  <button type="button" onClick={addLine} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100">
                    <Plus size={16} /> Add Line
                  </button>
                </div>
                <div className="space-y-3">
                  {lines.map((line) => (
                    <div key={line.id} className="flex gap-3 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <select required value={line.accountId} onChange={e => updateLine(line.id, 'accountId', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm">
                        <option value="" disabled>Select Account</option>
                        {(Array.isArray(accounts) ? accounts : []).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                      <input type="number" step="0.01" min="0" placeholder="Debit" value={line.debitRatio} onChange={e => updateLine(line.id, 'debitRatio', e.target.value)} className="w-28 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm tabular-nums" />
                      <input type="number" step="0.01" min="0" placeholder="Credit" value={line.creditRatio} onChange={e => updateLine(line.id, 'creditRatio', e.target.value)} className="w-28 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm tabular-nums" />
                      <button type="button" onClick={() => removeLine(line.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-emerald-500/25 disabled:opacity-50 disabled:hover:shadow-none">
                  {mutation.isPending ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAccounts, addAccount, updateAccount, deleteAccount } from "@/lib/accounts.functions";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/chart-of-accounts")({
  component: ChartOfAccounts,
});

function ChartOfAccounts() {
  const getAccounts = useServerFn(listAccounts);
  const createAccount = useServerFn(addAccount);
  const editAccount = useServerFn(updateAccount);
  const removeAccount = useServerFn(deleteAccount);
  
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccounts(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "ASSET",
    subType: "",
    openingBalance: 0
  });

  const mutation = useMutation({
    mutationFn: (data: any) => editingId ? editAccount({ data: { id: editingId, ...data } }) : createAccount({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAccount({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] })
  });

  const openModal = (account?: any) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        name: account.name,
        code: account.code || "",
        type: account.type,
        subType: account.subType || "",
        openingBalance: account.openingBalance
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", code: "", type: "ASSET", subType: "", openingBalance: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      code: formData.code || null,
      subType: formData.subType || null,
      parentId: null
    });
  };

  if (isLoading) return <div className="p-8">Loading accounts...</div>;

  const groupedAccounts = accounts.reduce((acc: any, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {});

  return (
    <AppShell 
      title="Chart of Accounts"
      subtitle="Manage your general ledger and account hierarchy"
      actions={
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> New Account
        </button>
      }
    >
      <div className="grid gap-6 animate-in fade-in duration-500 max-w-5xl">
        {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
          <div key={type} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{type}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {groupedAccounts[type]?.length ? (
                groupedAccounts[type].map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors group">
                    <div>
                      <div className="flex items-center gap-3">
                        {account.code && <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{account.code}</span>}
                        <h3 className="font-medium text-gray-900">{account.name}</h3>
                      </div>
                      {account.subType && <p className="text-sm text-gray-500 mt-1">{account.subType}</p>}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Opening Balance</p>
                        <p className="font-semibold text-gray-900">
                          {account.openingBalance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(account)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(account.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-gray-400 italic text-sm text-center">No accounts of this type yet.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Account' : 'New Account'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="1000"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Checking Account"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Type / Category</label>
                <input 
                  type="text" 
                  value={formData.subType} 
                  onChange={e => setFormData({...formData, subType: e.target.value})}
                  placeholder="e.g. Current Asset"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.openingBalance} 
                  onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

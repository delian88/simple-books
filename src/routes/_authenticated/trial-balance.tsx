import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTrialBalance } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trial-balance")({
  component: TrialBalance,
});

function TrialBalance() {
  const fetchTrialBalance = useServerFn(getTrialBalance);

  const { data, isLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: () => fetchTrialBalance(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <AppShell
      title="Trial Balance"
      subtitle="Verify that total debits equal total credits."
      actions={
        <button
          onClick={() => window.print()}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 text-sm print:hidden"
        >
          <Printer size={16} /> Print
        </button>
      }
    >
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading trial balance...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-6 md:p-8 text-center border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 font-display">Trial Balance</h2>
              <p className="text-gray-500 mt-1">As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="py-4 px-6 font-medium">Account Name</th>
                    <th className="py-4 px-6 font-medium text-right w-32">Debit</th>
                    <th className="py-4 px-6 font-medium text-right w-32">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(Array.isArray(data?.balances) ? data.balances : []).map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{acc.name}</span>
                          <span className="text-xs text-gray-500">{acc.type} • {acc.subType || "General"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right tabular-nums text-gray-700">
                        {acc.debit > 0 ? formatCurrency(acc.debit) : "-"}
                      </td>
                      <td className="py-3 px-6 text-right tabular-nums text-gray-700">
                        {acc.credit > 0 ? formatCurrency(acc.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                  
                  {(!Array.isArray(data?.balances) || data.balances.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                  
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="py-4 px-6 font-bold text-gray-900">Total</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(data?.totalDebit || 0)}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(data?.totalCredit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {data && Math.abs(data.totalDebit - data.totalCredit) > 0.01 && (
              <div className="p-4 bg-red-50 text-red-700 border-t border-red-100 flex items-center justify-center gap-2 font-medium">
                Warning: Trial balance is out of balance by {formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}!
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

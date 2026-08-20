import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/balance-sheet")({
  head: () => ({
    meta: [
      { title: "Balance sheet — KoboBooks" },
      { name: "description", content: "Record what your business owns and owes, and see your net worth." },
    ],
  }),
  component: BalanceSheet,
});

function BalanceSheet() {
  const fetchStatements = useServerFn(getFinancialStatements);

  const { data, isLoading } = useQuery({
    queryKey: ["financial-statements"],
    queryFn: () => fetchStatements(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Math.abs(val));
  };

  const bs = data?.balanceSheet;
  const isStmt = data?.incomeStatement; // Needed to show Net Profit in Equity

  return (
    <AppShell
      title="Balance Sheet"
      subtitle="What the business owns, what it owes, and what is left over."
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
          <div className="p-8 text-center text-gray-500">Loading statement...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in pb-8">
            <div className="p-8 text-center border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 font-display">Balance Sheet</h2>
              <p className="text-gray-500 mt-1">As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 mt-6">
              
              {/* ASSETS */}
              <div>
                <h3 className="font-bold text-gray-900 text-lg border-b-2 border-emerald-500 pb-2 mb-4">Assets</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {/* Fixed Assets */}
                    <tr><td className="py-2 font-semibold text-gray-900" colSpan={2}>Fixed Assets</td></tr>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "ASSET" && a.subType === "Fixed Asset").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                    {/* Current Assets */}
                    <tr><td className="py-2 pt-4 font-semibold text-gray-900" colSpan={2}>Current Assets</td></tr>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "ASSET" && a.subType === "Current Asset").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                    {/* Other Assets */}
                    <tr><td className="py-2 pt-4 font-semibold text-gray-900" colSpan={2}>Other Assets</td></tr>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "ASSET" && a.subType !== "Fixed Asset" && a.subType !== "Current Asset").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 flex justify-between items-center py-4 px-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900">Total Assets</span>
                  <span className="font-bold tabular-nums text-emerald-900 text-lg">
                    {formatCurrency(bs?.assets || 0)}
                  </span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div>
                <h3 className="font-bold text-gray-900 text-lg border-b-2 border-indigo-500 pb-2 mb-4">Liabilities</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {/* Short Term */}
                    <tr><td className="py-2 font-semibold text-gray-900" colSpan={2}>Short Term Liabilities</td></tr>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "LIABILITY" && a.subType === "Short Term Liability").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                    {/* Long Term */}
                    <tr><td className="py-2 pt-4 font-semibold text-gray-900" colSpan={2}>Long Term Liabilities</td></tr>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "LIABILITY" && a.subType === "Long Term Liability").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-900">Total Liabilities</span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatCurrency(bs?.liabilities || 0)}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg border-b-2 border-indigo-500 pb-2 mb-4 mt-8">Owners Funds (Equity)</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {(Array.isArray(bs?.details) ? bs.details : []).filter(a => a.type === "EQUITY").map(acc => (
                      <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pl-4 text-gray-700">{acc.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))}
                    {/* Current Year Net Profit */}
                    <tr className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 pl-4 text-gray-700 font-medium italic">Current Net Profit</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-900 font-medium italic">
                        {isStmt && isStmt.netProfit < 0 ? '-' : ''}{formatCurrency(isStmt?.netProfit || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="mt-8 flex justify-between items-center py-4 px-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="font-bold text-indigo-900">Total Liabilities & Equity</span>
                  <span className="font-bold tabular-nums text-indigo-900 text-lg">
                    {formatCurrency((bs?.liabilities || 0) + (bs?.equity || 0))}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

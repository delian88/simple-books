import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/income-statement")({
  component: IncomeStatement,
});

function IncomeStatement() {
  const fetchStatements = useServerFn(getFinancialStatements);

  const { data, isLoading } = useQuery({
    queryKey: ["financial-statements"],
    queryFn: () => fetchStatements(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Math.abs(val));
  };

  const isStmt = data?.incomeStatement;

  return (
    <AppShell
      title="Income Statement"
      subtitle="Track your revenue, COGS, and expenses to see your net profit."
      actions={
        <button
          onClick={() => window.print()}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 text-sm print:hidden"
        >
          <Printer size={16} /> Print
        </button>
      }
    >
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading statement...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in pb-8">
            <div className="p-8 text-center border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 font-display">Income Statement</h2>
              <p className="text-gray-500 mt-1">For the period ending {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="px-8 mt-6">
              <table className="w-full text-sm">
                <tbody>
                  {/* REVENUE */}
                  <tr>
                    <td className="py-3 font-bold text-gray-900 text-base" colSpan={2}>Revenue</td>
                  </tr>
                  {isStmt?.details.filter(a => a.type === "REVENUE").map(acc => (
                    <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pl-4 text-gray-700">{acc.name}</td>
                      <td className="py-2 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200">
                    <td className="py-3 pl-4 font-semibold text-gray-900">Total Revenue</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-gray-900">{formatCurrency(isStmt?.revenue || 0)}</td>
                  </tr>

                  {/* COGS */}
                  <tr>
                    <td className="py-3 pt-6 font-bold text-gray-900 text-base" colSpan={2}>Cost of Goods Sold (COGS)</td>
                  </tr>
                  {isStmt?.details.filter(a => a.subType === "Cost of Goods Sold").map(acc => (
                    <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pl-4 text-gray-700">{acc.name}</td>
                      <td className="py-2 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200">
                    <td className="py-3 pl-4 font-semibold text-gray-900">Total COGS</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-gray-900">{formatCurrency(isStmt?.cogs || 0)}</td>
                  </tr>

                  {/* GROSS PROFIT */}
                  <tr className="bg-emerald-50/50 border-y-2 border-emerald-100">
                    <td className="py-4 font-bold text-emerald-900 text-base">Gross Profit</td>
                    <td className="py-4 text-right font-bold tabular-nums text-emerald-900 text-base">
                      {isStmt && isStmt.grossProfit < 0 ? '-' : ''}{formatCurrency(isStmt?.grossProfit || 0)}
                    </td>
                  </tr>

                  {/* EXPENSES */}
                  <tr>
                    <td className="py-3 pt-6 font-bold text-gray-900 text-base" colSpan={2}>Operating Expenses</td>
                  </tr>
                  {isStmt?.details.filter(a => a.type === "EXPENSE" && a.subType !== "Cost of Goods Sold").map(acc => (
                    <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pl-4 text-gray-700">{acc.name}</td>
                      <td className="py-2 text-right tabular-nums text-gray-900">{formatCurrency(acc.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200">
                    <td className="py-3 pl-4 font-semibold text-gray-900">Total Expenses</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-gray-900">{formatCurrency(isStmt?.expenses || 0)}</td>
                  </tr>

                  {/* NET PROFIT */}
                  <tr className="bg-emerald-600 border-y-2 border-emerald-700">
                    <td className="py-4 px-4 font-bold text-white text-lg rounded-l-lg">Net Profit</td>
                    <td className="py-4 px-4 text-right font-bold tabular-nums text-white text-lg rounded-r-lg">
                      {isStmt && isStmt.netProfit < 0 ? '-' : ''}{formatCurrency(isStmt?.netProfit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500 flex flex-col gap-1 print:block hidden">
              <p>Generated by Ledgerly</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAccountStatement } from "@/lib/ledger.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account-statement")({
  component: AccountStatement,
});

function AccountStatement() {
  const fetchAccounts = useServerFn(listAccounts);
  const fetchStatement = useServerFn(getAccountStatement);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchAccounts(),
  });

  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [statementData, setStatementData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!accountId) {
      toast.error("Please select an account.");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await fetchStatement({ data: { accountId, startDate, endDate } });
      setStatementData(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate statement");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <AppShell
      title="General Ledger"
      subtitle="Generate and print account statements."
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Controls - Hidden on Print */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 flex-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Account</label>
              <select 
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select Account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code ? `${acc.code} - ` : ''}{acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button onClick={handleGenerate} disabled={isLoading || !accountId} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl">
              <FileText className="w-4 h-4" />
              {isLoading ? "Generating..." : "Generate Statement"}
            </Button>
            {statementData && (
               <Button onClick={() => window.print()} variant="outline" className="border-gray-200 gap-2 rounded-xl">
                 <Printer className="w-4 h-4" />
                 Print Statement
               </Button>
            )}
          </div>
        </div>

        {/* Statement View */}
        {statementData && (
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 animate-in fade-in">
            {/* Header */}
              <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-display">General Ledger</h1>
                  <p className="text-gray-500 mt-1">Mykobobooks Systems Inc.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(statementData.startDate), "MMM d, yyyy")} - {format(new Date(statementData.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-sm text-gray-500">Account Details</p>
                <p className="font-semibold text-lg text-gray-900 mt-1">
                  {statementData.accountCode ? `${statementData.accountCode} - ` : ''}{statementData.accountName}
                </p>
                <p className="text-sm text-gray-500">{statementData.type}</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Description</th>
                    <th className="py-3 font-medium">Ref</th>
                    <th className="py-3 font-medium text-right">Debit</th>
                    <th className="py-3 font-medium text-right">Credit</th>
                    <th className="py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Opening Balance */}
                  <tr className="bg-gray-50/50">
                    <td className="py-3 font-medium text-gray-900" colSpan={3}>Opening Balance</td>
                    <td className="py-3"></td>
                    <td className="py-3"></td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(statementData.openingBalance)}
                    </td>
                  </tr>

                  {/* Lines */}
                  {statementData.lines.map((line: any) => (
                    <tr key={line.id} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-600 whitespace-nowrap">{format(new Date(line.date), "MMM d, yyyy")}</td>
                      <td className="py-3 text-gray-900">{line.description}</td>
                      <td className="py-3 text-gray-500">{line.reference || '-'}</td>
                      <td className="py-3 text-right text-gray-600">
                        {line.debit > 0 ? formatCurrency(line.debit) : ''}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {line.credit > 0 ? formatCurrency(line.credit) : ''}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(line.balance)}
                      </td>
                    </tr>
                  ))}

                  {/* Closing Balance */}
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="py-4 font-semibold text-gray-900" colSpan={5}>Closing Balance</td>
                    <td className="py-4 text-right font-bold text-gray-900 text-base whitespace-nowrap">
                      {formatCurrency(statementData.closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Print Footer */}
            <div className="hidden print:block mt-12 text-center text-sm text-gray-500">
              <p>Generated on {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</p>
              <p>Powered by Mykobobooks</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

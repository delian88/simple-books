"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrialBalance } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { Scale, Printer, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TrialBalancePage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"net" | "gross">("net");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: async () => {
      const res = await getTrialBalance();
      return res;
    },
  });

  const balances = data?.balances || [];
  const filtered = balances.filter((b: any) =>
    (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.type || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalDebit = viewMode === "net"
    ? (data?.totalDebit || 0)
    : filtered.reduce((s: number, b: any) => s + (b.grossDebit || b.debit || 0), 0);

  const totalCredit = viewMode === "net"
    ? (data?.totalCredit || 0)
    : filtered.reduce((s: number, b: any) => s + (b.grossCredit || b.credit || 0), 0);

  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "ASSET":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LIABILITY":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "EQUITY":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "REVENUE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EXPENSE":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppShell
      title="Trial Balance"
      subtitle="Ensure your total debits equal total credits across all accounts and transactions."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("net")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === "net" ? "bg-[#0B3D2B] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Net Balances
            </button>
            <button
              type="button"
              onClick={() => setViewMode("gross")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === "gross" ? "bg-[#0B3D2B] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gross Totals
            </button>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      }
    >
      {/* Verification Status Banner */}
      {!isLoading && balances.length > 0 && (
        <div
          className={`mt-4 rounded-lg border p-4 flex items-center justify-between ${
            isBalanced
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isBalanced
                  ? "Trial Balance is Perfectly in Balance"
                  : `Trial Balance Out of Balance by ${formatMoney(difference, "NGN")}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Debits: <strong className="text-foreground">{formatMoney(totalDebit, "NGN")}</strong> &nbsp;|&nbsp; Total Credits:{" "}
                <strong className="text-foreground">{formatMoney(totalCredit, "NGN")}</strong>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 border">
            <Scale className="h-3.5 w-3.5" />
            <span>{isBalanced ? "Balanced (0.00 Diff)" : `Diff: ${formatMoney(difference, "NGN")}`}</span>
          </div>
        </div>
      )}

      {/* Main Report Card */}
      <Card className="shadow-sm border-border w-full mt-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-xl font-display">Trial Balance Report</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidated summary of debit and credit balances for every account in your general ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <div
              className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1.5 rounded shrink-0"
              suppressHydrationWarning
            >
              {mounted ? `As of ${new Date().toLocaleDateString()}` : "As of today"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !balances || balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Scale className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display">No balances found</h3>
              <p className="mt-2 text-muted-foreground max-w-[300px]">
                There are no transactions recorded to display a trial balance. Record sales, purchases, or journal entries to get started.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No accounts match &ldquo;{search}&rdquo;.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Account Name</TableHead>
                  <TableHead className="w-[15%]">Type</TableHead>
                  <TableHead className="w-[20%] text-right">Debit</TableHead>
                  <TableHead className="w-[20%] text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b: any, i: number) => {
                  const debit = viewMode === "net" ? b.debit : (b.grossDebit || b.debit || 0);
                  const credit = viewMode === "net" ? b.credit : (b.grossCredit || b.credit || 0);

                  return (
                    <TableRow key={b.id || b.name || i}>
                      <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getTypeBadgeClass(
                            b.type
                          )}`}
                        >
                          {b.type || "GENERAL"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {debit > 0 ? formatMoney(debit, "NGN") : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {credit > 0 ? formatMoney(credit, "NGN") : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/60 font-bold border-t-2 border-border">
                  <TableCell colSpan={2} className="text-foreground font-bold text-base">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground font-mono text-base">
                    {formatMoney(totalDebit, "NGN")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground font-mono text-base">
                    {formatMoney(totalCredit, "NGN")}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getFinancialStatements, getTrialBalance } from "@/lib/ledger.functions";
import { listTransactions, getProfile } from "@/lib/accounting.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import {
  FileText,
  TrendingUp,
  Scale,
  BookOpen,
  Printer,
  Download,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Receipt,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — My Kobobooks" },
      { name: "description", content: "View and generate financial reports including income statement, balance sheet, trial balance, and more." },
    ],
  }),
  component: ReportsPage,
});

function formatMoney(val: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(Math.abs(val));
}

function StatusBadge({ balanced }: { balanced: boolean }) {
  return balanced ? (
    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">✓ Balanced</Badge>
  ) : (
    <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">⚠ Out of balance</Badge>
  );
}

function ReportsPage() {
  const fetchStatements = useServerFn(getFinancialStatements);
  const fetchTrialBalance = useServerFn(getTrialBalance);

  const { data: stmtData, isLoading: stmtLoading } = useQuery({
    queryKey: ["financial-statements"],
    queryFn: () => fetchStatements(),
  });

  const { data: tbData, isLoading: tbLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: () => fetchTrialBalance(),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => listTransactions(),
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => listAccounts(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const isStmt = stmtData?.incomeStatement;
  const currency = profile?.currency || "NGN";

  const totalIn = (transactions as any[]).filter((t) => t.direction === "inflow").reduce((a, t) => a + t.amount, 0);
  const totalOut = (transactions as any[]).filter((t) => t.direction === "outflow").reduce((a, t) => a + t.amount, 0);
  const tbBalanced = tbData ? Math.abs((tbData.totalDebit || 0) - (tbData.totalCredit || 0)) < 0.01 : true;

  const now = new Date();
  const periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const reports = [
    {
      id: "income-statement",
      title: "Income Statement",
      description: "Revenue, COGS, operating expenses and net profit",
      icon: TrendingUp,
      color: "emerald",
      href: "/income-statement",
      summary: stmtLoading
        ? "Loading..."
        : `Net Profit: ${isStmt?.netProfit !== undefined ? (isStmt.netProfit < 0 ? "-" : "") + formatMoney(isStmt.netProfit, currency) : "N/A"}`,
      badge: null,
      available: true,
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Assets, liabilities and equity position",
      icon: Scale,
      color: "blue",
      href: "/balance-sheet",
      summary: stmtLoading ? "Loading..." : `Assets: ${formatMoney(stmtData?.balanceSheet?.totalAssets || 0, currency)}`,
      badge: null,
      available: true,
    },
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Verify total debits equal total credits",
      icon: Layers,
      color: "violet",
      href: "/trial-balance",
      summary: tbLoading ? "Loading..." : `${(tbData?.balances || []).length} accounts`,
      badge: tbLoading ? null : <StatusBadge balanced={tbBalanced} />,
      available: true,
    },
    {
      id: "account-statement",
      title: "General Ledger",
      description: "Account-level transaction history with running balance",
      icon: BookOpen,
      color: "amber",
      href: "/account-statement",
      summary: accountsLoading ? "Loading..." : `${(accounts as any[]).length} chart accounts`,
      badge: null,
      available: true,
    },
    {
      id: "transactions",
      title: "Transactions Report",
      description: "All inflows and outflows across the business",
      icon: Receipt,
      color: "rose",
      href: "/money-in",
      summary: txLoading ? "Loading..." : `${(transactions as any[]).length} entries · In: ${formatMoney(totalIn, currency)}`,
      badge: null,
      available: true,
    },
    {
      id: "journal",
      title: "General Journal",
      description: "Double-entry journal entries with debit/credit columns",
      icon: FileText,
      color: "slate",
      href: "/ledger",
      summary: "View all posted journal entries",
      badge: null,
      available: true,
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string; light: string }> = {
    emerald: { bg: "bg-emerald-600", icon: "text-emerald-600", border: "border-emerald-100", light: "bg-emerald-50" },
    blue:    { bg: "bg-blue-600",    icon: "text-blue-600",    border: "border-blue-100",    light: "bg-blue-50"    },
    violet:  { bg: "bg-violet-600",  icon: "text-violet-600",  border: "border-violet-100",  light: "bg-violet-50"  },
    amber:   { bg: "bg-amber-600",   icon: "text-amber-600",   border: "border-amber-100",   light: "bg-amber-50"   },
    rose:    { bg: "bg-rose-600",    icon: "text-rose-600",    border: "border-rose-100",     light: "bg-rose-50"   },
    slate:   { bg: "bg-slate-600",   icon: "text-slate-600",   border: "border-slate-100",   light: "bg-slate-50"   },
  };

  return (
    <AppShell
      title="Reports"
      subtitle={`Financial reports for ${periodLabel}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-2 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print Summary
        </Button>
      }
    >
      {/* KPI summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Inflows", value: txLoading ? "…" : formatMoney(totalIn, currency), sub: "All time", color: "text-emerald-600" },
          { label: "Total Outflows", value: txLoading ? "…" : formatMoney(totalOut, currency), sub: "All time", color: "text-rose-600" },
          { label: "Net Revenue", value: stmtLoading ? "…" : formatMoney(isStmt?.revenue || 0, currency), sub: "From income statement", color: "text-blue-600" },
          { label: "Net Profit", value: stmtLoading ? "…" : (isStmt?.netProfit !== undefined ? (isStmt.netProfit < 0 ? "-" : "") + formatMoney(isStmt.netProfit, currency) : "N/A"), sub: "From income statement", color: isStmt?.netProfit >= 0 ? "text-emerald-600" : "text-red-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-sm border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
              <p className={`text-lg font-bold font-display tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report cards */}
      <h2 className="text-base font-semibold mb-4">Available Reports</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          const c = colorMap[report.color];
          return (
            <Card
              key={report.id}
              className={`shadow-sm border-border hover:shadow-md transition-shadow group`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.light} ${c.border} border shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{report.title}</h3>
                      {report.badge}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 px-3 py-2 mb-4">
                  <p className="text-xs text-muted-foreground font-medium">{report.summary}</p>
                </div>

                <div className="flex gap-2">
                  <Link to={report.href} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs group-hover:border-foreground/30">
                      <BarChart3 className="h-3.5 w-3.5" />
                      View Report
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      // Navigate then trigger print after short delay
                      window.open(report.href, "_blank");
                    }}
                    title="Open in new tab and print"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick links section */}
      <div className="mt-8">
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Record Money In", desc: "Log a new inflow transaction", href: "/money-in" },
            { label: "Record Money Out", desc: "Log a new outflow / expense", href: "/money-out" },
            { label: "Scan a Receipt", desc: "Use AI to extract expense details", href: "/expenses" },
            { label: "Create an Invoice", desc: "Generate a sales invoice for a customer", href: "/sales/invoices" },
          ].map((q) => (
            <Link key={q.href} to={q.href}>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group">
                <div>
                  <p className="text-sm font-medium">{q.label}</p>
                  <p className="text-xs text-muted-foreground">{q.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

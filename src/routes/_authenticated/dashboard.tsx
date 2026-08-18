import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Scale,
  Calendar as CalendarIcon,
  FileText,
  Users,
  Layers,
  DatabaseZap,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getProfile, listTransactions, listBalanceItems } from "@/lib/accounting.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, type TxnCategory } from "@/lib/accounting";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/TransactionsTable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const [profile, transactions, balanceItems] = await Promise.all([
      getProfile(),
      listTransactions(),
      listBalanceItems(),
    ]);
    return { profile, transactions, balanceItems };
  },
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — My Kobobooks" }],
  }),
  component: Dashboard,
});



function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const profile = data?.profile || { currency: "USD", business_name: "Business" };
  const txns = Array.isArray(data?.transactions) ? data.transactions : [];
  const balanceItems = Array.isArray(data?.balanceItems) ? data.balanceItems : [];
  const currency = profile.currency;
  
  const [filter, setFilter] = useState<"all" | "inflow" | "outflow">("all");

  // Month navigation
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-indexed
  });

  const monthLabel = useMemo(() => {
    const d = new Date(selectedMonth.year, selectedMonth.month, 1);
    const first = new Date(selectedMonth.year, selectedMonth.month, 1);
    const last = new Date(selectedMonth.year, selectedMonth.month + 1, 0);
    const monthName = d.toLocaleString("default", { month: "short" });
    return `${monthName} ${first.getDate()} - ${monthName} ${last.getDate()}, ${selectedMonth.year}`;
  }, [selectedMonth]);

  const isCurrentMonth = selectedMonth.year === today.getFullYear() && selectedMonth.month === today.getMonth();

  function goToPrevMonth() {
    setSelectedMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function goToNextMonth() {
    if (isCurrentMonth) return;
    setSelectedMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  // Filter transactions to selected month
  const monthTxns = useMemo(() => {
    return txns.filter((t: any) => {
      const d = new Date(t.occurred_on || t.createdAt || t.date);
      return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month;
    });
  }, [txns, selectedMonth]);

  const filteredTxns = filter === "all" ? monthTxns : monthTxns.filter((t: any) => t.direction === filter);

  const sum = (predicate: (c: TxnCategory) => boolean) =>
    monthTxns.filter((t) => predicate(t.category as TxnCategory)).reduce((acc, t) => acc + t.amount, 0);

  const sales = sum((c) => c === "sales");
  const otherIncome = sum((c) => c === "other_income");
  const totalRevenue = sales + otherIncome;
  const expenses = sum((c) => c === "expense");
  const profit = totalRevenue - expenses;
  const totalIn = monthTxns.filter((t) => t.direction === "inflow").reduce((a, t) => a + t.amount, 0);
  const totalOut = monthTxns.filter((t) => t.direction === "outflow").reduce((a, t) => a + t.amount, 0);

  const assets = balanceItems
    .filter((i: any) => i.side === "asset")
    .reduce((a: number, i: any) => a + Number(i.amount), 0);
  const liabilities = balanceItems
    .filter((i) => i.side === "liability")
    .reduce((a, i) => a + i.amount, 0);
  const netWorth = assets - liabilities;


  const pieData = [
    { name: "Sales Revenue", value: sales || 0, color: "#10b981" },
    ...(otherIncome > 0 ? [{ name: "Other Income", value: otherIncome, color: "#0ea5e9" }] : []),
    { name: "Business Expenses", value: expenses || 0, color: "#fca5a5" },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: "No Data", value: 1, color: "#e2e8f0" });
  }

  return (
    <AppShell
      title={data.profile.business_name}
      actions={
        <div className="flex items-center gap-1 rounded-md border bg-background shadow-sm">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-muted rounded-l-md transition-colors text-muted-foreground hover:text-foreground"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{monthLabel}</span>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 hover:bg-muted rounded-r-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
    >

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold font-display mb-6">Profit Breakdown</h2>

            <div className="relative flex justify-center mb-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-medium text-muted-foreground">Profit</span>
                <span className="text-lg font-bold text-green-600">
                  {formatMoney(profit, currency)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Sales Revenue</span>
                </div>
                <span className="font-bold">{formatMoney(sales, currency)}</span>
              </div>
              {otherIncome > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-sky-500"></div>
                    <span className="font-medium">Other Income</span>
                  </div>
                  <span className="font-bold">{formatMoney(otherIncome, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-300"></div>
                  <span className="font-medium">Business Expenses</span>
                </div>
                <span className="font-bold text-red-500">− {formatMoney(expenses, currency)}</span>
              </div>
              <div className="my-2 border-t border-border"></div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold ml-5">Profit</span>
                <span className="font-bold text-green-600">{formatMoney(profit, currency)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-md bg-emerald-50/50 p-3 border border-emerald-100 flex gap-3 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs">Capital, loans and debtor payments are cash — not revenue.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold font-display mb-6">Income vs. Expenses</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Apr", Income: 4000, Expenses: 2400 },
                    { name: "May", Income: 3000, Expenses: 1398 },
                    { name: "Jun", Income: 2000, Expenses: 9800 },
                    { name: "Jul", Income: 2780, Expenses: 3908 },
                    { name: "Aug", Income: totalIn, Expenses: totalOut },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: currency,
                        maximumSignificantDigits: 3,
                      }).format(value)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(value: number) => formatMoney(value, currency)}
                  />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-6">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="flex items-center gap-2 text-xl font-bold font-display">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Recent Entries
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    {filter === "all" ? "All Transactions" : filter === "inflow" ? "Money In" : "Money Out"} <span className="ml-1 opacity-50">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter("all")}>All Transactions</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("inflow")}>Money In</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("outflow")}>Money Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filteredTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border shadow-sm">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold font-display">No entries yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                  Start by adding your first money in or money out transaction.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Button asChild className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2">
                    <Link to="/money-in">
                      <span>+</span> Money In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                  >
                    <Link to="/money-out">
                      <span>−</span> Money Out
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <TransactionsTable rows={filteredTxns} currency={currency} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

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
    meta: [{ title: "Dashboard — Ledgerly" }],
  }),
  component: Dashboard,
});

import { AIInsightsWidget } from "@/components/AIInsightsWidget";

// Mock data for sparklines
const generateSparkline = () =>
  Array.from({ length: 10 }, (_, i) => ({ value: Math.random() * 100 + 50 }));

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const { profile, transactions: txns, balanceItems } = data;
  const currency = profile.currency;

  const sum = (predicate: (c: TxnCategory) => boolean) =>
    txns.filter((t) => predicate(t.category as TxnCategory)).reduce((acc, t) => acc + t.amount, 0);

  const sales = sum((c) => c === "sales");
  const otherIncome = sum((c) => c === "other_income");
  const totalRevenue = sales + otherIncome;
  const expenses = sum((c) => c === "expense");
  const profit = totalRevenue - expenses;
  const totalIn = txns.filter((t) => t.direction === "inflow").reduce((a, t) => a + t.amount, 0);
  const totalOut = txns.filter((t) => t.direction === "outflow").reduce((a, t) => a + t.amount, 0);

  const assets = data.balanceItems
    .filter((i) => i.side === "asset")
    .reduce((a, i) => a + i.amount, 0);
  const liabilities = data.balanceItems
    .filter((i) => i.side === "liability")
    .reduce((a, i) => a + i.amount, 0);
  const netWorth = assets - liabilities;

  const stats = [
    {
      label: "CASH IN",
      value: totalIn,
      icon: ArrowDownLeft,
      color: "#22c55e",
      bgClass: "bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900",
      textClass: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-100 dark:bg-green-900/50",
    },
    {
      label: "CASH OUT",
      value: totalOut,
      icon: ArrowUpRight,
      color: "#ef4444",
      bgClass: "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900",
      textClass: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-900/50",
    },
    {
      label: "PROFIT (REVENUE − EXPENSES)",
      value: profit,
      icon: TrendingUp,
      color: "#3b82f6",
      bgClass: "bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900",
      textClass: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      label: "NET WORTH (ASSETS − LIABILITIES)",
      value: netWorth,
      icon: Scale,
      color: "#8b5cf6",
      bgClass: "bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900",
      textClass: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
    },
  ];

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
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>Aug 1 - Aug 31, 2025</span>
        </div>
      }
    >
      <AIInsightsWidget />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`border relative overflow-hidden shadow-sm ${stat.bgClass}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.textClass}`} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </h3>
                  <div className={`text-3xl font-bold tracking-tight mt-0.5 ${stat.textClass}`}>
                    {formatMoney(stat.value, currency)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div className="text-xs font-medium text-green-600">
                  ↑ 0% <span className="text-muted-foreground font-normal">vs last 30 days</span>
                </div>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateSparkline()}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stat.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="flex items-center gap-2 text-xl font-bold font-display">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Recent Entries
              </h2>
              <Button variant="outline" size="sm" className="text-xs h-8">
                All Transactions <span className="ml-1 opacity-50">▼</span>
              </Button>
            </div>

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
          </CardContent>
        </Card>

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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Outstanding Invoices
              </p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-xl font-bold">{formatMoney(0, currency)}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">0 invoices awaiting payment</div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Bills Due</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-xl font-bold">{formatMoney(0, currency)}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">0 bills to pay this week</div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <DatabaseZap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Cash Balance</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-xl font-bold">{formatMoney(assets, currency)}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-green-600 font-medium mt-2">
            Available across all accounts
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Quick Actions</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button size="sm" variant="outline" className="text-xs">
              Create Invoice
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              Add Bill
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6 mt-6">
        <Card className="shadow-sm border-border">
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
    </AppShell>
  );
}

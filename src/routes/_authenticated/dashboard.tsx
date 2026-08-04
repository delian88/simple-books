import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, Scale } from "lucide-react";
import { getProfile, listTransactions, listBalanceItems } from "@/lib/accounting.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, formatMoney, type TxnCategory } from "@/lib/accounting";

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
    meta: [
      { title: "Dashboard — Ledgerly" },
      { name: "description", content: "Your profit, cash in, cash out and net worth at a glance." },
      { property: "og:title", content: "Dashboard — Ledgerly" },
      { property: "og:description", content: "Your profit, cash in, cash out and net worth at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const currency = data.profile.currency;
  const txns = data.transactions;

  const sum = (predicate: (c: TxnCategory) => boolean) =>
    txns.filter((t) => predicate(t.category as TxnCategory)).reduce((acc, t) => acc + t.amount, 0);

  const sales = sum((c) => c === "sales");
  const expenses = sum((c) => c === "expense");
  const profit = sales - expenses;
  const totalIn = txns.filter((t) => t.direction === "inflow").reduce((a, t) => a + t.amount, 0);
  const totalOut = txns.filter((t) => t.direction === "outflow").reduce((a, t) => a + t.amount, 0);

  const assets = data.balanceItems.filter((i) => i.side === "asset").reduce((a, i) => a + i.amount, 0);
  const liabilities = data.balanceItems.filter((i) => i.side === "liability").reduce((a, i) => a + i.amount, 0);

  const stats = [
    { label: "Cash in", value: totalIn, icon: ArrowDownLeft, tone: "text-inflow" },
    { label: "Cash out", value: totalOut, icon: ArrowUpRight, tone: "text-outflow" },
    { label: "Profit (sales − expenses)", value: profit, icon: TrendingUp, tone: profit >= 0 ? "text-inflow" : "text-outflow" },
    { label: "Net worth (assets − liabilities)", value: assets - liabilities, icon: Scale, tone: "text-foreground" },
  ];

  return (
    <AppShell title={data.profile.business_name} subtitle="A running summary of everything you have recorded.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border shadow-ledger">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <stat.icon className="h-4 w-4" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`numeric text-2xl ${stat.tone}`}>{formatMoney(stat.value, currency)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent entries</CardTitle>
          </CardHeader>
          <CardContent>
            {txns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing recorded yet. Start with{" "}
                <Link to="/money-in" className="underline underline-offset-4">
                  money in
                </Link>{" "}
                or{" "}
                <Link to="/money-out" className="underline underline-offset-4">
                  money out
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {txns.slice(0, 10).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.counterparty || CATEGORY_LABEL[t.category as TxnCategory]}</p>
                      <p className="numeric text-xs text-muted-foreground">
                        {t.occurred_on} · {CATEGORY_LABEL[t.category as TxnCategory]}
                      </p>
                    </div>
                    <span className={`numeric text-sm ${t.direction === "inflow" ? "text-inflow" : "text-outflow"}`}>
                      {t.direction === "inflow" ? "+" : "−"}
                      {formatMoney(t.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Profit breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Sales revenue" value={formatMoney(sales, currency)} />
            <Row label="Business expenses" value={`− ${formatMoney(expenses, currency)}`} />
            <div className="border-t border-border pt-3">
              <Row
                label={profit >= 0 ? "Profit" : "Loss"}
                value={formatMoney(Math.abs(profit), currency)}
                strong
              />
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="text-xs font-normal">
                Capital, loans and debtor payments are cash — not revenue.
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={`numeric ${strong ? "text-lg" : ""}`}>{value}</span>
    </div>
  );
}

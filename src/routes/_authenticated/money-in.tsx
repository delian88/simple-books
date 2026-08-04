import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProfile, listTransactions } from "@/lib/accounting.functions";
import { AppShell } from "@/components/AppShell";
import { EntryForm, emptyDraft } from "@/components/EntryForm";
import { BankStatementImport } from "@/components/BankStatementImport";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INFLOW_CATEGORIES, formatMoney } from "@/lib/accounting";

const moneyInQuery = queryOptions({
  queryKey: ["money-in"],
  queryFn: async () => {
    const [profile, transactions] = await Promise.all([getProfile(), listTransactions()]);
    return { profile, transactions: transactions.filter((t) => t.direction === "inflow") };
  },
});

export const Route = createFileRoute("/_authenticated/money-in")({
  head: () => ({
    meta: [
      { title: "Money in — Ledgerly" },
      { name: "description", content: "Record capital, sales, loans and debtor payments, or import them from a bank statement." },
      { property: "og:title", content: "Money in — Ledgerly" },
      { property: "og:description", content: "Record capital, sales, loans and debtor payments from your bank statement." },
    ],
  }),
  component: MoneyIn,
});

function MoneyIn() {
  const { data } = useSuspenseQuery(moneyInQuery);
  const [draft, setDraft] = useState(() => emptyDraft("sales"));
  const total = data.transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <AppShell
      title="Money in"
      subtitle="Inflows from your bank statement: capital, sales, loans and payments from debtors."
      actions={
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total recorded</p>
          <p className="numeric text-2xl text-inflow">{formatMoney(total, data.profile.currency)}</p>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <EntryForm
          title="Record an inflow"
          description="Type in a single credit by hand."
          direction="inflow"
          categories={INFLOW_CATEGORIES}
          draft={draft}
          onDraftChange={setDraft}
        />
        <BankStatementImport currency={data.profile.currency} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-xl">Inflow ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable rows={data.transactions} currency={data.profile.currency} />
        </CardContent>
      </Card>
    </AppShell>
  );
}

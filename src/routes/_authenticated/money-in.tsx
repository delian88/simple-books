import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProfile, listTransactions } from "@/lib/accounting.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import { EntryForm, emptyDraft } from "@/components/EntryForm";
import { BankStatementImport } from "@/components/BankStatementImport";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/accounting";

const moneyInQuery = queryOptions({
  queryKey: ["money-in"],
  queryFn: async () => {
    const [profile, transactions, accounts] = await Promise.all([getProfile(), listTransactions(), listAccounts()]);
    
    const inflowAccounts = accounts
      .filter(a => a.type === "REVENUE" || a.type === "ASSET" || a.type === "LIABILITY" || a.type === "EQUITY")
      .map(a => ({
        value: a.id,
        label: `${a.code ? a.code + ' - ' : ''}${a.name}`,
        hint: a.type
      }));

    const bankAccounts = accounts
      .filter(a => a.type === "ASSET")
      .map(a => ({
        value: a.id,
        label: `${a.code ? a.code + ' - ' : ''}${a.name}`
      }));

    return { 
      profile, 
      transactions: transactions.filter((t) => t.direction === "inflow"),
      categories: inflowAccounts.length > 0 ? inflowAccounts : [{ value: "default", label: "No accounts found", hint: "Go to Chart of Accounts" }],
      bankAccounts: bankAccounts.length > 0 ? bankAccounts : [{ value: "default", label: "No asset accounts found" }]
    };
  },
});

export const Route = createFileRoute("/_authenticated/money-in")({
  head: () => ({
    meta: [
      { title: "Money in — Ledgerly" },
      { name: "description", content: "Record capital, sales, loans and debtor payments, or import them from a bank statement." },
    ],
  }),
  component: MoneyIn,
});

function MoneyIn() {
  const { data } = useSuspenseQuery(moneyInQuery);
  const [draft, setDraft] = useState(() => emptyDraft(data.categories[0].value, data.bankAccounts[0].value));
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
          categories={data.categories}
          bankAccounts={data.bankAccounts}
          draft={draft}
          onDraftChange={setDraft}
        />
        <BankStatementImport currency={data.profile.currency} bankAccounts={data.bankAccounts} />
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

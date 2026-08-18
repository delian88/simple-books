import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProfile, listTransactions } from "@/lib/accounting.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import { EntryForm, emptyDraft } from "@/components/EntryForm";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/accounting";

const moneyOutQuery = queryOptions({
  queryKey: ["money-out"],
  queryFn: async () => {
    const [profile, transactions, accounts] = await Promise.all([getProfile(), listTransactions(), listAccounts()]);
    
    const outflowAccounts = accounts
      .filter(a => a.type !== "REVENUE")
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
      transactions: transactions.filter((t) => t.direction === "outflow"),
      categories: outflowAccounts.length > 0 ? outflowAccounts : [{ value: "default", label: "No accounts found", hint: "Go to Chart of Accounts" }],
      bankAccounts: bankAccounts.length > 0 ? bankAccounts : [{ value: "default", label: "No asset accounts found" }]
    };
  },
});

export const Route = createFileRoute("/_authenticated/money-out")({
  head: () => ({
    meta: [
      { title: "Money out — My Kobobooks" },
      { name: "description", content: "Scan third-party receipts to record assets bought, expenses, vendor payments and loan repayments." },
    ],
  }),
  component: MoneyOut,
});

function MoneyOut() {
  const { data } = useSuspenseQuery(moneyOutQuery);
  const [draft, setDraft] = useState(() => emptyDraft(data.categories[0].value, data.bankAccounts[0].value));
  const total = data.transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <AppShell
      title="Money out"
      subtitle="Outflows captured from receipts: assets bought, expenses, vendor payments and loan repayments."
      actions={
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total recorded</p>
          <p className="numeric text-2xl text-outflow">{formatMoney(total, data.profile.currency)}</p>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ReceiptScanner onExtracted={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
        <EntryForm
          title="Record an outflow"
          description="Check the scanned details — or type a payment in by hand."
          direction="outflow"
          categories={data.categories}
          bankAccounts={data.bankAccounts}
          draft={draft}
          onDraftChange={setDraft}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-xl">Outflow ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable rows={data.transactions} currency={data.profile.currency} />
        </CardContent>
      </Card>
    </AppShell>
  );
}

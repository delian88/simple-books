"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile, listTransactions } from "@/lib/accounting.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import { EntryForm, emptyDraft } from "@/components/EntryForm";
import { BankStatementImport } from "@/components/BankStatementImport";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/accounting";
import { ArrowDownLeft } from "lucide-react";

export default function MoneyInPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["money-in"],
    queryFn: async () => {
      const [profile, transactions, accounts] = await Promise.all([
        getProfile(),
        listTransactions(),
        listAccounts()
      ]);
      
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
        transactions: Array.isArray(transactions) ? transactions.filter((t: any) => t.direction === "inflow") : [],
        categories: inflowAccounts.length > 0 ? inflowAccounts : [{ value: "default", label: "No accounts found", hint: "Go to Chart of Accounts" }],
        bankAccounts: bankAccounts.length > 0 ? bankAccounts : [{ value: "default", label: "No asset accounts found" }]
      };
    },
  });

  const [draft, setDraft] = useState(() => emptyDraft(
    data?.categories?.[0]?.value || "default", 
    data?.bankAccounts?.[0]?.value || "default"
  ));

  const [timeFilter, setTimeFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");

  if (isLoading) {
    return (
      <AppShell title="Money in" subtitle="Inflows from your bank statement: capital, sales, loans and payments from debtors.">
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (!data) return null;

  const now = new Date();
  
  const total = data.transactions.reduce((acc: number, t: any) => {
    if (timeFilter === "all") return acc + t.amount;
    
    const tDate = new Date(t.occurred_on || t.occurredOn);
    
    if (timeFilter === "daily") {
      if (tDate.toDateString() === now.toDateString()) {
        return acc + t.amount;
      }
    } else if (timeFilter === "weekly") {
      const diffTime = Math.abs(now.getTime() - tDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) return acc + t.amount;
    } else if (timeFilter === "monthly") {
      if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
        return acc + t.amount;
      }
    }
    
    return acc;
  }, 0);

  return (
    <AppShell
      title="Money in"
      subtitle="Inflows from your bank statement: capital, sales, loans and payments from debtors."
      actions={
        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
              <SelectTrigger className="h-6 text-xs w-[110px]">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">Last 7 days</SelectItem>
                <SelectItem value="monthly">This month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total recorded</p>
          </div>
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
          {data.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <ArrowDownLeft className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold font-display">No money in records</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">You haven't recorded any income yet.</p>
            </div>
          ) : (
            <TransactionsTable rows={data.transactions} currency={data.profile.currency} />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

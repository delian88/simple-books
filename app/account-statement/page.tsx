"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAccounts } from "@/lib/accounts.functions";
import { getAccountStatement } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { FileSearch, Search } from "lucide-react";

export default function AccountStatementPage() {
  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await listAccounts();
      return Array.isArray(res) ? res : [];
    }
  });

  const { data: statement, isLoading, isFetching } = useQuery({
    queryKey: ["statement", accountId, startDate, endDate],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await getAccountStatement({ data: { accountId, startDate: startDate || undefined, endDate: endDate || undefined } });
      return res;
    },
    enabled: !!accountId
  });

  return (
    <AppShell title="Account Statement" subtitle="Generate statements for specific accounts or customers.">
      <Card className="mb-6 print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={isLoadingAccounts}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code ? `${a.code} - ` : ''}{a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date (Optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!accountId ? (
        <Card className="shadow-sm border-border w-full">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <FileSearch className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display">Select an account</h3>
              <p className="mt-2 text-muted-foreground max-w-[300px]">Choose an account from the dropdown above to view its statement.</p>
            </div>
          </CardContent>
        </Card>
      ) : isFetching ? (
        <div className="flex h-32 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : statement ? (
        <Card className="shadow-sm border-border w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle className="text-xl font-display">{statement.account.name} Statement</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {statement.startDate !== '1970-01-01' ? statement.startDate : 'Beginning of time'} - {statement.endDate !== '2099-12-31' ? statement.endDate : 'Present'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Closing Balance</p>
              <p className="text-2xl font-bold numeric">{formatMoney(statement.closingBalance, "NGN")}</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30">
                  <TableCell className="font-medium">Opening</TableCell>
                  <TableCell colSpan={4} className="text-muted-foreground">Opening Balance</TableCell>
                  <TableCell className="text-right font-medium numeric">{formatMoney(statement.account.openingBalance, "NGN")}</TableCell>
                </TableRow>
                {statement.transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="numeric text-xs whitespace-nowrap">{t.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{t.reference || "-"}</TableCell>
                    <TableCell className="text-right numeric">{t.debit > 0 ? formatMoney(t.debit, "NGN") : ""}</TableCell>
                    <TableCell className="text-right numeric">{t.credit > 0 ? formatMoney(t.credit, "NGN") : ""}</TableCell>
                    <TableCell className="text-right numeric font-medium">{formatMoney(t.runningBalance, "NGN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border w-full">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-bold font-display">No statement data</h3>
              <p className="mt-2 text-sm text-muted-foreground">Could not load the statement for this account.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { getTrialBalance } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function TrialBalancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: async () => {
      const res = await getTrialBalance();
      return res;
    }
  });

  return (
    <AppShell 
      title="Trial Balance" 
      subtitle="Ensure your total debits equal total credits."
      actions={
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      }
    >
      <Card className="shadow-sm border-border w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl font-display">Trial Balance Report</CardTitle>
          <div className="text-sm text-muted-foreground font-medium">As of {new Date().toLocaleDateString()}</div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !data || !data.balances || data.balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Scale className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display">No balances found</h3>
              <p className="mt-2 text-muted-foreground max-w-[300px]">There are no transactions recorded to display a trial balance.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.balances.map((b: any, i: number) => {
                  const debit = b.debit > 0 ? b.debit : 0;
                  const credit = b.credit > 0 ? b.credit : 0;
                  // If both are 0, we can skip showing, but API should only return non-zero mostly
                  return (
                    <TableRow key={b.id || i}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-muted-foreground">{b.type}</TableCell>
                      <TableCell className="text-right numeric">{debit > 0 ? formatMoney(debit, "NGN") : ""}</TableCell>
                      <TableCell className="text-right numeric">{credit > 0 ? formatMoney(credit, "NGN") : ""}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead colSpan={2} className="font-bold text-foreground">Total</TableHead>
                  <TableHead className="text-right font-bold text-foreground numeric">{formatMoney(data.totalDebit, "NGN")}</TableHead>
                  <TableHead className="text-right font-bold text-foreground numeric">{formatMoney(data.totalCredit, "NGN")}</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

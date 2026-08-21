"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { LineChart, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function IncomeStatementPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["financial-statements", startDate, endDate],
    queryFn: async () => {
      const res = await getFinancialStatements({ data: { startDate: startDate || undefined, endDate: endDate || undefined } });
      return res;
    }
  });

  const incStmt = data?.incomeStatement;
  const revenues = incStmt?.details?.filter((d: any) => d.type === 'REVENUE') || [];
  const expenses = incStmt?.details?.filter((d: any) => d.type === 'EXPENSE' && !(d.subType || '').includes('Cost of Goods')) || [];
  const cogs = incStmt?.details?.filter((d: any) => d.type === 'EXPENSE' && (d.subType || '').includes('Cost of Goods')) || [];

  return (
    <AppShell 
      title="Income Statement" 
      subtitle="View your company's revenue and expenses over time."
      actions={
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      }
    >
      <Card className="mb-6 print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end max-w-xl">
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

      <Card className="shadow-sm border-border w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl font-display">Income Statement</CardTitle>
          <div className="text-sm text-muted-foreground font-medium">
            {startDate || endDate 
              ? `${startDate || 'Beginning'} - ${endDate || 'Present'}`
              : `As of ${new Date().toLocaleDateString()}`}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !incStmt ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <LineChart className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display">No statement data</h3>
              <p className="mt-2 text-muted-foreground max-w-[300px]">There are no financial records to display.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Account</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-bold text-foreground">Revenue</TableCell>
                </TableRow>
                {revenues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No revenue recorded</TableCell>
                  </TableRow>
                )}
                {revenues.map((item: any, i: number) => (
                  <TableRow key={`rev-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold text-right pr-6">Total Revenue</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.revenue, "NGN")}</TableCell>
                </TableRow>

                {/* COGS Section */}
                {cogs.length > 0 && (
                  <>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={2} className="font-bold text-foreground">Cost of Goods Sold</TableCell>
                    </TableRow>
                    {cogs.map((item: any, i: number) => (
                      <TableRow key={`cogs-${i}`}>
                        <TableCell className="pl-6">{item.name}</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold text-right pr-6">Total Cost of Goods Sold</TableCell>
                      <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.cogs, "NGN")}</TableCell>
                    </TableRow>
                  </>
                )}

                {/* Gross Profit */}
                <TableRow className="bg-primary/10 border-t-2 border-primary/20">
                  <TableCell className="font-bold text-primary">Gross Profit</TableCell>
                  <TableCell className="text-right font-bold text-primary numeric">{formatMoney(incStmt.grossProfit, "NGN")}</TableCell>
                </TableRow>

                {/* Operating Expenses Section */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-bold text-foreground">Operating Expenses</TableCell>
                </TableRow>
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No expenses recorded</TableCell>
                  </TableRow>
                )}
                {expenses.map((item: any, i: number) => (
                  <TableRow key={`exp-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold text-right pr-6">Total Operating Expenses</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.expenses, "NGN")}</TableCell>
                </TableRow>

                {/* Net Profit/Loss */}
                <TableRow className={`border-t-4 ${incStmt.netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <TableCell className={`font-bold text-lg ${incStmt.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    Net {incStmt.netProfit >= 0 ? 'Profit' : 'Loss'}
                  </TableCell>
                  <TableCell className={`text-right font-bold text-xl numeric ${incStmt.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {formatMoney(incStmt.netProfit, "NGN")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

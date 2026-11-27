"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { LineChart, Printer, Columns, Rows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function IncomeStatementPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");

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
      title="Profit and Loss (Income Statement)" 
      subtitle="View your company's revenue, cost of goods sold, operating expenses, and net profit."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input p-0.5 bg-background">
            <Button
              variant={layout === "horizontal" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setLayout("horizontal")}
            >
              <Columns className="h-3.5 w-3.5" />
              Horizontal (T-Format)
            </Button>
            <Button
              variant={layout === "vertical" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setLayout("vertical")}
            >
              <Rows className="h-3.5 w-3.5" />
              Vertical
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
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
          <div>
            <CardTitle className="text-xl font-display">
              Profit and Loss ({layout === "horizontal" ? "Horizontal T-Format" : "Vertical Format"})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Net Profit = Revenue - Cost of Goods Sold - Operating Expenses</p>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {startDate || endDate 
              ? `${startDate || 'Beginning'} - ${endDate || 'Present'}`
              : 'All Time'}
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
          ) : layout === "horizontal" ? (
            /* Horizontal (T-Format) Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
              {/* Left Column: Expenses & Cost of Goods */}
              <div className="p-4 space-y-4">
                <div className="bg-primary/5 p-2 rounded font-bold text-lg text-primary flex justify-between items-center">
                  <span>Expenses &amp; COGS</span>
                  <span className="text-sm font-normal text-muted-foreground">Debit balances</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Account</TableHead>
                      <TableHead className="text-right">Amount (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cogs.map((item: any, i: number) => (
                      <TableRow key={`cogs-h-${i}`}>
                        <TableCell className="text-sm">{item.name} <span className="text-xs text-muted-foreground">(COGS)</span></TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    {expenses.map((item: any, i: number) => (
                      <TableRow key={`exp-h-${i}`}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    {cogs.length === 0 && expenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-center py-4">No expenses recorded</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/40 font-bold border-t">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right numeric text-red-600">
                        {formatMoney((incStmt.cogs || 0) + (incStmt.expenses || 0), "NGN")}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50/50 font-bold">
                      <TableCell className="text-emerald-800">Net Profit (Balance Carried Down)</TableCell>
                      <TableCell className="text-right numeric text-emerald-700">
                        {formatMoney(incStmt.netProfit, "NGN")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Right Column: Revenues & Income */}
              <div className="p-4 space-y-4">
                <div className="bg-primary/5 p-2 rounded font-bold text-lg text-primary flex justify-between items-center">
                  <span>Revenues &amp; Incomes</span>
                  <span className="text-sm font-normal text-muted-foreground">Credit balances</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Revenue Account</TableHead>
                      <TableHead className="text-right">Amount (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.map((item: any, i: number) => (
                      <TableRow key={`rev-h-${i}`}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    {revenues.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-center py-4">No revenues recorded</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/40 font-bold border-t">
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right numeric text-emerald-700">
                        {formatMoney(incStmt.revenue, "NGN")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Vertical Layout */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-lg text-primary">Revenue</TableCell>
                </TableRow>
                {revenues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No revenues recorded</TableCell>
                  </TableRow>
                )}
                {revenues.map((item: any, i: number) => (
                  <TableRow key={`rev-v-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Revenue</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.revenue, "NGN")}</TableCell>
                </TableRow>

                {/* Cost of Goods Sold */}
                {cogs.length > 0 && (
                  <>
                    <TableRow className="bg-primary/5 mt-4">
                      <TableCell colSpan={2} className="font-bold text-lg text-primary">Cost of Goods Sold</TableCell>
                    </TableRow>
                    {cogs.map((item: any, i: number) => (
                      <TableRow key={`cogs-v-${i}`}>
                        <TableCell className="pl-6">{item.name}</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-bold text-right pr-6">Total Cost of Goods Sold</TableCell>
                      <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.cogs, "NGN")}</TableCell>
                    </TableRow>

                    <TableRow className="bg-muted/50 font-bold border-y">
                      <TableCell className="text-lg">Gross Profit</TableCell>
                      <TableCell className="text-right text-lg numeric">{formatMoney(incStmt.grossProfit, "NGN")}</TableCell>
                    </TableRow>
                  </>
                )}

                {/* Expenses Section */}
                <TableRow className="bg-primary/5 mt-4">
                  <TableCell colSpan={2} className="font-bold text-lg text-primary">Operating Expenses</TableCell>
                </TableRow>
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No expenses recorded</TableCell>
                  </TableRow>
                )}
                {expenses.map((item: any, i: number) => (
                  <TableRow key={`exp-v-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Operating Expenses</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(incStmt.expenses, "NGN")}</TableCell>
                </TableRow>

                {/* Net Income */}
                <TableRow className="bg-primary/10 font-bold border-t-2">
                  <TableCell className="text-lg">Net Profit</TableCell>
                  <TableCell className={`text-right font-bold text-lg numeric ${incStmt.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
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

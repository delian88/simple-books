"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { Building2, Printer, Columns, Rows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function BalanceSheetPage() {
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

  const balSheet = data?.balanceSheet;
  const assets = balSheet?.details?.filter((d: any) => d.type === 'ASSET') || [];
  const liabilities = balSheet?.details?.filter((d: any) => d.type === 'LIABILITY') || [];
  const equity = balSheet?.details?.filter((d: any) => d.type === 'EQUITY') || [];

  return (
    <AppShell 
      title="Balance Sheet" 
      subtitle="View your company's assets, liabilities, and equity in horizontal (T-shape) or vertical format."
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
              Balance Sheet ({layout === "horizontal" ? "Horizontal T-Format" : "Vertical Format"})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Assets = Liabilities + Owner&apos;s Equity</p>
          </div>
          <div className="text-sm text-muted-foreground font-medium" suppressHydrationWarning>
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
          ) : !balSheet ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display">No statement data</h3>
              <p className="mt-2 text-muted-foreground max-w-[300px]">There are no financial records to display.</p>
            </div>
          ) : layout === "horizontal" ? (
            /* Horizontal (T-Shape) Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
              {/* Left Column: Assets */}
              <div className="p-4 space-y-4">
                <div className="bg-primary/5 p-2 rounded font-bold text-lg text-primary flex justify-between items-center">
                  <span>Assets</span>
                  <span className="text-sm font-normal text-muted-foreground">Debit balances</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Account</TableHead>
                      <TableHead className="text-right">Amount (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-center py-4">No assets recorded</TableCell>
                      </TableRow>
                    ) : (
                      assets.map((item: any, i: number) => (
                        <TableRow key={`asset-h-${i}`}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-muted/40 font-bold border-t-2">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right numeric text-emerald-700">{formatMoney(balSheet.assets, "NGN")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Right Column: Liabilities & Equity */}
              <div className="p-4 space-y-4">
                <div className="bg-primary/5 p-2 rounded font-bold text-lg text-primary flex justify-between items-center">
                  <span>Liabilities &amp; Equity</span>
                  <span className="text-sm font-normal text-muted-foreground">Credit balances</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Liabilities &amp; Equity Account</TableHead>
                      <TableHead className="text-right">Amount (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={2} className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Liabilities</TableCell>
                    </TableRow>
                    {liabilities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-muted-foreground text-center py-2 text-xs">No liabilities recorded</TableCell>
                      </TableRow>
                    ) : (
                      liabilities.map((item: any, i: number) => (
                        <TableRow key={`liab-h-${i}`}>
                          <TableCell className="pl-4">{item.name}</TableCell>
                          <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={2} className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Equity</TableCell>
                    </TableRow>
                    {equity.map((item: any, i: number) => (
                      <TableRow key={`eq-h-${i}`}>
                        <TableCell className="pl-4">{item.name}</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                      </TableRow>
                    ))}
                    {data?.incomeStatement?.netProfit !== 0 && (
                      <TableRow>
                        <TableCell className="pl-4 text-muted-foreground italic">Current Period Earnings</TableCell>
                        <TableCell className="text-right numeric">{formatMoney(data?.incomeStatement?.netProfit || 0, "NGN")}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/40 font-bold border-t-2">
                      <TableCell>Total Liabilities &amp; Equity</TableCell>
                      <TableCell className="text-right numeric text-blue-700">
                        {formatMoney((balSheet.liabilities || 0) + (balSheet.equity || 0), "NGN")}
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
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Assets Section */}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={2} className="font-bold text-lg text-primary">Assets</TableCell>
                </TableRow>
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No assets recorded</TableCell>
                  </TableRow>
                )}
                {assets.map((item: any, i: number) => (
                  <TableRow key={`asset-v-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Assets</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(balSheet.assets, "NGN")}</TableCell>
                </TableRow>

                {/* Liabilities Section */}
                <TableRow className="bg-primary/5 mt-4">
                  <TableCell colSpan={2} className="font-bold text-lg text-primary">Liabilities</TableCell>
                </TableRow>
                {liabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No liabilities recorded</TableCell>
                  </TableRow>
                )}
                {liabilities.map((item: any, i: number) => (
                  <TableRow key={`liab-v-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Liabilities</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(balSheet.liabilities, "NGN")}</TableCell>
                </TableRow>

                {/* Equity Section */}
                <TableRow className="bg-primary/5 mt-4">
                  <TableCell colSpan={2} className="font-bold text-lg text-primary">Equity</TableCell>
                </TableRow>
                {equity.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">No equity recorded</TableCell>
                  </TableRow>
                )}
                {equity.map((item: any, i: number) => (
                  <TableRow key={`eq-v-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                
                {data?.incomeStatement?.netProfit !== 0 && (
                  <TableRow>
                    <TableCell className="pl-6 text-muted-foreground italic">Current Year Earnings</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(data?.incomeStatement?.netProfit || 0, "NGN")}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Equity</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(balSheet.equity, "NGN")}</TableCell>
                </TableRow>

                {/* Check: Total Liabilities + Equity */}
                <TableRow className="bg-primary/10 font-bold border-t-2">
                  <TableCell className="text-lg">Total Liabilities &amp; Equity</TableCell>
                  <TableCell className="text-right font-bold text-lg numeric text-primary">
                    {formatMoney((balSheet.liabilities || 0) + (balSheet.equity || 0), "NGN")}
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

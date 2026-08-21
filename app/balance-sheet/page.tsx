"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFinancialStatements } from "@/lib/ledger.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/accounting";
import { Building2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function BalanceSheetPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      subtitle="View your company's assets, liabilities, and equity."
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
          <CardTitle className="text-xl font-display">Balance Sheet</CardTitle>
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
          ) : (
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
                  <TableRow key={`asset-${i}`}>
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
                  <TableRow key={`liab-${i}`}>
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
                  <TableRow key={`eq-${i}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    <TableCell className="text-right numeric">{formatMoney(item.balance, "NGN")}</TableCell>
                  </TableRow>
                ))}
                
                {/* Ensure Current Year Earnings is shown if not already in equity details */}
                {data?.incomeStatement?.netProfit !== 0 && (
                  <TableRow>
                    <TableCell className="pl-6 text-muted-foreground italic">Current Year Earnings</TableCell>
                    <TableCell className="text-right numeric text-muted-foreground italic">{formatMoney(data?.incomeStatement?.netProfit || 0, "NGN")}</TableCell>
                  </TableRow>
                )}

                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold text-right pr-6">Total Equity</TableCell>
                  <TableCell className="text-right font-bold numeric">{formatMoney(balSheet.equity, "NGN")}</TableCell>
                </TableRow>

                {/* Total Liabilities & Equity */}
                <TableRow className="border-t-4 border-primary/20 bg-primary/10">
                  <TableCell className="font-bold text-lg text-primary text-right pr-6">Total Liabilities & Equity</TableCell>
                  <TableCell className="text-right font-bold text-xl text-primary numeric">
                    {formatMoney(balSheet.liabilities + balSheet.equity, "NGN")}
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

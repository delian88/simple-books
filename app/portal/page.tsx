"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPortal, money } from "@/lib/modules.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";

function PortalView() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-portal", token],
    enabled: !!token,
    queryFn: () => getPortal(token),
  });

  if (!token) {
    return <div className="mx-auto max-w-xl p-12 text-center text-muted-foreground">Missing customer portal token. Ask your vendor for your portal link.</div>;
  }
  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" /></div>;
  }
  if (error) {
    return <div className="mx-auto max-w-xl p-12 text-center text-red-600">{(error as Error).message}</div>;
  }

  const invoices = data?.invoices || [];
  const totalDue = invoices.filter((i: any) => i.status !== "PAID").reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Customer Portal</p>
            <h1 className="font-display text-3xl font-bold text-gray-900">{data?.company}</h1>
            <p className="text-sm text-gray-600">Statement for <b>{data?.customer?.name}</b> ({data?.customer?.email || "No email"})</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Invoices ({invoices.length})</CardTitle>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold text-emerald-700">{money(totalDue)}</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{new Date(inv.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{money(inv.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CustomerPortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading portal...</div>}>
      <PortalView />
    </Suspense>
  );
}

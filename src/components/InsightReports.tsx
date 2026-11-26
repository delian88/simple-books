"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listInvoices, listTransactions } from "@/lib/accounting.functions";
import { listRecords, money } from "@/lib/modules.functions";

const arr = (x: any): any[] => (Array.isArray(x) ? x : []);

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 font-display text-2xl font-bold ${tone || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="mt-6 space-y-6">{children}</div>
    </AppShell>
  );
}

export function TaxReport() {
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: async () => arr(await listInvoices()) });
  const { data: pos = [] } = useQuery({ queryKey: ["records", "purchase_order"], queryFn: async () => arr(await listRecords("purchase_order")) });
  const output = invoices.reduce((s, i) => s + Number(i.tax_amount || 0), 0);
  const billed = pos.filter((p) => ["RECEIVED", "BILLED", "PAID"].includes(p.status));
  const input = billed.reduce((s, p) => s + Number(p.tax_amount || 0), 0);
  return (
    <Shell title="Tax Summary" subtitle="Output tax on sales, input tax credit on purchases and net liability.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Output tax (sales)" value={money(output)} />
        <Kpi label="Input tax credit" value={money(input)} />
        <Kpi label="Net payable" value={money(output - input)} tone="text-emerald-700" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.invoice_number}</TableCell>
                  <TableCell>{i.customer_name || "-"}</TableCell>
                  <TableCell className="text-right">{money(i.subtotal)}</TableCell>
                  <TableCell className="text-right">{money(i.tax_amount)}</TableCell>
                  <TableCell className="text-right">{money(i.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}

export function CashFlowReport() {
  const { data: tx = [] } = useQuery({ queryKey: ["transactions"], queryFn: async () => arr(await listTransactions()) });
  const byMonth: Record<string, { inflow: number; outflow: number }> = {};
  tx.forEach((t) => {
    const m = (t.occurredOn || "").slice(0, 7) || "unknown";
    byMonth[m] ||= { inflow: 0, outflow: 0 };
    byMonth[m][t.direction === "inflow" ? "inflow" : "outflow"] += Number(t.amount || 0);
  });
  const months = Object.keys(byMonth).sort();
  let running = 0;
  const totalIn = months.reduce((s, m) => s + byMonth[m].inflow, 0);
  const totalOut = months.reduce((s, m) => s + byMonth[m].outflow, 0);
  return (
    <Shell title="Cash Flow Statement" subtitle="Cash in, cash out and closing balance by month.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Cash in" value={money(totalIn)} />
        <Kpi label="Cash out" value={money(totalOut)} />
        <Kpi label="Net cash flow" value={money(totalIn - totalOut)} tone="text-emerald-700" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Cash in</TableHead>
                <TableHead className="text-right">Cash out</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Closing balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((m) => {
                const net = byMonth[m].inflow - byMonth[m].outflow;
                running += net;
                return (
                  <TableRow key={m}>
                    <TableCell>{m}</TableCell>
                    <TableCell className="text-right">{money(byMonth[m].inflow)}</TableCell>
                    <TableCell className="text-right">{money(byMonth[m].outflow)}</TableCell>
                    <TableCell className="text-right">{money(net)}</TableCell>
                    <TableCell className="text-right font-semibold">{money(running)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}

export function DayBook() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: tx = [] } = useQuery({ queryKey: ["transactions"], queryFn: async () => arr(await listTransactions()) });
  const rows = tx.filter((t) => (!from || t.occurredOn >= from) && (!to || t.occurredOn <= to));
  return (
    <Shell title="Day Book" subtitle="Every transaction in date order.">
      <div className="flex gap-3">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Debit (out)</TableHead>
                <TableHead className="text-right">Credit (in)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t, i) => (
                <TableRow key={t.id + i}>
                  <TableCell>{t.occurredOn}</TableCell>
                  <TableCell>{t.counterparty || t.note || "-"}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{t.source}</TableCell>
                  <TableCell className="text-right">{t.direction === "outflow" ? money(t.amount) : ""}</TableCell>
                  <TableCell className="text-right">{t.direction === "inflow" ? money(t.amount) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}

export function AuditTrail() {
  const { data: rows = [] } = useQuery({ queryKey: ["records", "audit"], queryFn: async () => arr(await listRecords("audit")) });
  return (
    <Shell title="Audit Trail" subtitle="Who did what, and when.">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>{r.text}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.user_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  );
}

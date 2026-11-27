"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { listCustomers, listInvoices, listAccounts } from "@/lib/accounting.functions";
import { listRecords, saveRecord, deleteRecord, money, type RecordType } from "@/lib/modules.functions";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  /** "customers" or any record type: renders a select of those records */
  optionsFrom?: string;
  required?: boolean;
  default?: any;
};

export type Column = {
  key: string;
  label: string;
  kind?: "money" | "date" | "badge";
  right?: boolean;
  render?: (row: any) => ReactNode;
};

type Props = {
  title: string;
  subtitle: string;
  type: RecordType;
  noun: string;
  columns: Column[];
  fields: Field[];
  /** enable line items (description, qty, unit price, tax rate) with totals */
  lines?: boolean;
  /** auto number prefix, e.g. "QT" */
  numberPrefix?: string;
  headerActions?: (refresh: () => void) => ReactNode;
  rowActions?: (row: any, refresh: () => void) => ReactNode;
  emptyHint?: string;
};

const blankLine = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0 });

function useOptions(source?: string) {
  return useQuery({
    queryKey: ["options", source],
    enabled: !!source,
    queryFn: async () => {
      if (source === "customers") {
        const rows = await listCustomers();
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({ value: r.id, label: r.name }));
      }
      if (source === "invoices") {
        const rows = await listInvoices();
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: `${r.invoice_number} (${r.customer_name || "Customer"} · ${money(r.total_amount)})`,
        }));
      }
      if (source === "accounts") {
        const rows = await listAccounts();
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: `${r.name} (${r.type || "Account"})`,
        }));
      }
      if (source === "banks") {
        const rows = await listRecords("bank_account" as RecordType);
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: `${r.bank_name || r.name} - ${r.account_number || ""} (${r.account_type || "Bank"})`,
        }));
      }
      if (source === "employees") {
        const rows = await listRecords("employee" as RecordType);
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: `${r.first_name || ""} ${r.last_name || r.name || "Employee"} (${r.department || "Staff"})`,
        }));
      }
      if (source === "vendors") {
        const rows = await listRecords("vendor" as RecordType);
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: r.name || r.company_name || "Vendor",
        }));
      }
      if (source === "purchase_orders") {
        const rows = await listRecords("purchase_order" as RecordType);
        return (Array.isArray(rows) ? rows : []).map((r: any) => ({
          value: r.id,
          label: `${r.number} (${r.vendor_name || "Vendor"} · ${money(r.total_amount || 0)})`,
        }));
      }
      const rows = await listRecords(source as RecordType);
      return (Array.isArray(rows) ? rows : []).map((r: any) => ({
        value: r.id,
        label: r.name || r.number || r.title || r.id,
      }));
    },
  });
}

function SelectField({ field, value, onChange }: { field: Field; value: any; onChange: (v: string, label?: string) => void }) {
  const { data: opts = [] } = useOptions(field.optionsFrom);
  const options = field.optionsFrom ? opts : (field.options || []).map((o) => ({ value: o, label: o }));
  return (
    <select
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
      value={value ?? ""}
      required={field.required}
      onChange={(e) => onChange(e.target.value, options.find((o) => o.value === e.target.value)?.label)}
    >
      <option value="">Select...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ResourcePage({ title, subtitle, type, noun, columns, fields, lines, numberPrefix, headerActions, rowActions, emptyHint }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState<any>({});
  const [items, setItems] = useState<any[]>([blankLine()]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["records", type],
    queryFn: async () => {
      const r = await listRecords(type);
      return Array.isArray(r) ? r : [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["records", type] });

  const saveMut = useMutation({
    mutationFn: ({ data, id }: { data: any; id?: string }) => saveRecord(type, data, id),
    onSuccess: () => {
      refresh();
      setOpen(false);
    },
  });
  const delMut = useMutation({ mutationFn: (id: string) => deleteRecord(type, id), onSuccess: refresh });

  const defaults = () => {
    const d: any = {};
    fields.forEach((f) => (d[f.key] = f.default ?? (f.type === "number" ? 0 : "")));
    return d;
  };

  const openNew = () => {
    setEditId(undefined);
    const d = defaults();
    if (numberPrefix) d.number = `${numberPrefix}-${String(rows.length + 1).padStart(4, "0")}`;
    setForm(d);
    setItems([blankLine()]);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({ ...row });
    setItems(row.lines?.length ? row.lines : [blankLine()]);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form };
    delete data.id;
    delete data.created_at;
    delete data.created_by;
    if (lines) {
      const ls = items.map((l) => ({
        ...l,
        quantity: Number(l.quantity) || 0,
        unit_price: Number(l.unit_price) || 0,
        tax_rate: Number(l.tax_rate) || 0,
        amount: (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
      }));
      data.lines = ls;
      data.subtotal = ls.reduce((s, l) => s + l.amount, 0);
      data.tax_amount = ls.reduce((s, l) => s + (l.amount * l.tax_rate) / 100, 0);
      data.total_amount = data.subtotal + data.tax_amount;
    }
    fields.forEach((f) => {
      if (f.type === "number") data[f.key] = Number(data[f.key]) || 0;
    });
    if (!data.status && fields.some((f) => f.key === "status")) data.status = "DRAFT";
    saveMut.mutate({ data, id: editId });
  };

  const total = items.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * (1 + (Number(l.tax_rate) || 0) / 100), 0);

  const cell = (col: Column, row: any): ReactNode => {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (col.kind === "money") return money(v);
    if (col.kind === "date") return v ? new Date(v).toLocaleDateString() : "-";
    if (col.kind === "badge")
      return <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{v || "-"}</span>;
    return v === undefined || v === null || v === "" ? "-" : String(v);
  };

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {headerActions?.(refresh)}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2">
              <Plus className="h-4 w-4" /> New {noun}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Edit" : "New"} {noun}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {numberPrefix && (
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input value={form.number ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, number: e.target.value }))} />
                  </div>
                )}
                {fields.map((f) => (
                  <div key={f.key} className={`space-y-2 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <Label>{f.label}</Label>
                    {f.type === "select" || f.optionsFrom ? (
                      <SelectField
                        field={f}
                        value={form[f.key]}
                        onChange={(v, label) => setForm((p: any) => ({ ...p, [f.key]: v, [`${f.key}_name`]: label }))}
                      />
                    ) : f.type === "textarea" ? (
                      <textarea
                        className="min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        type={f.type || "text"}
                        step={f.type === "number" ? "any" : undefined}
                        required={f.required}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>

              {lines && (
                <div className="space-y-2">
                  <Label>Line items</Label>
                  {items.map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <Input className="col-span-5" placeholder="Description" value={l.description} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                      <Input className="col-span-2" type="number" placeholder="Qty" value={l.quantity} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
                      <Input className="col-span-2" type="number" placeholder="Price" value={l.unit_price} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, unit_price: e.target.value } : x)))} />
                      <Input className="col-span-2" type="number" placeholder="Tax %" value={l.tax_rate} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, tax_rate: e.target.value } : x)))} />
                      <Button type="button" variant="ghost" size="icon" className="col-span-1 text-red-500" onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, blankLine()])}>
                      + Add line
                    </Button>
                    <span className="text-sm font-semibold">Total (incl. tax): {money(total)}</span>
                  </div>
                </div>
              )}

              {saveMut.isError && <p className="text-sm text-red-600">{(saveMut.error as Error).message}</p>}
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saveMut.isPending} className="bg-[#0B3D2B] text-white">
                  {saveMut.isPending ? "Saving..." : `Save ${noun}`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      }
    >
      <Card className="mt-6 w-full border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="font-display text-lg font-bold">No {noun.toLowerCase()}s yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">{emptyHint || `Create your first ${noun.toLowerCase()} to get started.`}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className={c.right ? "text-right" : ""}>
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.right ? "text-right font-medium" : ""}>
                        {cell(c, row)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rowActions?.(row, refresh)}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => confirm(`Delete this ${noun.toLowerCase()}?`) && delMut.mutate(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

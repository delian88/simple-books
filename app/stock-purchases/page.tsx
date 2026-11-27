"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Boxes, FileText, CheckCircle2 } from "lucide-react";
import { SelectField, type Field } from "@/components/ResourcePage";
import { listRecords, saveRecord, deleteRecord, money, type RecordType } from "@/lib/modules.functions";
import { toast } from "sonner";

const blankLine = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0 });

export default function StockPurchasesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "bills" | "orders">("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"stock_purchase" | "purchase_order">("stock_purchase");
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState<any>({});
  const [items, setItems] = useState<any[]>([blankLine()]);

  // Fetch both Stock Purchases and Purchase Orders
  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ["records", "stock_purchase"],
    queryFn: async () => {
      const r = await listRecords("stock_purchase");
      return Array.isArray(r) ? r : [];
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["records", "purchase_order"],
    queryFn: async () => {
      const r = await listRecords("purchase_order");
      return Array.isArray(r) ? r : [];
    },
  });

  const isLoading = loadingBills || loadingOrders;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["records", "stock_purchase"] });
    qc.invalidateQueries({ queryKey: ["records", "purchase_order"] });
  };

  const saveMut = useMutation({
    mutationFn: ({ type, data, id }: { type: RecordType; data: any; id?: string }) => saveRecord(type, data, id),
    onSuccess: (_, vars) => {
      toast.success(`${vars.type === "stock_purchase" ? "Stock Purchase Bill" : "Purchase Order"} saved successfully!`);
      refresh();
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save record");
    },
  });

  const delMut = useMutation({
    mutationFn: ({ type, id }: { type: RecordType; id: string }) => deleteRecord(type, id),
    onSuccess: () => {
      toast.success("Record deleted");
      refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete record");
    },
  });

  // Fields for Stock Purchase Bill
  const billFields: Field[] = [
    { key: "vendor_id", label: "Vendor", optionsFrom: "vendors", required: true },
    { key: "warehouse_id", label: "Destination Warehouse", optionsFrom: "warehouses" },
    { key: "bill_date", label: "Bill Date", type: "date", required: true, default: () => new Date().toISOString().slice(0, 10) },
    { key: "due_date", label: "Due Date", type: "date" },
    { key: "status", label: "Status", type: "select", options: ["RECEIVED", "BILLED", "PAID"], default: "RECEIVED" },
    { key: "reference", label: "Vendor Invoice Reference" },
    { key: "notes", label: "Notes", type: "textarea" },
  ];

  // Fields for Purchase Order
  const orderFields: Field[] = [
    { key: "vendor_id", label: "Vendor", optionsFrom: "vendors", required: true },
    { key: "order_date", label: "Order Date", type: "date", required: true, default: () => new Date().toISOString().slice(0, 10) },
    { key: "due_date", label: "Due Date", type: "date" },
    { key: "status", label: "Status", type: "select", options: ["DRAFT", "ORDERED", "RECEIVED", "BILLED", "PAID"], default: "DRAFT" },
    { key: "notes", label: "Notes", type: "textarea" },
  ];

  const currentFields = dialogType === "stock_purchase" ? billFields : orderFields;

  const openNew = (type: "stock_purchase" | "purchase_order") => {
    setDialogType(type);
    setEditId(undefined);
    const today = new Date().toISOString().slice(0, 10);
    const prefix = type === "stock_purchase" ? "BILL" : "PO";
    const count = (type === "stock_purchase" ? bills.length : orders.length) + 1;
    const initialForm: any = {
      number: `${prefix}-${String(count).padStart(4, "0")}`,
      status: type === "stock_purchase" ? "RECEIVED" : "DRAFT",
    };
    if (type === "stock_purchase") initialForm.bill_date = today;
    if (type === "purchase_order") initialForm.order_date = today;

    setForm(initialForm);
    setItems([blankLine()]);
    setDialogOpen(true);
  };

  const openEdit = (row: any, type: "stock_purchase" | "purchase_order") => {
    setDialogType(type);
    setEditId(row.id);
    setForm({ ...row });
    setItems(row.lines?.length ? row.lines : [blankLine()]);
    setDialogOpen(true);
  };

  const handleConvertPO = async (po: any) => {
    try {
      const { id, created_at, created_by, ...data } = po;
      await saveRecord("purchase_order", { ...data, status: "BILLED" }, id);
      await saveRecord("stock_purchase", {
        ...data,
        number: `BILL-${data.number || id.slice(0, 6)}`,
        bill_date: new Date().toISOString().slice(0, 10),
        due_date: data.due_date || "",
        status: "BILLED",
        reference: `From PO ${data.number || id}`,
        po_id: id,
      });
      toast.success(`Purchase Order ${po.number || ""} converted to Stock Purchase Bill!`);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to convert purchase order");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form };
    delete data.id;
    delete data.created_at;
    delete data.created_by;

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

    if (!data.status) {
      data.status = dialogType === "stock_purchase" ? "RECEIVED" : "DRAFT";
    }

    saveMut.mutate({ type: dialogType, data, id: editId });
  };

  const total = items.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * (1 + (Number(l.tax_rate) || 0) / 100),
    0
  );

  // Combine bills and orders for the "All Purchases" view
  const allPurchases = [
    ...bills.map((b: any) => ({ ...b, _kind: "bill" as const })),
    ...orders.map((o: any) => ({ ...o, _kind: "po" as const })),
  ].sort((a, b) => {
    const da = new Date(a.bill_date || a.order_date || a.created_at || 0).getTime();
    const db = new Date(b.bill_date || b.order_date || b.created_at || 0).getTime();
    return db - da;
  });

  const getVendorName = (row: any) =>
    row.vendor_id_name || row.vendor_name || row.vendor || "Vendor";

  const getDateValue = (row: any) =>
    row.bill_date || row.order_date || row.date || row.created_at;

  return (
    <AppShell
      title="Stock Purchases"
      subtitle="Record inventory purchases from vendors with automatic stock updates and purchase order tracking."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => openNew("stock_purchase")}
            className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> New Stock Purchase Bill
          </Button>
          <Button
            onClick={() => openNew("purchase_order")}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Purchase Order
          </Button>
        </div>
      }
    >
      <div className="mt-4 space-y-4">
        {/* Navigation Tabs */}
        <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="gap-2">
                <Boxes className="h-4 w-4" />
                All Purchases ({allPurchases.length})
              </TabsTrigger>
              <TabsTrigger value="bills" className="gap-2">
                <FileText className="h-4 w-4" />
                Purchase Bills ({bills.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <FileText className="h-4 w-4" />
                Purchase Orders ({orders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ALL PURCHASES TAB */}
          <TabsContent value="all" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : allPurchases.length === 0 ? (
                  <div className="py-12 text-center">
                    <Boxes className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                    <h3 className="font-display text-lg font-bold">No purchases or bills yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create your first stock purchase bill or purchase order to get started.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Button onClick={() => openNew("stock_purchase")} size="sm" className="bg-[#0B3D2B] text-white">
                        + New Stock Purchase Bill
                      </Button>
                      <Button onClick={() => openNew("purchase_order")} size="sm" variant="outline">
                        + New Purchase Order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPurchases.map((row: any) => {
                        const isBill = row._kind === "bill";
                        return (
                          <TableRow key={`${row._kind}-${row.id}`}>
                            <TableCell>
                              {isBill ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  Stock Bill
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                  Purchase Order
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{row.number || row.id}</TableCell>
                            <TableCell>{getVendorName(row)}</TableCell>
                            <TableCell>{getDateValue(row) ? new Date(getDateValue(row)).toLocaleDateString() : "-"}</TableCell>
                            <TableCell>{row.due_date ? new Date(row.due_date).toLocaleDateString() : "-"}</TableCell>
                            <TableCell>
                              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                                {row.status || "DRAFT"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">{money(row.total_amount || 0)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!isBill && row.status !== "BILLED" && row.status !== "PAID" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1"
                                    onClick={() => handleConvertPO(row)}
                                    title="Convert this purchase order to a stock purchase bill"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    Convert to Bill
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(row, isBill ? "stock_purchase" : "purchase_order")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm(`Delete this ${isBill ? "stock purchase bill" : "purchase order"}?`)) {
                                      delMut.mutate({ type: isBill ? "stock_purchase" : "purchase_order", id: row.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STOCK PURCHASE BILLS TAB */}
          <TabsContent value="bills" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {bills.length === 0 ? (
                  <div className="py-12 text-center">
                    <h3 className="font-display text-lg font-bold">No stock purchase bills yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Create your first stock purchase bill to record inward inventory.</p>
                    <Button onClick={() => openNew("stock_purchase")} size="sm" className="mt-4 bg-[#0B3D2B] text-white">
                      + New Stock Purchase Bill
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill #</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bills.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-semibold">{row.number || row.id}</TableCell>
                          <TableCell>{getVendorName(row)}</TableCell>
                          <TableCell>{row.bill_date ? new Date(row.bill_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>{row.due_date ? new Date(row.due_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              {row.status || "RECEIVED"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{money(row.total_amount || 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(row, "stock_purchase")}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={() => confirm("Delete this stock purchase bill?") && delMut.mutate({ type: "stock_purchase", id: row.id })}
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
          </TabsContent>

          {/* PURCHASE ORDERS TAB */}
          <TabsContent value="orders" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <h3 className="font-display text-lg font-bold">No purchase orders yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Send formal purchase orders to vendors and convert them to bills upon arrival.</p>
                    <Button onClick={() => openNew("purchase_order")} size="sm" variant="outline" className="mt-4">
                      + New Purchase Order
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-semibold">{row.number || row.id}</TableCell>
                          <TableCell>{getVendorName(row)}</TableCell>
                          <TableCell>{row.order_date ? new Date(row.order_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>{row.due_date ? new Date(row.due_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {row.status || "DRAFT"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{money(row.total_amount || 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {row.status !== "BILLED" && row.status !== "PAID" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => handleConvertPO(row)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Convert to bill
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => openEdit(row, "purchase_order")}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                onClick={() => confirm("Delete this purchase order?") && delMut.mutate({ type: "purchase_order", id: row.id })}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "New"} {dialogType === "stock_purchase" ? "Stock Purchase Bill" : "Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Number</Label>
                <Input
                  value={form.number ?? ""}
                  onChange={(e) => setForm((p: any) => ({ ...p, number: e.target.value }))}
                />
              </div>

              {currentFields.map((f) => (
                <div key={f.key} className={`space-y-2 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                  <Label>{f.label}</Label>
                  {f.type === "select" || f.optionsFrom ? (
                    <SelectField
                      field={f}
                      value={form[f.key]}
                      onChange={(v, label) =>
                        setForm((p: any) => ({
                          ...p,
                          [f.key]: v,
                          [`${f.key}_name`]: label,
                          ...(f.optionsFrom === "vendors" || f.optionsFrom === "vendor"
                            ? { vendor_name: label, vendor: label }
                            : {}),
                        }))
                      }
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

            {/* Line Items */}
            <div className="space-y-2">
              <Label>Line items</Label>
              {items.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-5"
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) =>
                      setItems((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Qty"
                    value={l.quantity}
                    onChange={(e) =>
                      setItems((p) => p.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Price"
                    value={l.unit_price}
                    onChange={(e) =>
                      setItems((p) => p.map((x, j) => (j === i ? { ...x, unit_price: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Tax %"
                    value={l.tax_rate}
                    onChange={(e) =>
                      setItems((p) => p.map((x, j) => (j === i ? { ...x, tax_rate: e.target.value } : x)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1 text-red-500"
                    onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))}
                  >
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

            {saveMut.isError && <p className="text-sm text-red-600">{(saveMut.error as Error).message}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMut.isPending} className="bg-[#0B3D2B] text-white">
                {saveMut.isPending
                  ? "Saving..."
                  : `Save ${dialogType === "stock_purchase" ? "Stock Purchase Bill" : "Purchase Order"}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

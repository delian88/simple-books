"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRecords, saveRecord, money } from "@/lib/modules.functions";

const sel = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

export default function InventoryPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ product_id: "", warehouse_id: "", mode: "add", qty: "", to_warehouse_id: "", note: "" });

  const { data: products = [] } = useQuery({ queryKey: ["records", "product"], queryFn: () => listRecords("product") });
  const { data: warehouses = [] } = useQuery({ queryKey: ["records", "warehouse"], queryFn: () => listRecords("warehouse") });
  const { data: moves = [] } = useQuery({ queryKey: ["records", "stock_move"], queryFn: () => listRecords("stock_move") });

  const mut = useMutation({
    mutationFn: async () => {
      const qty = Math.abs(Number(form.qty) || 0);
      if (!form.product_id || !form.warehouse_id || !qty) throw new Error("Choose a product, warehouse and quantity");
      const base = { product_id: form.product_id, note: form.note, date: new Date().toISOString().slice(0, 10) };
      if (form.mode === "transfer") {
        if (!form.to_warehouse_id || form.to_warehouse_id === form.warehouse_id) throw new Error("Choose a different destination warehouse");
        await saveRecord("stock_move", { ...base, warehouse_id: form.warehouse_id, qty: -qty, kind: "transfer-out" });
        await saveRecord("stock_move", { ...base, warehouse_id: form.to_warehouse_id, qty, kind: "transfer-in" });
      } else {
        await saveRecord("stock_move", { ...base, warehouse_id: form.warehouse_id, qty: form.mode === "add" ? qty : -qty, kind: form.mode });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["records", "stock_move"] });
      setForm((f) => ({ ...f, qty: "", note: "" }));
    },
  });

  const qtyOf = (pid: string, wid: string) =>
    moves.filter((m: any) => m.product_id === pid && m.warehouse_id === wid).reduce((s: number, m: any) => s + Number(m.qty || 0), 0);

  const field = (k: keyof typeof form) => ({ value: form[k], onChange: (e: any) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  const totalValue = products.reduce(
    (s: number, p: any) => s + warehouses.reduce((t: number, w: any) => t + qtyOf(p.id, w.id), 0) * Number(p.cost_price || 0),
    0
  );

  return (
    <AppShell title="Inventory & Stock" subtitle="Track stock across warehouses, adjust levels and transfer between locations.">
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-3 p-5">
            <h3 className="font-display text-lg font-bold">Adjust or transfer stock</h3>
            <div className="space-y-1">
              <Label>Action</Label>
              <select className={sel} {...field("mode")}>
                <option value="add">Add stock (purchase / opening)</option>
                <option value="remove">Remove stock (sale / wastage)</option>
                <option value="transfer">Transfer between warehouses</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Product</Label>
              <select className={sel} {...field("product_id")}>
                <option value="">Select...</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{form.mode === "transfer" ? "From warehouse" : "Warehouse"}</Label>
              <select className={sel} {...field("warehouse_id")}>
                <option value="">Select...</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            {form.mode === "transfer" && (
              <div className="space-y-1">
                <Label>To warehouse</Label>
                <select className={sel} {...field("to_warehouse_id")}>
                  <option value="">Select...</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input type="number" {...field("qty")} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Input {...field("note")} />
            </div>
            {mut.isError && <p className="text-sm text-red-600">{(mut.error as Error).message}</p>}
            <Button className="w-full bg-[#0B3D2B] text-white" disabled={mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? "Saving..." : "Apply"}
            </Button>
            <p className="text-xs text-muted-foreground">Add products under Products and locations under Warehouses first.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-display text-lg font-bold">Stock levels</h3>
              <span className="text-sm text-muted-foreground">
                Stock valuation: <b className="text-foreground">{money(totalValue)}</b>
              </span>
            </div>
            {products.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No products yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    {warehouses.map((w: any) => (
                      <TableHead key={w.id} className="text-right">
                        {w.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => {
                    const total = warehouses.reduce((s: number, w: any) => s + qtyOf(p.id, w.id), 0);
                    const low = total <= Number(p.reorder_level || 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        {warehouses.map((w: any) => (
                          <TableCell key={w.id} className="text-right">
                            {qtyOf(p.id, w.id)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">{total}</TableCell>
                        <TableCell className="text-right">{money(total * Number(p.cost_price || 0))}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${low ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {low ? "Low stock" : "OK"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

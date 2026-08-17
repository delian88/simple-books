import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInvoices, createSalesInvoice, listCustomers, updateSalesInvoice, updateInvoiceStatus } from "@/lib/ar.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, FileText, Calendar, Clock, Trash2, X, Loader2, AlertTriangle, Mail, CheckCircle, Edit, Ban
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales/invoices")({
  component: InvoicesPage,
});

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: "Draft",     className: "bg-gray-100 text-gray-600 border-gray-200" },
  SENT:      { label: "Sent",      className: "bg-blue-50 text-blue-700 border-blue-200" },
  PARTIAL:   { label: "Partial",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID:      { label: "Paid",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  OVERDUE:   { label: "Overdue",   className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-400 border-gray-200" },
};

function fmtCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount);
}

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

function NewInvoiceModal({
  open,
  onClose,
  customers,
  invoice,
}: {
  open: boolean;
  onClose: () => void;
  customers: any[];
  invoice?: any;
}) {
  const qc = useQueryClient();
  const doCreate = useServerFn(createSalesInvoice);
  const doUpdate = useServerFn(updateSalesInvoice);

  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setCustomerId(invoice.customerId);
        setInvoiceNumber(invoice.invoiceNumber);
        setIssueDate(new Date(invoice.issueDate).toISOString().split("T")[0]);
        setDueDate(new Date(invoice.dueDate).toISOString().split("T")[0]);
        setNotes(invoice.notes || "");
        setLines(
          invoice.lines.map((l: any) => ({
            description: l.description,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            taxRate: Number(l.taxRate),
          }))
        );
      } else {
        resetForm();
      }
    }
  }, [open, invoice]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Please select a customer");
      if (lines.some((l) => !l.description)) throw new Error("All line items need a description");
      
      const payload = {
        customer_id: customerId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        notes,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          tax_rate: l.taxRate,
          amount: l.quantity * l.unitPrice,
        })),
      };

      if (invoice) {
        await doUpdate({ data: { id: invoice.id, ...payload } });
      } else {
        await doCreate({ data: payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salesInvoices"] });
      toast.success(invoice ? "Invoice updated successfully!" : "Invoice created successfully!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || (invoice ? "Failed to update invoice" : "Failed to create invoice"));
    },
  });

  function resetForm() {
    setCustomerId("");
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
    setNotes("");
    setLines([{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100), 0);
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {invoice ? "Edit Invoice" : "New Sales Invoice"}
            </DialogTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer <span className="text-red-500">*</span></Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a customer…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice Number <span className="text-red-500">*</span></Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 w-[40%]">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[12%]">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[18%]">Unit Price (₦)</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[12%]">Tax %</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 w-[15%]">Amount</th>
                    <th className="w-[3%]" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(i, "description", e.target.value)}
                          placeholder="Service or product"
                          className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                          className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unitPrice}
                          onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))}
                          className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={line.taxRate}
                          onChange={(e) => updateLine(i, "taxRate", Number(e.target.value))}
                          className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 p-0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800 tabular-nums">
                        {fmtCurrency(line.quantity * line.unitPrice)}
                      </td>
                      <td className="px-2 py-2">
                        {lines.length > 1 && (
                          <button
                            onClick={() => removeLine(i)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmtCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span className="tabular-nums">{fmtCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span className="tabular-nums">{fmtCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes / Terms</Label>
            <Textarea
              placeholder="Payment terms, thank you message, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 gap-2"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><FileText className="h-4 w-4" /> {invoice ? "Save Changes" : "Create Invoice"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailModal({
  invoice,
  open,
  onClose,
  onEdit,
}: {
  invoice: any | null;
  open: boolean;
  onClose: () => void;
  onEdit: (invoice: any) => void;
}) {
  const qc = useQueryClient();
  const doUpdateStatus = useServerFn(updateInvoiceStatus);

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await doUpdateStatus({ data: { id: invoice.id, status } });
      return status;
    },
    onSuccess: (status) => {
      qc.invalidateQueries({ queryKey: ["salesInvoices"] });
      if (status === "SENT") {
        toast.info("Email sending is disabled for now");
        toast.success("Invoice marked as Sent.");
      } else {
        toast.success(`Invoice marked as ${status}.`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  if (!invoice) return null;

  const cfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const currency = invoice.customer?.currency || "NGN";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Invoice {invoice.invoiceNumber}
              </DialogTitle>
              <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {invoice.status === "DRAFT" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => {
                      onClose();
                      onEdit(invoice);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate("SENT")}
                  >
                    <Mail className="h-3.5 w-3.5" /> Send via Email
                  </Button>
                </>
              )}
              {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate("PAID")}
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                </Button>
              )}
              {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8 text-gray-500 hover:text-red-600"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate("CANCELLED")}
                >
                  <Ban className="h-3.5 w-3.5" /> Mark as Void
                </Button>
              )}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Bill To</p>
              <h3 className="text-lg font-bold text-gray-900">{invoice.customer?.name}</h3>
              {invoice.customer?.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
              {invoice.customer?.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
            </div>
            <div className="text-right text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-gray-500">Issue Date:</span>
                <span className="font-medium text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                <span className="text-gray-500">Due Date:</span>
                <span className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Unit Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Tax %</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines?.map((line: any) => (
                  <tr key={line.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-800">{line.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{line.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtCurrency(line.unitPrice, currency)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{line.taxRate}%</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                      {fmtCurrency(line.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmtCurrency(invoice.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax Amount</span>
                <span className="tabular-nums">{fmtCurrency(invoice.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="tabular-nums">{fmtCurrency(invoice.totalAmount, currency)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <span className="font-semibold block mb-1">Notes / Terms:</span>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoicesPage() {
  const getInvoices = useServerFn(listInvoices);
  const getCustomers = useServerFn(listCustomers);
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: invoices = [], isLoading, isError } = useQuery({
    queryKey: ["salesInvoices"],
    queryFn: () => getInvoices(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(),
  });

  const invoicesList = Array.isArray(invoices) ? invoices : [];
  
  const filtered = invoicesList.filter(
    (inv: any) =>
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalOutstanding = invoicesList
    .filter((i: any) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
    .reduce((s: number, i: any) => s + i.totalAmount, 0);
  const totalPaid = invoicesList
    .filter((i: any) => i.status === "PAID")
    .reduce((s: number, i: any) => s + i.totalAmount, 0);
  const overdueCount = invoicesList.filter((i: any) => i.status === "OVERDUE").length;

  return (
    <AppShell
      title="Sales Invoices"
      subtitle="Manage and track your customer invoices"
      actions={
        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 shadow-sm gap-2">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      }
    >
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmtCurrency(totalOutstanding)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{(invoices as any[]).filter((i) => ["SENT","PARTIAL","OVERDUE"].includes(i.status)).length} invoices</p>
        </Card>
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmtCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{(invoices as any[]).filter((i) => i.status === "PAID").length} invoices</p>
        </Card>
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{overdueCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">requires attention</p>
        </Card>
      </div>

      {/* Search + Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice # or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-600">Invoice #</TableHead>
              <TableHead className="font-semibold text-gray-600">Customer</TableHead>
              <TableHead className="font-semibold text-gray-600">Issue Date</TableHead>
              <TableHead className="font-semibold text-gray-600">Due Date</TableHead>
              <TableHead className="font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Amount</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading invoices…</p>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <AlertTriangle className="h-6 w-6 text-red-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Failed to load invoices. Please refresh.</p>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <FileText className="h-8 w-8 mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No invoices yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click "New Invoice" to create your first one</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv: any) => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.DRAFT;
                const currency = inv.customer?.currency ?? "NGN";
                return (
                  <TableRow key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                    <TableCell className="font-semibold text-[#0B3D2B] text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm text-gray-700">{inv.customer?.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(inv.issueDate).toLocaleDateString("en-NG", { day:"2-digit", month:"short", year:"numeric" })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(inv.dueDate).toLocaleDateString("en-NG", { day:"2-digit", month:"short", year:"numeric" })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-800 tabular-nums">
                      {fmtCurrency(inv.totalAmount, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setViewModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <NewInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        customers={customers as any[]}
      />
      
      <NewInvoiceModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedInvoice(null);
        }}
        customers={customers as any[]}
        invoice={selectedInvoice}
      />

      <InvoiceDetailModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onEdit={(inv) => {
          setSelectedInvoice(inv);
          setEditModalOpen(true);
        }}
      />
    </div>
    </AppShell>
  );
}

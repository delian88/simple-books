"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportsData, money } from "@/lib/modules.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  FileText, 
  Scale, 
  ScrollText, 
  Search, 
  Printer, 
  ArrowUpRight, 
  Boxes, 
  Users, 
  Landmark, 
  CreditCard,
  PieChart,
  BarChart3,
  DollarSign
} from "lucide-react";
import Link from "next/link";

export type ReportDef = {
  id: string;
  title: string;
  description: string;
  category: "financial" | "sales" | "expenses" | "transactions" | "inventory" | "payroll";
  icon: any;
  directHref?: string;
};

export const ALL_REPORTS: ReportDef[] = [
  // ── Financial Reports ────────────────────────────────────────────────
  {
    id: "balance-sheet-h",
    title: "Balance Sheet (Horizontal)",
    description: "Assets, liabilities & equity side-by-side in classic T-format.",
    category: "financial",
    icon: Building2,
    directHref: "/balance-sheet",
  },
  {
    id: "balance-sheet-v",
    title: "Balance Sheet (Vertical)",
    description: "Assets, liabilities & equity presented in vertical presentation format.",
    category: "financial",
    icon: Building2,
    directHref: "/balance-sheet",
  },
  {
    id: "pnl-h",
    title: "Profit and Loss (Horizontal)",
    description: "Expenses on the left, revenues on the right.",
    category: "financial",
    icon: Scale,
    directHref: "/income-statement",
  },
  {
    id: "pnl-v",
    title: "Profit and Loss (Vertical)",
    description: "Revenue minus cost of goods sold and operating expenses.",
    category: "financial",
    icon: Scale,
    directHref: "/income-statement",
  },
  {
    id: "trial-balance",
    title: "Trial Balance",
    description: "Verify that total debit balances equal total credit balances.",
    category: "financial",
    icon: Scale,
    directHref: "/trial-balance",
  },
  {
    id: "tax-summary",
    title: "Taxation & VAT Summary",
    description: "Output tax collected on sales, input tax credit on purchases, and net tax payable.",
    category: "financial",
    icon: FileText,
    directHref: "/reports/tax",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Operating cash inflows, cash outflows, and net closing cash balance by month.",
    category: "financial",
    icon: DollarSign,
    directHref: "/reports/cash-flow",
  },

  // ── Sales Reports ────────────────────────────────────────────────────
  {
    id: "sales-register",
    title: "Sales Register",
    description: "Detailed chronological record of all sales invoices issued.",
    category: "sales",
    icon: FileText,
  },
  {
    id: "invoice-settlement",
    title: "Invoice Settlement",
    description: "All payments and receipts collected against customer invoices.",
    category: "sales",
    icon: CreditCard,
  },
  {
    id: "receivable-aging",
    title: "Receivable Aging",
    description: "Breakdown of overdue invoices categorized into 30, 60, and 90+ days aging buckets.",
    category: "sales",
    icon: ScrollText,
  },
  {
    id: "customer-summary",
    title: "Customer Summary",
    description: "Total sales, total collections, and outstanding receivable balance by customer.",
    category: "sales",
    icon: Users,
  },
  {
    id: "customer-statement",
    title: "Customer Statement",
    description: "Generate and view transaction account statements for clients.",
    category: "sales",
    icon: ScrollText,
    directHref: "/account-statement",
  },

  // ── Expense Reports ──────────────────────────────────────────────────
  {
    id: "expenses-summary",
    title: "Expenses Summary",
    description: "Overview of all operating expenses grouped by expense category.",
    category: "expenses",
    icon: PieChart,
  },
  {
    id: "purchase-summary",
    title: "Purchase Summary",
    description: "All vendor purchase orders and stock purchase bills.",
    category: "expenses",
    icon: ArrowUpRight,
  },
  {
    id: "outstanding-bills",
    title: "Outstanding Purchase Bills",
    description: "Unpaid vendor bills and accounts payable awaiting disbursement.",
    category: "expenses",
    icon: FileText,
  },
  {
    id: "vendor-summary",
    title: "Vendor Summary",
    description: "Total purchases, payments made, and current payable balances by vendor.",
    category: "expenses",
    icon: Users,
  },

  // ── Transaction Reports ──────────────────────────────────────────────
  {
    id: "general-journal",
    title: "General Journal (Journal Vouchers)",
    description: "Complete journal voucher entries with debit and credit lines.",
    category: "transactions",
    icon: FileText,
    directHref: "/ledger",
  },
  {
    id: "day-book",
    title: "Day Book",
    description: "Every accounting transaction in chronological order with debit and credit amounts.",
    category: "transactions",
    icon: ScrollText,
    directHref: "/reports/day-book",
  },
  {
    id: "cash-book",
    title: "Cash & Bank Book",
    description: "Bank and cash account inflows, outflows, and running balances.",
    category: "transactions",
    icon: Landmark,
  },
  {
    id: "bank-reconciliation-report",
    title: "Bank Reconciliation Report",
    description: "Bank statement lines, auto-matched items, and reconciliation history.",
    category: "transactions",
    icon: Landmark,
    directHref: "/bank-reconciliation",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    description: "Comprehensive immutable log of user activity, created, edited, and deleted records.",
    category: "transactions",
    icon: ScrollText,
    directHref: "/audit-trail",
  },

  // ── Inventory Reports ────────────────────────────────────────────────
  {
    id: "product-stock",
    title: "Product Wise Stock",
    description: "Current stock quantity on hand, unit cost, and stock valuation per product.",
    category: "inventory",
    icon: Boxes,
  },
  {
    id: "warehouse-stock",
    title: "Warehouse Wise Stock",
    description: "Stock distribution and quantities across all storage locations.",
    category: "inventory",
    icon: Building2,
  },
  {
    id: "low-stock",
    title: "Low Stock Alert Report",
    description: "Products with current stock level below the recommended reorder threshold.",
    category: "inventory",
    icon: Boxes,
  },
  {
    id: "inventory-valuation",
    title: "Inventory Valuation",
    description: "Comprehensive valuation report of total inventory assets on balance sheet.",
    category: "inventory",
    icon: BarChart3,
  },

  // ── Payroll Reports ──────────────────────────────────────────────────
  {
    id: "payment-advice",
    title: "Payment Advice (Bank Disbursement)",
    description: "Schedule of employee bank accounts, account numbers, and net salary disbursements.",
    category: "payroll",
    icon: Landmark,
  },
  {
    id: "payroll-breakup",
    title: "Breakup by Employee",
    description: "Detailed salary components: basic salary, allowances, tax/pension deductions, and net pay.",
    category: "payroll",
    icon: Users,
  },
];

export function ProfitBooksReportsHub() {
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("financial");

  const { data, isLoading } = useQuery({
    queryKey: ["reports_data"],
    queryFn: () => getReportsData(),
  });

  const filteredReports = ALL_REPORTS.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const reportsByTab = filteredReports.filter((r) =>
    searchTerm ? true : r.category === activeTab
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all 25+ financial reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing {reportsByTab.length} reports
        </div>
      </div>

      {/* Tabs */}
      {!searchTerm && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/60">
            <TabsTrigger value="financial" className="text-xs py-2">Financial</TabsTrigger>
            <TabsTrigger value="sales" className="text-xs py-2">Sales</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs py-2">Expenses</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs py-2">Transactions</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs py-2">Inventory</TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs py-2">Payroll</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsByTab.map((report) => {
          const Icon = report.icon;
          const content = (
            <Card
              className="h-full hover:border-primary/50 transition-all hover:shadow-md cursor-pointer border-border group"
              onClick={() => {
                if (!report.directHref) setSelectedReport(report);
              }}
            >
              <CardHeader className="flex flex-row items-start space-x-3 pb-2">
                <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                    {report.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {report.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          );

          if (report.directHref) {
            return (
              <Link key={report.id} href={report.directHref} className="block">
                {content}
              </Link>
            );
          }

          return <div key={report.id}>{content}</div>;
        })}
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <DialogTitle className="text-xl font-bold">{selectedReport.title}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedReport.description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5">
                <Printer className="h-4 w-4" />
                Print / Export
              </Button>
            </DialogHeader>

            <div className="mt-4">
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading report data...</div>
              ) : (
                <ReportViewerContent reportId={selectedReport.id} data={data} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ReportViewerContent({ reportId, data }: { reportId: string; data: any }) {
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const bills = data?.bills || [];
  const purchaseOrders = data?.purchaseOrders || [];
  const expenses = data?.expenses || [];
  const products = data?.products || [];
  const warehouses = data?.warehouses || [];
  const payrollRuns = data?.payrollRuns || [];
  const employees = data?.employees || [];
  const transactions = data?.transactions || [];

  // 1. Sales Register
  if (reportId === "sales-register") {
    const totalSales = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
    const totalTax = invoices.reduce((s: number, i: any) => s + Number(i.tax_amount || 0), 0);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Total Invoices</span>
            <p className="text-xl font-bold">{invoices.length}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Gross Revenue</span>
            <p className="text-xl font-bold text-emerald-700">{money(totalSales)}</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No invoices recorded</TableCell></TableRow>
            ) : (
              invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-semibold">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.customer_name || "Customer"}</TableCell>
                  <TableCell className="text-xs">{inv.issue_date?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">{money(inv.tax_amount)}</TableCell>
                  <TableCell className="text-right font-semibold">{money(inv.total_amount)}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded font-medium bg-muted">{inv.status}</span></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 2. Invoice Settlement
  if (reportId === "invoice-settlement") {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt / Ref</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead className="text-right">Amount Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No receipts recorded</TableCell></TableRow>
            ) : (
              payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.reference || "Receipt"}</TableCell>
                  <TableCell>{p.customer_name || "Customer"}</TableCell>
                  <TableCell className="text-xs">{p.date?.slice(0, 10)}</TableCell>
                  <TableCell className="text-xs">{p.payment_method}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-700">{money(p.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 3. Receivable Aging
  if (reportId === "receivable-aging") {
    const today = new Date().getTime();
    const openInvoices = invoices.filter((i: any) => i.status !== "PAID" && i.status !== "CANCELLED");

    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90Plus = 0;

    openInvoices.forEach((inv: any) => {
      const due = new Date(inv.due_date || inv.issue_date).getTime();
      const diffDays = Math.floor((today - due) / (1000 * 3600 * 24));
      const amt = Number(inv.total_amount || 0);
      if (diffDays <= 0) current += amt;
      else if (diffDays <= 30) days30 += amt;
      else if (diffDays <= 60) days60 += amt;
      else days90Plus += amt;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Current / Not Due</span>
            <p className="text-lg font-bold text-emerald-700">{money(current)}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">1 - 30 Days</span>
            <p className="text-lg font-bold text-amber-700">{money(days30)}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">31 - 60 Days</span>
            <p className="text-lg font-bold text-orange-700">{money(days60)}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">90+ Days Overdue</span>
            <p className="text-lg font-bold text-red-700">{money(days90Plus)}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Outstanding Amount</TableHead>
              <TableHead>Aging</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openInvoices.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No overdue invoices! All customers are current.</TableCell></TableRow>
            ) : (
              openInvoices.map((inv: any) => {
                const due = new Date(inv.due_date || inv.issue_date).getTime();
                const diffDays = Math.max(0, Math.floor((today - due) / (1000 * 3600 * 24)));
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer_name || "Customer"}</TableCell>
                    <TableCell className="text-xs">{inv.due_date?.slice(0, 10)}</TableCell>
                    <TableCell className="text-right font-semibold">{money(inv.total_amount)}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded font-medium ${diffDays > 60 ? 'bg-red-100 text-red-700' : 'bg-muted'}`}>{diffDays} days</span></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 4. Customer Summary
  if (reportId === "customer-summary") {
    const custMap: Record<string, { name: string; invoiced: number; paid: number }> = {};
    invoices.forEach((i: any) => {
      const c = i.customer_name || "Customer";
      if (!custMap[c]) custMap[c] = { name: c, invoiced: 0, paid: 0 };
      custMap[c].invoiced += Number(i.total_amount || 0);
      if (i.status === "PAID") custMap[c].paid += Number(i.total_amount || 0);
    });
    const summary = Object.values(custMap);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead className="text-right">Total Invoiced</TableHead>
            <TableHead className="text-right">Total Paid</TableHead>
            <TableHead className="text-right">Net Receivable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No customer transactions</TableCell></TableRow>
          ) : (
            summary.map((c: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right">{money(c.invoiced)}</TableCell>
                <TableCell className="text-right text-emerald-700">{money(c.paid)}</TableCell>
                <TableCell className="text-right font-bold">{money(c.invoiced - c.paid)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  // 5. Expenses Summary
  if (reportId === "expenses-summary") {
    const catMap: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || "General";
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount || 0);
    });
    const totalExp = Object.values(catMap).reduce((a, b) => a + b, 0);
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
          <span className="font-medium">Total Business Expenses</span>
          <span className="text-2xl font-bold text-red-600">{money(totalExp)}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Category</TableHead>
              <TableHead className="text-right">Share (%)</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(catMap).map(([cat, amt]) => (
              <TableRow key={cat}>
                <TableCell className="font-medium">{cat}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {totalExp > 0 ? ((amt / totalExp) * 100).toFixed(1) + "%" : "0%"}
                </TableCell>
                <TableCell className="text-right font-semibold">{money(amt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 6. Purchase Summary & Outstanding Bills
  if (reportId === "purchase-summary" || reportId === "outstanding-bills") {
    const allPurchases = [...bills, ...purchaseOrders];
    const displayList = reportId === "outstanding-bills" 
      ? allPurchases.filter((p: any) => p.status !== "PAID")
      : allPurchases;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order / Bill #</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayList.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No purchases found</TableCell></TableRow>
          ) : (
            displayList.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.number || p.reference || "PO"}</TableCell>
                <TableCell>{p.vendor_name || p.vendor_id_name || "Vendor"}</TableCell>
                <TableCell className="text-xs">{p.bill_date || p.order_date || p.date || p.created_at?.slice(0, 10)}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded font-medium bg-muted">{p.status}</span></TableCell>
                <TableCell className="text-right font-semibold">{money(p.total_amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  // 7. Vendor Summary
  if (reportId === "vendor-summary") {
    const vMap: Record<string, { name: string; billed: number; paid: number }> = {};
    [...bills, ...purchaseOrders].forEach((p: any) => {
      const v = p.vendor_name || p.vendor_id_name || "Vendor";
      if (!vMap[v]) vMap[v] = { name: v, billed: 0, paid: 0 };
      vMap[v].billed += Number(p.total_amount || 0);
      if (p.status === "PAID") vMap[v].paid += Number(p.total_amount || 0);
    });
    const summary = Object.values(vMap);
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor Name</TableHead>
            <TableHead className="text-right">Total Purchases</TableHead>
            <TableHead className="text-right">Total Paid</TableHead>
            <TableHead className="text-right">Outstanding Payable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No vendor transactions</TableCell></TableRow>
          ) : (
            summary.map((v: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="text-right">{money(v.billed)}</TableCell>
                <TableCell className="text-right text-emerald-700">{money(v.paid)}</TableCell>
                <TableCell className="text-right font-bold">{money(v.billed - v.paid)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  // 8. Product Wise Stock, Low Stock & Inventory Valuation
  if (reportId === "product-stock" || reportId === "low-stock" || reportId === "inventory-valuation" || reportId === "warehouse-stock") {
    const list = reportId === "low-stock" 
      ? products.filter((p: any) => Number(p.stock || p.quantity || 0) <= Number(p.reorder_level || 5))
      : products;
    const totalValuation = products.reduce((s: number, p: any) => s + (Number(p.stock || 0) * Number(p.cost_price || p.purchase_price || 0)), 0);

    return (
      <div className="space-y-4">
        {reportId === "inventory-valuation" && (
          <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
            <span className="font-medium">Total Stock Asset Valuation</span>
            <span className="text-2xl font-bold text-emerald-700">{money(totalValuation)}</span>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU / Code</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Stock on Hand</TableHead>
              <TableHead className="text-right">Valuation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No inventory items found</TableCell></TableRow>
            ) : (
              list.map((p: any) => {
                const stock = Number(p.stock || p.quantity || 0);
                const cost = Number(p.cost_price || p.purchase_price || 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku || p.code || "—"}</TableCell>
                    <TableCell className="text-right">{money(cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{stock}</TableCell>
                    <TableCell className="text-right font-bold">{money(stock * cost)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 9. Payment Advice & Payroll Breakup
  if (reportId === "payment-advice" || reportId === "payroll-breakup") {
    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Bank / Account #</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">Allowances</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Payable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No employees found. Add employees in the Employees module.</TableCell></TableRow>
            ) : (
              employees.map((e: any) => {
                const basic = Number(e.basic_salary || 0);
                const allow = Number(e.allowances || 0);
                const ded = Number(e.deductions || 0);
                const net = Math.max(0, basic + allow - ded);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.first_name} {e.last_name || e.name}</TableCell>
                    <TableCell>{e.department || "General"}</TableCell>
                    <TableCell className="text-xs font-mono">{e.bank_name || "Bank"} · {e.account_number || "—"}</TableCell>
                    <TableCell className="text-right">{money(basic)}</TableCell>
                    <TableCell className="text-right text-emerald-700">+{money(allow)}</TableCell>
                    <TableCell className="text-right text-red-600">-{money(ded)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">{money(net)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 10. Cash Book
  if (reportId === "cash-book") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description / Ref</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Cash In (₦)</TableHead>
            <TableHead className="text-right">Cash Out (₦)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No transactions found</TableCell></TableRow>
          ) : (
            transactions.map((t: any) => {
              const isIn = t.direction === "inflow";
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.occurred_on?.slice(0, 10)}</TableCell>
                  <TableCell className="text-sm">{t.note || t.counterparty || "Transaction"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.category}</TableCell>
                  <TableCell className="text-right text-emerald-700 font-semibold">{isIn ? money(t.amount) : ""}</TableCell>
                  <TableCell className="text-right text-red-600 font-semibold">{!isIn ? money(t.amount) : ""}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  }

  return <div>Report view not configured</div>;
}

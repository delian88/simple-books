import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listInvoices } from "@/lib/ar.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/sales/invoices")({
  component: InvoicesPage,
});

function getStatusColor(status: string) {
  switch (status) {
    case "DRAFT": return "bg-gray-100 text-gray-800";
    case "SENT": return "bg-blue-100 text-blue-800";
    case "PARTIAL": return "bg-yellow-100 text-yellow-800";
    case "PAID": return "bg-green-100 text-green-800";
    case "OVERDUE": return "bg-red-100 text-red-800";
    case "CANCELLED": return "bg-gray-200 text-gray-600";
    default: return "bg-gray-100 text-gray-800";
  }
}

function InvoicesPage() {
  const getInvoices = useServerFn(listInvoices);
  const [search, setSearch] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["salesInvoices"],
    queryFn: () => getInvoices(),
  });

  const filteredInvoices = (invoices as any[]).filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Sales Invoices</h1>
          <p className="text-gray-500 mt-1">Manage and track your customer invoices</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search invoices..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-500">Loading invoices...</TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  No invoices found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              (filteredInvoices as any[]).map((inv) => (
                <TableRow key={inv.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-[#0B3D2B]">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.customer.name}</TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-semibold ${getStatusColor(inv.status)} border-0`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.customer.currency }).format(inv.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/sales/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

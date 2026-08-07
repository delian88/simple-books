import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/ar.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Search, User, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const getCustomers = useServerFn(listCustomers);
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(),
  });

  const filteredCustomers = (customers as any[]).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your clients and their outstanding balances</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90">
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">Loading customers...</TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  No customers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              (filteredCustomers as any[]).map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#0B3D2B]/10 flex items-center justify-center text-[#0B3D2B]">
                        <User className="h-5 w-5" />
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 space-y-1">
                      {customer.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {customer.email}</div>}
                      {customer.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {customer.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                      {customer.currency}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="sm">View Details</Button>
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

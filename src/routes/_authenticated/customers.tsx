import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCustomers, createCustomer } from "@/lib/ar.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Search, User, Mail, Phone, MapPin, X, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

const CURRENCIES = [
  { value: "NGN", label: "₦ Nigerian Naira (NGN)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "GBP", label: "£ British Pound (GBP)" },
  { value: "EUR", label: "€ Euro (EUR)" },
  { value: "GHS", label: "GH₵ Ghanaian Cedi (GHS)" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function NewCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const doCreate = useServerFn(createCustomer);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("NGN");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Customer name is required");
      await doCreate({
        data: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          currency,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully!");
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create customer");
    },
  });

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCurrency("NGN");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">New Customer</DialogTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Preview Avatar */}
          <div className="flex items-center gap-3 pb-2">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-base font-bold ${name ? getAvatarColor(name) : "bg-gray-100 text-gray-400"}`}>
              {name ? getInitials(name) : <User className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{name || "Customer Name"}</p>
              <p className="text-xs text-gray-400">{email || "email@example.com"}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Full Name / Company Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Acme Nigeria Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="contact@acme.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Billing Address</Label>
            <Textarea
              placeholder="Street, City, State, Country"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 gap-2"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Plus className="h-4 w-4" /> Add Customer</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailModal({ customer, onClose }: { customer: any; onClose: () => void }) {
  if (!customer) return null;
  return (
    <Dialog open={!!customer} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900">Customer Details</DialogTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${getAvatarColor(customer.name)}`}>
              {getInitials(customer.name)}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{customer.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 mt-1">
                {customer.currency}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-3 text-sm">
            {customer.email && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-gray-800">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="text-gray-800">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Billing Address</p>
                  <p className="text-gray-800">{customer.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomersPage() {
  const getCustomers = useServerFn(listCustomers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(),
  });

  const filtered = (customers as any[]).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <AppShell
      title="Customers"
      subtitle="Manage your clients and their outstanding balances"
      actions={
        <Button onClick={() => setModalOpen(true)} className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 shadow-sm gap-2">
          <Plus className="h-4 w-4" /> New Customer
        </Button>
      }
    >
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(customers as any[]).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">active accounts</p>
        </Card>
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">With Email</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {(customers as any[]).filter((c: any) => c.email).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">can receive invoices</p>
        </Card>
        <Card className="p-5 border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currencies</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {new Set((customers as any[]).map((c: any) => c.currency)).size}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">in use</p>
        </Card>
      </div>

      {/* Search + Table */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-600">Customer</TableHead>
              <TableHead className="font-semibold text-gray-600">Contact</TableHead>
              <TableHead className="font-semibold text-gray-600">Address</TableHead>
              <TableHead className="font-semibold text-gray-600">Currency</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading customers…</p>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <AlertTriangle className="h-6 w-6 text-red-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Failed to load customers. Please refresh.</p>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <Users className="h-8 w-8 mx-auto text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No customers yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click "New Customer" to add your first client</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer: any) => (
                <TableRow key={customer.id} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(customer.name)}`}>
                        {getInitials(customer.name)}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-gray-500">
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {!customer.email && !customer.phone && <span className="text-gray-300">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.address ? (
                      <div className="flex items-start gap-1.5 text-xs text-gray-500 max-w-[180px]">
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      {customer.currency}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-[#0B3D2B] hover:text-[#0B3D2B] hover:bg-[#0B3D2B]/10"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <NewCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </div>
    </AppShell>
  );
}

"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, Building2, Plus, Loader2 } from "lucide-react";
import { listPaymentMethods, addPaymentMethod } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodType, setNewMethodType] = useState("CASH");
  const queryClient = useQueryClient();

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await listPaymentMethods();
      return Array.isArray(res) ? res : [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newMethodName) throw new Error("Name is required");
      return await addPaymentMethod({ name: newMethodName, type: newMethodType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setIsAddModalOpen(false);
      setNewMethodName("");
      setNewMethodType("CASH");
      toast.success("Payment method added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add payment method");
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CASH': return <Wallet className="h-5 w-5" />;
      case 'BANK': return <Building2 className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <AppShell 
      title="Payment Methods" 
      subtitle="Manage accepted payment methods and gateways."
      actions={
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Method Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. PayPal, Cash App, Branch A Cash"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  disabled={addMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Method Type</Label>
                <Select value={newMethodType} onValueChange={setNewMethodType} disabled={addMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                    <SelectItem value="WALLET">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={addMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending || !newMethodName}>
                  {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Method
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : methods.length === 0 ? (
          <Card className="shadow-sm border-border w-full">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                    <CreditCard className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display">No Payment Methods</h3>
                <p className="mt-2 text-muted-foreground max-w-[300px]">You haven't configured any payment methods yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method: any) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {getIcon(method.type)}
                          </div>
                          <span className="font-medium">{method.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {method.type.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

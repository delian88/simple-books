"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { listCustomers, createSalesInvoice } from "@/lib/ar.functions";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  
  const [lines, setLines] = useState([
    { description: "", quantity: 1, unit_price: 0, amount: 0, tax_rate: 0 }
  ]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await listCustomers();
      return Array.isArray(res) ? res : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      router.push("/sales/invoices");
    },
    onError: () => {
      toast.error("Failed to create invoice");
    }
  });

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto-calculate amount
    if (field === "quantity" || field === "unit_price") {
      newLines[index].amount = newLines[index].quantity * newLines[index].unit_price;
    }
    
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { description: "", quantity: 1, unit_price: 0, amount: 0, tax_rate: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (lines.some(l => !l.description)) {
      toast.error("Please provide a description for all line items");
      return;
    }

    createMutation.mutate({
      data: {
        customer_id: customerId,
        issue_date: issueDate,
        due_date: dueDate,
        lines: lines
      }
    });
  };

  const total = lines.reduce((sum, line) => sum + (line.amount || 0) * (1 + (line.tax_rate || 0) / 100), 0);

  return (
    <AppShell
      title="Create Invoice"
      subtitle="Create a new sales invoice for a customer."
      actions={
        <Link href="/sales/invoices">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Button>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 max-w-4xl">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input 
                    id="issue_date" 
                    type="date" 
                    value={issueDate} 
                    onChange={e => setIssueDate(e.target.value)} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input 
                    id="due_date" 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div key={index} className="flex gap-4 items-start border p-4 rounded-md">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          placeholder="Item description" 
                          value={line.description} 
                          onChange={e => updateLine(index, "description", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            step="any"
                            value={line.quantity} 
                            onChange={e => updateLine(index, "quantity", parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            step="any"
                            value={line.unit_price} 
                            onChange={e => updateLine(index, "unit_price", parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tax Rate (%)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="any"
                            value={line.tax_rate} 
                            onChange={e => updateLine(index, "tax_rate", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input 
                            type="number" 
                            value={line.amount} 
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="mt-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <div className="text-xl font-bold">
                Total: {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(total)}
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white min-w-32">
                {createMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}

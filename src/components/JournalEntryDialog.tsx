"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJournalEntry } from "@/lib/ledger.functions";
import { listAccounts } from "@/lib/accounting.functions";
import { useNotifications } from "@/contexts/NotificationContext";

export function JournalEntryDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ]);

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await listAccounts();
      return Array.isArray(res) ? res : [];
    }
  });

  const mutation = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      addNotification({
        title: "Journal Entry Created",
        body: "Your journal entry has been recorded successfully.",
        type: "success",
      });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      addNotification({
        title: "Error",
        body: err.message || "Failed to create journal entry",
        type: "error",
      });
    },
  });

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setReference("");
    setDescription("");
    setLines([
      { accountId: "", debit: "", credit: "" },
      { accountId: "", debit: "", credit: "" },
    ]);
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: "", debit: "", credit: "" }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    
    // If setting debit, clear credit and vice versa
    if (field === "debit" && value !== "") {
      newLines[index].credit = "";
    } else if (field === "credit" && value !== "") {
      newLines[index].debit = "";
    }
    
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    let totalDebit = 0;
    let totalCredit = 0;
    
    const validLines = lines.filter(l => l.accountId && (l.debit || l.credit)).map(l => {
      const debit = l.debit ? parseFloat(l.debit) : 0;
      const credit = l.credit ? parseFloat(l.credit) : 0;
      totalDebit += debit;
      totalCredit += credit;
      return { accountId: l.accountId, debit, credit };
    });

    if (validLines.length < 2) {
      addNotification({ title: "Error", body: "You must have at least two lines in a journal entry.", type: "error" });
      return;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      addNotification({ title: "Error", body: `Debits (${totalDebit}) must equal Credits (${totalCredit}).`, type: "error" });
      return;
    }

    mutation.mutate({
      data: {
        date,
        reference,
        description,
        lines: validLines,
      },
    });
  };

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit ? parseFloat(l.debit) : 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit ? parseFloat(l.credit) : 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2">
          <Plus className="h-4 w-4" /> New Journal Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference #</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this entry for?"
              required
            />
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <Label>Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-8 gap-1">
                <Plus className="h-3 w-3" /> Add Line
              </Button>
            </div>
            
            <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 mb-2 font-medium text-sm px-2 text-muted-foreground">
              <div>Account</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Credit</div>
              <div></div>
            </div>
            
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center">
                  <Select value={line.accountId} onValueChange={(val) => handleLineChange(index, "accountId", val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code ? `${acc.code} - ` : ""}{acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={line.debit}
                    onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                    className="text-right"
                  />
                  
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={line.credit}
                    onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                    className="text-right"
                  />
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveLine(index)}
                    disabled={lines.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 mt-4 pt-4 border-t font-medium">
              <div className="text-right">Total:</div>
              <div className={`text-right ${Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-destructive' : ''}`}>
                {totalDebit.toFixed(2)}
              </div>
              <div className={`text-right ${Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-destructive' : ''}`}>
                {totalCredit.toFixed(2)}
              </div>
              <div></div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white"
            >
              {mutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

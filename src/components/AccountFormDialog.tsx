"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAccount } from "@/lib/accounts.functions";
import { useNotifications } from "@/contexts/NotificationContext";

export function AccountFormDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("ASSET");
  const [subType, setSubType] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const mutation = useMutation({
    mutationFn: addAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      addNotification({
        title: "Account created",
        body: `Account ${name} has been added to your chart of accounts.`,
        type: "success",
      });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      addNotification({
        title: "Error",
        body: err.message || "Failed to create account",
        type: "error",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setCode("");
    setType("ASSET");
    setSubType("");
    setOpeningBalance("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      data: {
        name,
        code,
        type,
        subType,
        openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white gap-2">
          <Plus className="h-4 w-4" /> New Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <div className="col-span-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">Asset</SelectItem>
                  <SelectItem value="LIABILITY">Liability</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subType" className="text-right">
              Sub Type
            </Label>
            <Input
              id="subType"
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Current Asset"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openingBalance" className="text-right">
              Balance
            </Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#0B3D2B] hover:bg-[#0B3D2B]/90 text-white"
            >
              {mutation.isPending ? "Creating..." : "Save Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

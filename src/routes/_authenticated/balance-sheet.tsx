import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getProfile, listBalanceItems, addBalanceItem, deleteBalanceItem } from "@/lib/accounting.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES, formatMoney } from "@/lib/accounting";

const balanceQuery = queryOptions({
  queryKey: ["balance-sheet"],
  queryFn: async () => {
    const [profile, items] = await Promise.all([getProfile(), listBalanceItems()]);
    return { profile, items };
  },
});

export const Route = createFileRoute("/_authenticated/balance-sheet")({
  head: () => ({
    meta: [
      { title: "Balance sheet — Ledgerly" },
      { name: "description", content: "Record what your business owns and owes, and see your net worth." },
      { property: "og:title", content: "Balance sheet — Ledgerly" },
      { property: "og:description", content: "Record what your business owns and owes, and see your net worth." },
    ],
  }),
  component: BalanceSheet;
});

function BalanceSheet() {
  return null;
}

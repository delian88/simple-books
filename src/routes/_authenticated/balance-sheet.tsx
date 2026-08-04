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
  component: BalanceSheet,
});

type Side = "asset" | "liability";

function BalanceSheet() {
  const { data } = useSuspenseQuery(balanceQuery);
  const queryClient = useQueryClient();
  const currency = data.profile.currency;

  const [side, setSide] = useState<Side>("asset");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]!);
  const [amount, setAmount] = useState("");
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const assets = data.items.filter((i) => i.side === "asset");
  const liabilities = data.items.filter((i) => i.side === "liability");
  const totalAssets = assets.reduce((a, i) => a + i.amount, 0);
  const totalLiabilities = liabilities.reduce((a, i) => a + i.amount, 0);

  const add = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!name.trim()) throw new Error("Give the item a name.");
      if (!Number.isFinite(value) || value < 0) throw new Error("Enter a valid amount.");
      return addBalanceItem({
        data: {
          side,
          name: name.trim(),
          category,
          amount: Math.round(value * 100) / 100,
          as_of: asOf,
        },
      });
    },
    onSuccess: () => {
      toast.success("Item added");
      setError("");
      setName("");
      setAmount("");
      queryClient.invalidateQueries();
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBalanceItem({ data: { id } }),
    onSuccess: () => {
      toast.success("Item removed");
      queryClient.invalidateQueries();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const categories = side === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  return (
    <AppShell
      title="Balance sheet"
      subtitle="What the business owns, what it owes, and what is left over."
      actions={
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Net worth</p>
          <p className="numeric text-2xl">{formatMoney(totalAssets - totalLiabilities, currency)}</p>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-display text-xl">Add an item</CardTitle>
            <CardDescription>Record an asset the business owns or a liability it owes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                add.mutate();
              }}
            >
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={side}
                  onValueChange={(value) => {
                    const next = value as Side;
                    setSide(next);
                    setCategory((next === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES)[0]!);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset (owned)</SelectItem>
                    <SelectItem value="liability">Liability (owed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  maxLength={120}
                  placeholder={side === "asset" ? "Delivery van" : "Bank loan"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="item-amount">Value</Label>
                  <Input
                    id="item-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-date">As of</Label>
                  <Input
                    id="item-date"
                    type="date"
                    value={asOf}
                    onChange={(event) => setAsOf(event.target.value)}
                    required
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={add.isPending}>
                {add.isPending ? "Saving…" : "Add to balance sheet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <SideColumn
            heading="Assets"
            tone="text-inflow"
            total={totalAssets}
            currency={currency}
            items={assets}
            onDelete={(id) => remove.mutate(id)}
          />
          <SideColumn
            heading="Liabilities"
            tone="text-outflow"
            total={totalLiabilities}
            currency={currency}
            items={liabilities}
            onDelete={(id) => remove.mutate(id)}
          />
        </div>
      </div>
    </AppShell>
  );
}

function SideColumn({
  heading,
  tone,
  total,
  currency,
  items,
  onDelete,
}: {
  heading: string;
  tone: string;
  total: number;
  currency: string;
  items: { id: string; name: string; category: string; amount: number; as_of: string }[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between font-display text-xl">
          {heading}
          <span className={`numeric text-base ${tone}`}>{formatMoney(total, currency)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="numeric text-xs text-muted-foreground">
                    {item.category} · {item.as_of}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="numeric text-sm">{formatMoney(item.amount, currency)}</span>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${item.name}`} onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

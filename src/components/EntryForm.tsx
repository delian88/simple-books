import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addTransactions } from "@/lib/accounting.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaptureSource, Direction, TxnCategory } from "@/lib/accounting";

export type EntryDraft = {
  category: TxnCategory;
  amount: string;
  occurred_on: string;
  counterparty: string;
  note: string;
  source: CaptureSource;
};

export function emptyDraft(category: TxnCategory): EntryDraft {
  return {
    category,
    amount: "",
    occurred_on: new Date().toISOString().slice(0, 10),
    counterparty: "",
    note: "",
    source: "manual",
  };
}

export function EntryForm({
  title,
  description,
  direction,
  categories,
  draft,
  onDraftChange,
}: {
  title: string;
  description: string;
  direction: Direction;
  categories: { value: TxnCategory; label: string; hint: string }[];
  draft: EntryDraft;
  onDraftChange: (draft: EntryDraft) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const hint = categories.find((c) => c.value === draft.category)?.hint ?? "";

  const save = useMutation({
    mutationFn: async () => {
      const amount = Number(draft.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
      return addTransactions({
        data: {
          rows: [
            {
              direction,
              category: draft.category,
              amount: Math.round(amount * 100) / 100,
              occurred_on: draft.occurred_on,
              counterparty: draft.counterparty.trim() || null,
              note: draft.note.trim() || null,
              source: draft.source,
            },
          ],
        },
      });
    },
    onSuccess: () => {
      toast.success("Entry recorded");
      setError("");
      onDraftChange(emptyDraft(draft.category));
      queryClient.invalidateQueries();
    },
    onError: (err: Error) => setError(err.message),
  });

  const set = (patch: Partial<EntryDraft>) => onDraftChange({ ...draft, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={draft.category} onValueChange={(value) => set({ category: value as TxnCategory })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0.00"
                value={draft.amount}
                onChange={(event) => set({ amount: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={draft.occurred_on}
                onChange={(event) => set({ occurred_on: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="counterparty">{direction === "inflow" ? "Received from" : "Paid to"}</Label>
            <Input
              id="counterparty"
              maxLength={120}
              placeholder={direction === "inflow" ? "Customer or source" : "Vendor or payee"}
              value={draft.counterparty}
              onChange={(event) => set({ counterparty: event.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              rows={2}
              maxLength={400}
              value={draft.note}
              onChange={(event) => set({ note: event.target.value })}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Record entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

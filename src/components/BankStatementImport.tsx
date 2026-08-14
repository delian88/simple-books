import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { addTransactions } from "@/lib/accounting.functions";
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
import { INFLOW_CATEGORIES, formatMoney, type TxnCategory } from "@/lib/accounting";

type Draft = {
  date: string;
  description: string;
  amount: number;
  category: TxnCategory;
  include: boolean;
};

function splitLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if ((ch === "," || ch === ";" || ch === "\t") && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function normalizeDate(value: string): string {
  const iso = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]!;
    return `${year}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function guessCategory(description: string): TxnCategory {
  const text = description.toLowerCase();
  if (/(loan|facility|overdraft|credit line)/.test(text)) return "loan";
  if (/(capital|owner|equity|investment|share)/.test(text)) return "capital";
  if (/(invoice|debtor|receivab|settle|outstanding)/.test(text)) return "debtor_payment";
  return "sales";
}

function parseStatement(text: string): Draft[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitLine(lines[0]!).map((h) => h.toLowerCase());
  const looksLikeHeader = header.some((h) => /date|desc|narrat|amount|credit|deposit/.test(h));
  const body = looksLikeHeader ? lines.slice(1) : lines;

  const idx = (candidates: RegExp) => header.findIndex((h) => candidates.test(h));
  const dateIdx = looksLikeHeader ? idx(/date/) : 0;
  const descIdx = looksLikeHeader ? idx(/desc|narrat|detail|particular|reference/) : 1;
  const creditIdx = looksLikeHeader ? idx(/credit|deposit|money in|inflow/) : -1;
  const amountIdx = looksLikeHeader ? idx(/^amount|value/) : 2;

  const drafts: Draft[] = [];
  for (const line of body) {
    const cells = splitLine(line);
    const rawAmount =
      creditIdx >= 0 && cells[creditIdx] ? cells[creditIdx]! : (cells[amountIdx >= 0 ? amountIdx : cells.length - 1] ?? "");
    const amount = Number(rawAmount.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const description = (cells[descIdx >= 0 ? descIdx : 1] ?? "").slice(0, 120);
    drafts.push({
      date: normalizeDate(cells[dateIdx >= 0 ? dateIdx : 0] ?? ""),
      description,
      amount: Math.round(amount * 100) / 100,
      category: guessCategory(description),
      include: true,
    });
  }
  return drafts.slice(0, 300);
}

export function BankStatementImport({ 
  currency, 
  bankAccounts 
}: { 
  currency: string;
  bankAccounts: { value: string; label: string }[];
}) {
  const [bankAccountId, setBankAccountId] = useState(() => bankAccounts[0]?.value || "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const rows = drafts
        .filter((d) => d.include)
        .map((d) => ({
          direction: "inflow" as const,
          bankAccountId,
          category: d.category,
          amount: d.amount,
          occurred_on: d.date,
          counterparty: d.description || null,
          note: null,
          source: "bank_statement" as const,
        }));
      if (rows.length === 0) throw new Error("Select at least one line to import.");
      return addTransactions({ data: { rows } });
    },
    onSuccess: (result) => {
      toast.success(`Imported ${result.inserted} inflow${result.inserted === 1 ? "" : "s"}`);
      setDrafts([]);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const parsed = parseStatement(text);
    if (parsed.length === 0) {
      toast.error("No credit lines found. The file needs date, description and amount columns.");
      return;
    }
    setDrafts(parsed);
    toast.success(`Found ${parsed.length} credit line${parsed.length === 1 ? "" : "s"} — check the categories below.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <Upload className="h-5 w-5 text-accent" />
          Import from bank statement
        </CardTitle>
        <CardDescription>
          Upload a CSV export of your bank statement. Every credit line becomes an inflow — confirm the category for each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Bank Account</Label>
          <Select value={bankAccountId} onValueChange={setBankAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="statement">Statement file (.csv)</Label>
          <Input
            id="statement"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </div>

        {drafts.length > 0 ? (
          <div className="space-y-3">
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border border-border p-2">
              {drafts.map((draft, index) => (
                <div
                  key={`${draft.date}-${index}`}
                  className="grid items-center gap-2 rounded-md bg-secondary/60 p-2 sm:grid-cols-[auto_1fr_9rem_11rem]"
                >
                  <input
                    type="checkbox"
                    aria-label={`Include ${draft.description}`}
                    checked={draft.include}
                    onChange={(event) =>
                      setDrafts((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, include: event.target.checked } : d)),
                      )
                    }
                    className="h-4 w-4 accent-current"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{draft.description || "Unlabelled credit"}</p>
                    <p className="numeric text-xs text-muted-foreground">{draft.date}</p>
                  </div>
                  <span className="numeric text-sm text-inflow sm:text-right">
                    {formatMoney(draft.amount, currency)}
                  </span>
                  <Select
                    value={draft.category}
                    onValueChange={(value) =>
                      setDrafts((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, category: value as TxnCategory } : d)),
                      )
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INFLOW_CATEGORIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Importing…" : `Import ${drafts.filter((d) => d.include).length} line(s)`}
              </Button>
              <Button variant="outline" onClick={() => setDrafts([])}>
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

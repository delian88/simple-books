import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/accounting.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABEL, formatMoney, type TxnCategory } from "@/lib/accounting";

export type TxnRow = {
  id: string;
  direction: string;
  category: string;
  amount: number;
  occurred_on: string;
  counterparty: string | null;
  note: string | null;
  source: string;
};

const SOURCE_LABEL: Record<string, string> = {
  manual: "Typed in",
  bank_statement: "Bank statement",
  receipt_scan: "Receipt scan",
};

export function TransactionsTable({ rows, currency }: { rows: TxnRow[]; currency: string }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteTransaction({ data: { id } }),
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No entries recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Captured</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="numeric text-xs">{row.occurred_on}</TableCell>
              <TableCell className="max-w-[16rem]">
                <span className="block truncate">{row.counterparty || "—"}</span>
                {row.note ? <span className="block truncate text-xs text-muted-foreground">{row.note}</span> : null}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {CATEGORY_LABEL[row.category as TxnCategory]}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{SOURCE_LABEL[row.source] ?? row.source}</TableCell>
              <TableCell
                className={`numeric text-right ${row.direction === "inflow" ? "text-inflow" : "text-outflow"}`}
              >
                {formatMoney(row.amount, currency)}
              </TableCell>
              <TableCell className="w-10">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete entry"
                  onClick={() => remove.mutate(row.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

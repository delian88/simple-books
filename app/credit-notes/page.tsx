"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { applyCreditNote, money } from "@/lib/modules.functions";
import { toast } from "sonner";

function ApplyBtn({ row, refresh }: { row: any; refresh: () => void }) {
  const m = useMutation({
    mutationFn: () => applyCreditNote(row.id),
    onSuccess: (r: any) => {
      refresh();
      toast.success(`Applied! Updated invoice total: ${money(r.new_total)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (row.status === "APPLIED") return null;
  return (
    <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>
      Apply to invoice
    </Button>
  );
}

export default function CreditNotesPage() {
  return (
    <ResourcePage
      title="Credit & Debit Notes"
      subtitle="Issue credit or debit adjustments against sales invoices."
      type="credit_note"
      noun="Note"
      numberPrefix="CN"
      fields={[
        { key: "kind", label: "Type", type: "select", options: ["CREDIT", "DEBIT"], default: "CREDIT", required: true },
        { key: "invoice_id", label: "Linked invoice", optionsFrom: "invoices", required: true },
        { key: "date", label: "Date", type: "date" },
        { key: "amount", label: "Amount", type: "number", required: true },
        { key: "reason", label: "Reason", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Note #" },
        { key: "kind", label: "Type" },
        { key: "invoice_id_name", label: "Invoice" },
        { key: "date", label: "Date", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "amount", label: "Amount", kind: "money", right: true },
      ]}
      rowActions={(row, refresh) => <ApplyBtn row={row} refresh={refresh} />}
    />
  );
}

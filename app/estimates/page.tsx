"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { convertEstimate } from "@/lib/modules.functions";

function ConvertButton({ row, refresh }: { row: any; refresh: () => void }) {
  const m = useMutation({
    mutationFn: () => convertEstimate(row.id),
    onSuccess: (r: any) => {
      refresh();
      alert(`Converted to invoice ${r.invoice_number}`);
    },
    onError: (e: Error) => alert(e.message),
  });
  if (row.status === "CONVERTED") return null;
  return (
    <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>
      Convert to invoice
    </Button>
  );
}

export default function EstimatesPage() {
  return (
    <ResourcePage
      title="Estimates & Quotes"
      subtitle="Win the work, then convert accepted quotes into invoices in one click."
      type="estimate"
      noun="Estimate"
      numberPrefix="QT"
      lines
      fields={[
        { key: "customer_id", label: "Customer", optionsFrom: "customers", required: true },
        { key: "issue_date", label: "Issue date", type: "date" },
        { key: "valid_until", label: "Valid until", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "CONVERTED"], default: "DRAFT" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Quote #" },
        { key: "customer_id_name", label: "Customer" },
        { key: "valid_until", label: "Valid until", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "total_amount", label: "Total", kind: "money", right: true },
      ]}
      rowActions={(row, refresh) => <ConvertButton row={row} refresh={refresh} />}
    />
  );
}

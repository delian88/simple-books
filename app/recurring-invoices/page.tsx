"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { runRecurring } from "@/lib/modules.functions";
import { toast } from "sonner";
import { Play } from "lucide-react";

function RunButton({ refresh }: { refresh: () => void }) {
  const m = useMutation({
    mutationFn: runRecurring,
    onSuccess: (r: any) => {
      refresh();
      toast.success(r.created > 0 ? `Generated ${r.created} invoice(s): ${(r.invoices || []).join(", ")}` : "No recurring schedules due today.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button variant="outline" disabled={m.isPending} onClick={() => m.mutate()} className="gap-2">
      <Play className="h-4 w-4" /> {m.isPending ? "Running..." : "Run Due Invoices"}
    </Button>
  );
}

export default function RecurringInvoicesPage() {
  return (
    <ResourcePage
      title="Recurring Invoices"
      subtitle="Automate retainer and subscription billing schedules."
      type="recurring"
      noun="Recurring Schedule"
      numberPrefix="REC"
      lines
      headerActions={(refresh) => <RunButton refresh={refresh} />}
      fields={[
        { key: "customer_id", label: "Customer", optionsFrom: "customers", required: true },
        { key: "frequency", label: "Frequency", type: "select", options: ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"], default: "MONTHLY", required: true },
        { key: "next_date", label: "Next invoice date", type: "date", required: true },
        { key: "end_date", label: "End date (optional)", type: "date" },
        { key: "due_days", label: "Payment terms (days)", type: "number", default: 14 },
        { key: "status", label: "Status", type: "select", options: ["ACTIVE", "PAUSED", "ENDED"], default: "ACTIVE" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Schedule #" },
        { key: "customer_id_name", label: "Customer" },
        { key: "frequency", label: "Frequency" },
        { key: "next_date", label: "Next run", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "total_amount", label: "Amount", kind: "money", right: true },
      ]}
    />
  );
}

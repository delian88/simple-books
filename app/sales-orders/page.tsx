"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { convertSalesOrder } from "@/lib/modules.functions";

function ConvertOrderButton({ row, refresh }: { row: any; refresh: () => void }) {
  const m = useMutation({
    mutationFn: () => convertSalesOrder(row.id),
    onSuccess: (r: any) => {
      refresh();
      alert(`Converted to invoice ${r.invoice_number}`);
    },
    onError: (e: Error) => alert(e.message),
  });
  if (row.status === "INVOICED") return null;
  return (
    <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>
      Convert to invoice
    </Button>
  );
}

export default function SalesOrdersPage() {
  return (
    <ResourcePage
      title="Sales Orders"
      subtitle="Confirm client orders, track delivery schedules, and generate invoices with 1 click."
      type="sales_order"
      noun="Sales Order"
      numberPrefix="SO"
      lines
      fields={[
        { key: "customer_id", label: "Customer", optionsFrom: "customers", required: true },
        { key: "order_date", label: "Order Date", type: "date" },
        { key: "delivery_date", label: "Expected Delivery Date", type: "date" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["DRAFT", "CONFIRMED", "PROCESSING", "DELIVERED", "INVOICED"],
          default: "CONFIRMED",
        },
        { key: "notes", label: "Delivery Notes & Instructions", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Order #" },
        { key: "customer_id_name", label: "Customer" },
        { key: "delivery_date", label: "Delivery Date", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "total_amount", label: "Total", kind: "money", right: true },
      ]}
      rowActions={(row, refresh) => <ConvertOrderButton row={row} refresh={refresh} />}
    />
  );
}

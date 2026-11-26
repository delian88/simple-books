"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { saveRecord } from "@/lib/modules.functions";

export default function PurchaseOrdersPage() {
  return (
    <ResourcePage
      title="Purchase Orders & Bills"
      subtitle="Issue purchase orders to vendors and turn them into bills."
      type="purchase_order"
      noun="Purchase Order"
      numberPrefix="PO"
      lines
      fields={[
        { key: "vendor_id", label: "Vendor", optionsFrom: "vendor", required: true },
        { key: "order_date", label: "Order date", type: "date" },
        { key: "due_date", label: "Due date", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["DRAFT", "ORDERED", "RECEIVED", "BILLED", "PAID"], default: "DRAFT" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "PO #" },
        { key: "vendor_id_name", label: "Vendor" },
        { key: "due_date", label: "Due", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "total_amount", label: "Total", kind: "money", right: true },
      ]}
      rowActions={(row, refresh) =>
        row.status !== "BILLED" && row.status !== "PAID" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { id, created_at, created_by, ...data } = row;
              await saveRecord("purchase_order", { ...data, status: "BILLED" }, id);
              refresh();
            }}
          >
            Convert to bill
          </Button>
        ) : null
      }
    />
  );
}

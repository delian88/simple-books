"use client";
import Link from "next/link";
import { ResourcePage } from "@/components/ResourcePage";
import { Button } from "@/components/ui/button";
import { saveRecord } from "@/lib/modules.functions";
import { toast } from "sonner";
import { Boxes } from "lucide-react";

export default function PurchaseOrdersPage() {
  return (
    <ResourcePage
      title="Purchase Orders & Bills"
      subtitle="Issue purchase orders to vendors and turn them into bills."
      type="purchase_order"
      noun="Purchase Order"
      numberPrefix="PO"
      lines
      headerActions={() => (
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
          <Link href="/stock-purchases">
            <Boxes className="h-3.5 w-3.5" />
            <span>View All Stock Purchases & Bills</span>
          </Link>
        </Button>
      )}
      fields={[
        { key: "vendor_id", label: "Vendor", optionsFrom: "vendors", required: true },
        { key: "order_date", label: "Order date", type: "date", default: () => new Date().toISOString().slice(0, 10) },
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
              try {
                const { id, created_at, created_by, ...data } = row;
                await saveRecord("purchase_order", { ...data, status: "BILLED" }, id);
                await saveRecord("stock_purchase", {
                  ...data,
                  number: `BILL-${data.number || id.slice(0, 6)}`,
                  bill_date: new Date().toISOString().slice(0, 10),
                  due_date: data.due_date || "",
                  status: "BILLED",
                  reference: `From PO ${data.number || id}`,
                  po_id: id,
                });
                toast.success("Converted to Stock Purchase Bill successfully!");
                refresh();
              } catch (e: any) {
                toast.error(e.message || "Failed to convert purchase order");
              }
            }}
          >
            Convert to bill
          </Button>
        ) : null
      }
    />
  );
}

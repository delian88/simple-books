"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function StockPurchasesPage() {
  return (
    <ResourcePage
      title="Stock Purchases"
      subtitle="Record inventory purchases from vendors with automatic stock updates."
      type="stock_purchase"
      noun="Stock Purchase Bill"
      numberPrefix="BILL"
      lines
      fields={[
        { key: "vendor_id", label: "Vendor", optionsFrom: "vendors", required: true },
        { key: "warehouse_id", label: "Destination Warehouse", optionsFrom: "warehouses" },
        { key: "bill_date", label: "Bill Date", type: "date", required: true },
        { key: "due_date", label: "Due Date", type: "date" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["RECEIVED", "BILLED", "PAID"],
          default: "RECEIVED",
        },
        { key: "reference", label: "Vendor Invoice Reference" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Bill #" },
        { key: "vendor_id_name", label: "Vendor" },
        { key: "bill_date", label: "Date", kind: "date" },
        { key: "due_date", label: "Due Date", kind: "date" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "total_amount", label: "Amount", kind: "money", right: true },
      ]}
    />
  );
}

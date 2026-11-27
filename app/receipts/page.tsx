"use client";
import { ResourcePage } from "@/components/ResourcePage";
import { recordReceipt } from "@/lib/modules.functions";

export default function ReceiptsPage() {
  return (
    <ResourcePage
      title="Customer Receipts"
      subtitle="Record and track customer payments received against invoices."
      type="receipt"
      noun="Receipt"
      numberPrefix="RCP"
      fields={[
        { key: "invoice_id", label: "Invoice (Optional)", optionsFrom: "invoices" },
        { key: "customer_id", label: "Customer", optionsFrom: "customers", required: true },
        { key: "date", label: "Payment Date", type: "date", required: true },
        { key: "amount", label: "Amount Received (₦)", type: "number", required: true },
        {
          key: "payment_method",
          label: "Payment Method",
          type: "select",
          options: ["BANK_TRANSFER", "CASH", "CARD", "POS", "CHEQUE"],
          default: "BANK_TRANSFER",
        },
        { key: "reference", label: "Bank Reference / Transaction ID" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Receipt #" },
        { key: "customer_id_name", label: "Customer" },
        { key: "date", label: "Date", kind: "date" },
        { key: "payment_method", label: "Method" },
        { key: "amount", label: "Amount", kind: "money", right: true },
        { key: "status", label: "Status", kind: "badge" },
      ]}
    />
  );
}

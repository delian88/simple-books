"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function VendorPaymentsPage() {
  return (
    <ResourcePage
      title="Vendor Payments"
      subtitle="Track disbursements, settlement of purchase bills, and vendor balances."
      type="vendor_payment"
      noun="Vendor Payment"
      numberPrefix="VPAY"
      fields={[
        { key: "vendor_id", label: "Vendor", optionsFrom: "vendors", required: true },
        { key: "purchase_order_id", label: "Purchase Order / Bill (Optional)", optionsFrom: "purchase_orders" },
        { key: "date", label: "Payment Date", type: "date", required: true },
        { key: "amount", label: "Amount Paid (₦)", type: "number", required: true },
        {
          key: "payment_method",
          label: "Payment Method",
          type: "select",
          options: ["BANK_TRANSFER", "CASH", "CHEQUE", "CARD"],
          default: "BANK_TRANSFER",
        },
        { key: "reference", label: "Transaction Reference / Cheque #" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Payment #" },
        { key: "vendor_id_name", label: "Vendor" },
        { key: "date", label: "Date", kind: "date" },
        { key: "payment_method", label: "Method" },
        { key: "amount", label: "Amount", kind: "money", right: true },
        { key: "status", label: "Status", kind: "badge" },
      ]}
    />
  );
}

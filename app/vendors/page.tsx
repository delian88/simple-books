"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function VendorsPage() {
  return (
    <ResourcePage
      title="Vendors"
      subtitle="Manage suppliers, balances and advances."
      type="vendor"
      noun="Vendor"
      fields={[
        { key: "name", label: "Vendor name", required: true },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "tax_id", label: "Tax ID / GSTIN" },
        { key: "advance_paid", label: "Advance paid", type: "number" },
        { key: "address", label: "Address", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "tax_id", label: "Tax ID" },
        { key: "advance_paid", label: "Advance", kind: "money", right: true },
      ]}
    />
  );
}

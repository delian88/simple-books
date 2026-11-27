"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function TaxesPage() {
  return (
    <ResourcePage
      title="Taxes & Rates"
      subtitle="Configure standard VAT rates, withholding taxes, and tax exemption codes."
      type="tax_rate"
      noun="Tax Rate"
      fields={[
        { key: "name", label: "Tax Name (e.g. Standard VAT, WHT)", required: true },
        { key: "rate", label: "Rate Percentage (%)", type: "number", required: true },
        {
          key: "type",
          label: "Tax Type",
          type: "select",
          options: ["VAT (Value Added Tax)", "WHT (Withholding Tax)", "Zero Rated", "Exempt"],
          default: "VAT (Value Added Tax)",
        },
        { key: "code", label: "Tax Code (e.g. VAT-7.5)" },
        { key: "description", label: "Description / Legal Reference", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Tax Name" },
        { key: "code", label: "Code" },
        { key: "type", label: "Type" },
        { key: "rate", label: "Rate (%)", render: (r) => `${r.rate}%` },
      ]}
    />
  );
}

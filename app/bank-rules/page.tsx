"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function BankRulesPage() {
  return (
    <ResourcePage
      title="Bank Rules"
      subtitle="Tell it once how to categorise a recurring bank transaction."
      type="bank_rule"
      noun="Rule"
      fields={[
        { key: "name", label: "Rule name", required: true },
        { key: "contains", label: "When narration contains", required: true },
        { key: "category", label: "Categorise as", required: true },
        { key: "direction", label: "Direction", type: "select", options: ["outflow", "inflow"], default: "outflow" },
        { key: "tax_rate", label: "Tax rate %", type: "number" },
      ]}
      columns={[
        { key: "name", label: "Rule" },
        { key: "contains", label: "Narration contains" },
        { key: "category", label: "Category" },
        { key: "direction", label: "Direction", kind: "badge" },
        { key: "tax_rate", label: "Tax %", right: true },
      ]}
    />
  );
}

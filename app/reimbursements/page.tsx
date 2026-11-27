"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function ReimbursementsPage() {
  return (
    <ResourcePage
      title="Staff Reimbursements"
      subtitle="Track out-of-pocket expenses incurred by team members awaiting repayment."
      type="reimbursement"
      noun="Reimbursement Claim"
      numberPrefix="RMB"
      fields={[
        { key: "employee_id", label: "Employee / Claimant", optionsFrom: "employees", required: true },
        { key: "date", label: "Claim Date", type: "date", required: true },
        { key: "category", label: "Expense Category", type: "select", options: ["Travel & Fuel", "Meals & Entertainment", "Office Supplies", "Client Meeting", "Internet & Telecom", "Other"] },
        { key: "amount", label: "Amount (₦)", type: "number", required: true },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PENDING", "APPROVED", "REIMBURSED", "REJECTED"],
          default: "PENDING",
        },
        { key: "description", label: "Purpose / Description", type: "textarea", required: true },
      ]}
      columns={[
        { key: "number", label: "Claim #" },
        { key: "employee_id_name", label: "Employee" },
        { key: "date", label: "Date", kind: "date" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "amount", label: "Amount", kind: "money", right: true },
      ]}
    />
  );
}

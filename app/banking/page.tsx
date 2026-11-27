"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function BankingPage() {
  return (
    <ResourcePage
      title="Bank Accounts"
      subtitle="Add and manage your business bank accounts just like customers and vendors."
      type="bank_account"
      noun="Bank Account"
      fields={[
        { key: "bank_name", label: "Bank Name", required: true },
        { key: "account_number", label: "Account Number", required: true },
        { key: "account_name", label: "Account Name", required: true },
        {
          key: "account_type",
          label: "Account Type",
          type: "select",
          options: ["Current Account", "Savings Account", "Corporate Checking", "Domiciliary Account", "Cash in Hand"],
          default: "Current Account",
        },
        { key: "currency", label: "Currency", type: "select", options: ["NGN", "USD", "EUR", "GBP"], default: "NGN" },
        { key: "opening_balance", label: "Opening Balance (₦)", type: "number", default: 0 },
        { key: "notes", label: "Branch / Notes", type: "textarea" },
      ]}
      columns={[
        { key: "bank_name", label: "Bank" },
        { key: "account_name", label: "Account Name" },
        { key: "account_number", label: "Account Number" },
        { key: "account_type", label: "Type" },
        { key: "currency", label: "Currency" },
        { key: "opening_balance", label: "Opening Balance", kind: "money", right: true },
      ]}
    />
  );
}

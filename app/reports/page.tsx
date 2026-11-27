"use client";
import { AppShell } from "@/components/AppShell";
import { ProfitBooksReportsHub } from "@/components/ProfitBooksReports";

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports Hub"
      subtitle="Gain complete financial and operational insights across Sales, Expenses, Banking, Inventory, and Payroll."
    >
      <ProfitBooksReportsHub />
    </AppShell>
  );
}

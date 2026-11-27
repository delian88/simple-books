"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function ProjectsPage() {
  return (
    <ResourcePage
      title="Projects"
      subtitle="Track project profitability, budgeted revenue, and project expenses."
      type="project"
      noun="Project"
      numberPrefix="PRJ"
      fields={[
        { key: "name", label: "Project Name", required: true },
        { key: "customer_id", label: "Client / Customer", optionsFrom: "customers" },
        { key: "budget", label: "Budgeted Revenue (₦)", type: "number" },
        { key: "estimated_cost", label: "Estimated Cost (₦)", type: "number" },
        { key: "start_date", label: "Start Date", type: "date" },
        { key: "end_date", label: "Target Completion Date", type: "date" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"],
          default: "IN_PROGRESS",
        },
        { key: "notes", label: "Scope & Deliverables", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Project Code" },
        { key: "name", label: "Project Name" },
        { key: "customer_id_name", label: "Client" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "budget", label: "Budget", kind: "money", right: true },
      ]}
    />
  );
}

"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function EmployeesPage() {
  return (
    <ResourcePage
      title="Employees"
      subtitle="Manage employee records, job roles, compensation details, and bank accounts."
      type="employee"
      noun="Employee"
      numberPrefix="EMP"
      fields={[
        { key: "first_name", label: "First Name", required: true },
        { key: "last_name", label: "Last Name", required: true },
        { key: "email", label: "Work Email" },
        { key: "phone", label: "Phone Number" },
        {
          key: "department",
          label: "Department",
          type: "select",
          options: ["Operations", "Sales & Marketing", "Finance & Accounts", "Engineering / IT", "Human Resources", "Logistics"],
          default: "Operations",
        },
        { key: "job_title", label: "Job Title (e.g. Accountant, Sales Lead)" },
        { key: "basic_salary", label: "Basic Monthly Salary (₦)", type: "number", required: true },
        { key: "allowances", label: "Monthly Allowances (₦)", type: "number", default: 0 },
        { key: "deductions", label: "Monthly Deductions (Tax / Pension) (₦)", type: "number", default: 0 },
        { key: "bank_name", label: "Bank Name" },
        { key: "account_number", label: "Bank Account Number" },
        { key: "join_date", label: "Date of Joining", type: "date" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: ["ACTIVE", "ON_LEAVE", "TERMINATED"],
          default: "ACTIVE",
        },
      ]}
      columns={[
        { key: "number", label: "EMP ID" },
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "department", label: "Department" },
        { key: "job_title", label: "Title" },
        { key: "status", label: "Status", kind: "badge" },
        { key: "basic_salary", label: "Basic Salary", kind: "money", right: true },
      ]}
    />
  );
}

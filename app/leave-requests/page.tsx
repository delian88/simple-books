"use client";
import { ResourcePage } from "@/components/ResourcePage";

export default function LeaveRequestsPage() {
  return (
    <ResourcePage
      title="Leave Requests"
      subtitle="Track annual vacation, sick leave, and casual leave approvals for team members."
      type="leave_request"
      noun="Leave Request"
      numberPrefix="LV"
      fields={[
        { key: "employee_id", label: "Employee", optionsFrom: "employees", required: true },
        {
          key: "leave_type",
          label: "Leave Type",
          type: "select",
          options: ["Annual Leave", "Sick Leave", "Casual Leave", "Maternity / Paternity", "Unpaid Leave"],
          default: "Annual Leave",
        },
        { key: "start_date", label: "Start Date", type: "date", required: true },
        { key: "end_date", label: "End Date", type: "date", required: true },
        { key: "days", label: "Total Days", type: "number", required: true },
        {
          key: "status",
          label: "Approval Status",
          type: "select",
          options: ["PENDING", "APPROVED", "REJECTED"],
          default: "PENDING",
        },
        { key: "reason", label: "Reason / Notes", type: "textarea" },
      ]}
      columns={[
        { key: "number", label: "Req #" },
        { key: "employee_id_name", label: "Employee" },
        { key: "leave_type", label: "Type" },
        { key: "start_date", label: "Start", kind: "date" },
        { key: "end_date", label: "End", kind: "date" },
        { key: "days", label: "Days" },
        { key: "status", label: "Status", kind: "badge" },
      ]}
    />
  );
}

import { apiGet, apiPost } from "@/lib/api";

export type RecordType =
  | "estimate"
  | "vendor"
  | "purchase_order"
  | "product"
  | "warehouse"
  | "stock_move"
  | "bank_rule"
  | "bank_line"
  | "recurring"
  | "credit_note"
  | "reminder"
  | "audit";

export const listRecords = (type: RecordType) =>
  apiGet<any[]>(`/api/modules.php?action=list&type=${type}`);

export const saveRecord = (type: RecordType, data: any, id?: string) =>
  apiPost("/api/modules.php?action=save", { type, data, id });

export const deleteRecord = (type: RecordType, id: string) =>
  apiPost("/api/modules.php?action=delete", { type, id });

export const convertEstimate = (id: string) =>
  apiPost("/api/modules.php?action=convertEstimate", { id });

export const runRecurring = () =>
  apiPost("/api/modules.php?action=runRecurring", {});

export const importBankLines = (lines: Array<{ date: string; narration: string; amount: number; direction: "inflow" | "outflow" }>) =>
  apiPost("/api/modules.php?action=importBankLines", { lines });

export const confirmLine = (id: string, category?: string) =>
  apiPost("/api/modules.php?action=confirmLine", { id, category });

export const applyCreditNote = (id: string) =>
  apiPost("/api/modules.php?action=applyCreditNote", { id });

export const sendReminders = () =>
  apiPost("/api/modules.php?action=sendReminders", {});

export const portalLink = (customerId: string) =>
  apiPost<{ token: string }>("/api/modules.php?action=portalLink", { customerId });

export async function getPortal(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(`${baseUrl}/api/portal.php?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Portal error: ${res.status}`);
  }
  return res.json();
}

export const listMembers = () =>
  apiGet<any[]>("/api/modules.php?action=listMembers");

export const inviteMember = (data: { email: string; role: string; password: string }) =>
  apiPost("/api/modules.php?action=inviteMember", data);

export const updateMemberRole = (id: string, role: string) =>
  apiPost("/api/modules.php?action=updateMemberRole", { id, role });

export const removeMember = (id: string) =>
  apiPost("/api/modules.php?action=removeMember", { id });

export const money = (n: any) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(n || 0));

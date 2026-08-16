import { getToken } from "@/lib/auth.functions";

/**
 * Central fetch wrapper that automatically attaches the JWT token
 * (stored in localStorage after login) to every PHP API request.
 *
 * Usage:
 *   import { apiFetch } from "@/lib/api";
 *   const data = await apiFetch('/api/accounting.php?action=listTransactions');
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

/**
 * apiFetch + auto JSON parse. Throws if response is not OK.
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T = any>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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

  // Normalize /api/ path formatting to ensure it matches Vite proxy target
  const normalizedUrl = url.startsWith('/') ? url : `/api/${url}`;
  
  // Use a base URL if provided in environment (e.g. for production connecting to a separate PHP host)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const endpoint = baseUrl ? `${baseUrl}${normalizedUrl}` : normalizedUrl;

  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 15 second timeout signal to prevent indefinite hanging
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your internet connection or server.");
    }
    throw err;
  }
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

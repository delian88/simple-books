import { apiFetch } from "@/lib/api";

const TOKEN_KEY = 'KoboBooks_token';
const LEGACY_TOKEN_KEY = 'My Kobobooks_token';

/** Save the auth token returned by PHP to localStorage */
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Get the stored auth token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

/** Remove the stored auth token (logout) */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export const login = async ({ data }: { data: { email: string; password: string } }) => {
  const res = await apiFetch('/api/auth.php?action=login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = {};
  }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`PHP server is not running on http://localhost:8000. Please start PHP server with: php -S localhost:8000 -t public`);
    }
    throw new Error(json.error || `Login failed (${res.status})`);
  }
  // Save token for subsequent API calls
  if (json.token) saveToken(json.token);
  return json;
};

export const signup = async ({ data }: { data: { email: string; password: string; businessName: string } }) => {
  const res = await apiFetch('/api/auth.php?action=signup', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Server error (${res.status}): ${text.slice(0, 100) || 'Backend API unavailable. Ensure PHP server is running on port 8000.'}`);
  }
  if (!res.ok) throw new Error(json.error || 'Failed to signup');
  // Save token for subsequent API calls
  if (json.token) saveToken(json.token);
  return json;
};

export const logout = async () => {
  clearToken();
  await apiFetch('/api/auth.php?action=logout', { method: 'POST' }).catch(() => {});
  return { ok: true };
};

export const getSession = async () => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await apiFetch('/api/auth.php?action=session');
    if (!res.ok) {
      clearToken(); // Token is invalid/expired, clean up
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
};

export const updateProfile = async ({ data }: { data: { businessName?: string; profilePicture?: string } }) => {
  const res = await apiFetch('/api/auth.php?action=updateProfile', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update profile');
  return json;
};

export const switchRole = async ({ data }: { data: { role: string } }) => {
  const res = await apiFetch('/api/auth.php?action=switchRole', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to switch role');
  return json;
};

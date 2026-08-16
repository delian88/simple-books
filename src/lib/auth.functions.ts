const TOKEN_KEY = 'ledgerly_token';

/** Save the auth token returned by PHP to localStorage */
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Get the stored auth token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove the stored auth token (logout) */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const login = async ({ data }: { data: { email: string; password: string } }) => {
  const res = await fetch('/api/auth.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to login');
  // Save token for subsequent API calls
  if (json.token) saveToken(json.token);
  return json;
};

export const signup = async ({ data }: { data: { email: string; password: string; businessName: string } }) => {
  const res = await fetch('/api/auth.php?action=signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to signup');
  // Save token for subsequent API calls
  if (json.token) saveToken(json.token);
  return json;
};

export const logout = async () => {
  clearToken();
  await fetch('/api/auth.php?action=logout', { method: 'POST' }).catch(() => {});
  return { ok: true };
};

export const getSession = async () => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth.php?action=session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      clearToken(); // Token is invalid/expired, clean up
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
};

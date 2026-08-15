export const login = async ({ data }: { data: { email: string; password: string } }) => {
  const res = await fetch('/api/auth.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to login');
  return json;
};

export const signup = async ({ data }: { data: { email: string; password: string; businessName: string } }) => {
  const res = await fetch('/api/auth.php?action=signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to signup');
  return json;
};

export const logout = async () => {
  const res = await fetch('/api/auth.php?action=logout', { method: 'POST' });
  return res.json();
};

export const getSession = async () => {
  try {
    const res = await fetch('/api/auth.php?action=session');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

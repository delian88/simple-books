export const getSystemSettings = async () => {
  const res = await fetch('/api/admin.php?action=getSettings');
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
    throw new Error('Failed to fetch settings');
  }
  return await res.json();
};

export const updateSystemSettings = async ({ data }: { data: Record<string, string> }) => {
  const res = await fetch('/api/admin.php?action=updateSettings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update settings');
  }
  return await res.json();
};

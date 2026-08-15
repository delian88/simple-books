export const getPublicSettings = async () => {
  const res = await fetch('/api/app.php?action=getPublicSettings');
  if (!res.ok) throw new Error('Failed to fetch public settings');
  return res.json();
};

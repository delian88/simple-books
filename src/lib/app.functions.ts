export const getPublicSettings = async () => {
  try {
    const res = await fetch('/api/app.php?action=getPublicSettings');
    if (!res.ok) return { appName: 'Ledgerly', appLogo: null, appTagline: '' };
    return res.json();
  } catch {
    return { appName: 'Ledgerly', appLogo: null, appTagline: '' };
  }
};

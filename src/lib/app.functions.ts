export const getPublicSettings = async () => {
  try {
    const res = await fetch('/api/app.php?action=getPublicSettings');
    if (!res.ok) return { appName: 'KoboBooks', appLogo: '/logo.png', appTagline: '' };
    const data = await res.json();
    return {
      ...data,
      appLogo: data?.appLogo || '/logo.png',
    };
  } catch {
    return { appName: 'KoboBooks', appLogo: '/logo.png', appTagline: '' };
  }
};

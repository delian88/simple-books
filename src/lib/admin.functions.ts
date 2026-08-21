import { apiGet, apiPost } from "@/lib/api";

export const getSystemSettings = async () => {
  return await apiGet('/api/admin.php?action=getSettings');
};

export const updateSystemSettings = async ({ data }: { data: Record<string, string> }) => {
  return await apiPost('/api/admin.php?action=updateSettings', data);
};

export const getSystemStats = async () => {
  return await apiGet('/api/admin.php?action=getSystemStats');
};

export const listAllCompanies = async () => {
  return await apiGet('/api/admin.php?action=listAllCompanies');
};

export const uploadLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const token = localStorage.getItem('token');
  const response = await fetch('/api/admin.php?action=uploadLogo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  
  return await response.json();
};

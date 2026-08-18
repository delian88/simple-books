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

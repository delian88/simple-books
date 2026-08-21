import { apiGet, apiPost } from "@/lib/api";

export const listUsers = () => apiGet('/api/users.php?action=listUsers');

export const inviteUser = (data: { email: string; role: string }) => 
  apiPost('/api/users.php?action=inviteUser', data);

export const removeUser = (userId: string) => 
  apiPost('/api/users.php?action=removeUser', { userId });

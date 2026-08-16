import { apiGet, apiPost } from "@/lib/api";

export const listUsers = () => apiGet('/api/users.php?action=listUsers');

export const listActivities = () => apiGet('/api/users.php?action=listActivities');

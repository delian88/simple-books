import { apiGet, apiPost } from "@/lib/api";

export const listAccounts = () => apiGet('/api/accounts.php?action=listAccounts');

export const addAccount = ({ data }: { data: any }) =>
  apiPost('/api/accounts.php?action=addAccount', data);

export const updateAccount = ({ data }: { data: any }) =>
  apiPost('/api/accounts.php?action=updateAccount', data);

export const deleteAccount = ({ data }: { data: { id: string } }) =>
  apiPost('/api/accounts.php?action=deleteAccount', data);

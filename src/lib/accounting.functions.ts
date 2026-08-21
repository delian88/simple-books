import { apiGet, apiPost } from "@/lib/api";

export const getProfile = () => apiGet('/api/accounting.php?action=getProfile');

export const updateProfile = ({ data }: { data: { business_name: string; currency: string } }) =>
  apiPost('/api/accounting.php?action=updateProfile', data);

export const listTransactions = () => apiGet('/api/accounting.php?action=listTransactions');

export const addTransactions = ({ data }: { data: any }) =>
  apiPost('/api/accounting.php?action=addTransactions', data);

export const deleteTransaction = ({ data }: { data: { id: string } }) =>
  apiPost('/api/accounting.php?action=deleteTransaction', data);

export const listBalanceItems = () => apiGet('/api/accounting.php?action=listBalanceItems');

export const addBalanceItem = ({ data }: { data: any }) =>
  apiPost('/api/accounting.php?action=addBalanceItem', data);

export const deleteBalanceItem = ({ data }: { data: { id: string } }) =>
  apiPost('/api/accounting.php?action=deleteBalanceItem', data);

export const scanReceipt = ({ data }: { data: any }) =>
  apiPost('/api/ai.php?action=processReceiptBase64', {
    base64Data: data.imageDataUrl,
    filename: 'receipt.png',
    mimeType: 'image/png',
  });

export const listCustomers = () => apiGet('/api/ar.php?action=listCustomers');

export const addCustomer = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=createCustomer', data);

export const deleteCustomer = ({ data }: { data: { id: string } }) =>
  apiPost('/api/ar.php?action=deleteCustomer', data);

export const listInvoices = () => apiGet('/api/ar.php?action=listInvoices');

export const deleteInvoice = ({ data }: { data: { id: string } }) =>
  apiPost('/api/ar.php?action=deleteInvoice', data);

export const listExpenses = () => apiGet('/api/ai.php?action=listExpenses');
export const listAccounts = () => apiGet('/api/accounts.php?action=listAccounts');
export const listJournalEntries = () => apiGet('/api/ledger.php?action=listJournalEntries');

import { apiGet, apiPost } from "@/lib/api";

export const createJournalEntry = ({ data }: { data: any }) =>
  apiPost('/api/ledger.php?action=createJournalEntry', data);

export const listJournalEntries = () => apiGet('/api/ledger.php?action=listJournalEntries');

export const approveJournalEntry = ({ data }: { data: { id: string } }) =>
  apiPost('/api/ledger.php?action=approveJournalEntry', data);

export const reverseJournalEntry = ({ data }: { data: { id: string; date: string; description: string } }) =>
  apiPost('/api/ledger.php?action=reverseJournalEntry', data);

export const createJournalTemplate = ({ data }: { data: any }) =>
  apiPost('/api/ledger.php?action=createJournalTemplate', data);

export const listJournalTemplates = () => apiGet('/api/ledger.php?action=listJournalTemplates');

export const getAccountStatement = ({ data }: { data: { accountId: string; startDate?: string; endDate?: string } }) =>
  apiPost('/api/ledger.php?action=getAccountStatement', data);

export const getTrialBalance = () => apiGet('/api/ledger.php?action=getTrialBalance');

export const getFinancialStatements = () => apiGet('/api/ledger.php?action=getFinancialStatements');

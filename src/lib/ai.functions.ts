import { apiGet, apiPost } from "@/lib/api";

export const processReceiptBase64 = ({ data }: { data: any }) =>
  apiPost('/api/ai.php?action=processReceiptBase64', data);

export const saveAIExpense = ({ data }: { data: any }) =>
  apiPost('/api/ai.php?action=saveAIExpense', data);

export const aiChatQuery = ({ data }: { data: any }) =>
  apiPost('/api/ai.php?action=aiChatQuery', data);

export const deleteAIExpense = ({ data }: { data: { id: string } }) =>
  apiPost('/api/ai.php?action=deleteAIExpense', data);

export const getExpenseDocument = ({ data }: { data: { documentId: string } }) =>
  apiPost('/api/ai.php?action=getExpenseDocument', data);

export const listExpenses = () => apiGet('/api/ai.php?action=listExpenses');

export const generateFinancialInsights = () => apiGet('/api/ai.php?action=generateFinancialInsights');

export const processVoiceExpense = ({ data }: { data: any }) =>
  apiPost('/api/ai.php?action=processVoiceExpense', data);

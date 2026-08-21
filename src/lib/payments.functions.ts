import { apiGet, apiPost } from "@/lib/api";

export const listPaymentMethods = () => apiGet('/api/payments.php?action=listPaymentMethods');

export const addPaymentMethod = (data: { name: string; type: string }) => 
  apiPost('/api/payments.php?action=addPaymentMethod', data);

export const processPayment = (data: any) =>
  apiPost('/api/payments.php?action=processPayment', data);

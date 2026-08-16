import { apiGet, apiPost } from "@/lib/api";

// ----- CUSTOMERS -----
export const createCustomer = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=createCustomer', data);

export const updateCustomer = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=updateCustomer', data);

export const listCustomers = () => apiGet('/api/ar.php?action=listCustomers');

// ----- INVOICES -----
export const createSalesInvoice = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=createSalesInvoice', data);

export const updateSalesInvoice = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=updateSalesInvoice', data);

export const updateInvoiceStatus = ({ data }: { data: { id: string; status: string } }) =>
  apiPost('/api/ar.php?action=updateInvoiceStatus', data);

export const listInvoices = () => apiGet('/api/ar.php?action=listInvoices');

// ----- PAYMENTS -----
export const recordCustomerPayment = ({ data }: { data: any }) =>
  apiPost('/api/ar.php?action=recordCustomerPayment', data);

// ----- REPORTING / STATEMENTS -----
export const getCustomerStatement = ({ data }: { data: { customerId: string } }) =>
  apiPost('/api/ar.php?action=getCustomerStatement', data);

export const getAgingReport = () => apiGet('/api/ar.php?action=getAgingReport');

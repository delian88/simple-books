export type Direction = "inflow" | "outflow";

export type TxnCategory =
  | "capital"
  | "sales"
  | "loan"
  | "debtor_payment"
  | "asset_purchase"
  | "expense"
  | "vendor_payment"
  | "loan_repayment";

export type CaptureSource = "manual" | "bank_statement" | "receipt_scan";

export const INFLOW_CATEGORIES: { value: TxnCategory; label: string; hint: string }[] = [
  { value: "capital", label: "Capital", hint: "Owner money put into the business" },
  { value: "sales", label: "Sales", hint: "Revenue earned from customers" },
  { value: "loan", label: "Loan received", hint: "Borrowed money — a liability" },
  { value: "debtor_payment", label: "Payment from debtor", hint: "Customer settling an old invoice" },
];

export const OUTFLOW_CATEGORIES: { value: TxnCategory; label: string; hint: string }[] = [
  { value: "asset_purchase", label: "Purchase of asset", hint: "Equipment, vehicles, property" },
  { value: "expense", label: "Business expense", hint: "Rent, salaries, fuel, utilities" },
  { value: "vendor_payment", label: "Pay vendor", hint: "Settling a supplier bill" },
  { value: "loan_repayment", label: "Loan repayment", hint: "Paying back borrowed money" },
];

export const CATEGORY_LABEL: Record<TxnCategory, string> = {
  capital: "Capital",
  sales: "Sales",
  loan: "Loan received",
  debtor_payment: "Payment from debtor",
  asset_purchase: "Purchase of asset",
  expense: "Business expense",
  vendor_payment: "Pay vendor",
  loan_repayment: "Loan repayment",
};

export const ASSET_CATEGORIES = [
  "Cash & bank",
  "Inventory",
  "Receivables",
  "Equipment",
  "Vehicles",
  "Property",
  "Other",
];

export const LIABILITY_CATEGORIES = [
  "Loans",
  "Payables",
  "Taxes owed",
  "Accrued expenses",
  "Other",
];

export function formatMoney(amount: number, currency = "NGN") {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", KES: "KSh", GHS: "₵", ZAR: "R" };
  const symbol = symbols[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

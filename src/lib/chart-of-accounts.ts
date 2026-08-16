// Uses the structure exactly as provided by the user
export const STANDARD_CHART_OF_ACCOUNTS = [
  // Assets
  { name: "Building", type: "ASSET", subType: "Fixed Asset" },
  { name: "Motor Vehicle", type: "ASSET", subType: "Fixed Asset" },
  { name: "Power Generating Set", type: "ASSET", subType: "Fixed Asset" },
  { name: "Machines/Equipment", type: "ASSET", subType: "Fixed Asset" },
  { name: "Stock", type: "ASSET", subType: "Current Asset" },
  { name: "Debtors", type: "ASSET", subType: "Current Asset" }, // people owing me
  { name: "Bank Balance", type: "ASSET", subType: "Current Asset" },
  { name: "Cash Balance", type: "ASSET", subType: "Current Asset" },

  // Liabilities
  { name: "Long Term Loan", type: "LIABILITY", subType: "Long Term Liability" },
  { name: "Creditors", type: "LIABILITY", subType: "Short Term Liability" },
  { name: "Others", type: "LIABILITY", subType: "Short Term Liability" }, // other people I am owing

  // Owners Funds (Equity)
  { name: "Capital", type: "EQUITY", subType: "Owners Funds" },
  { name: "Retained Profit", type: "EQUITY", subType: "Owners Funds" },

  // Revenue
  { name: "Sales", type: "REVENUE", subType: "Revenue" },
  { name: "Other Income", type: "REVENUE", subType: "Revenue" },

  // Cost of Goods Sold (COGS)
  { name: "Direct Cost of goods or services", type: "EXPENSE", subType: "Cost of Goods Sold" },

  // Expenses
  { name: "Salaries & Wages", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Selling & Distribution Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Transport & Travelling", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Motor Running Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Delivery Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Printing & Stationery", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Telephone Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Electricity", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Medical Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Rent/Insurance", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Repairs & Maintenance", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Computer & Internet Expenses", type: "EXPENSE", subType: "Operating Expense" },
  { name: "Legal/Audit Fees", type: "EXPENSE", subType: "Operating Expense" },
  { name: "General Office Expenses", type: "EXPENSE", subType: "Operating Expense" },
];

/**
 * Seeds the standard chart of accounts via the PHP API.
 * Call this after a new company is created.
 */
export async function seedStandardChartOfAccounts(companyId: string) {
  const { apiPost } = await import("@/lib/api");
  for (let i = 0; i < STANDARD_CHART_OF_ACCOUNTS.length; i++) {
    const acc = STANDARD_CHART_OF_ACCOUNTS[i];
    await apiPost('/api/accounts.php?action=addAccount', {
      companyId,
      name: acc.name,
      type: acc.type,
      subType: acc.subType,
      code: (1000 + i).toString(),
      openingBalance: 0,
    });
  }
}

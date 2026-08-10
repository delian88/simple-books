import { prisma } from "@/server/db";

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

  // Cost of Goods Sold (COGS) - We classify this as EXPENSE type but track COGS subType for reporting
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

export async function seedStandardChartOfAccounts(companyId: string) {
  // Clear any existing accounts to prevent duplicates if called multiple times initially
  await prisma.account.deleteMany({
    where: { companyId }
  });

  // Create accounts
  for (let i = 0; i < STANDARD_CHART_OF_ACCOUNTS.length; i++) {
    const acc = STANDARD_CHART_OF_ACCOUNTS[i];
    await prisma.account.create({
      data: {
        companyId,
        name: acc.name,
        code: (1000 + i).toString(), // Auto-generate some code
        type: acc.type,
        subType: acc.subType,
      }
    });
  }
}

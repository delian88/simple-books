import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accountsToSeed = [
  // Assets -> Fixed Assets
  { name: 'Building', type: 'ASSET', subType: 'Fixed Asset' },
  { name: 'Motor Vehicle', type: 'ASSET', subType: 'Fixed Asset' },
  { name: 'Power Generating Set', type: 'ASSET', subType: 'Fixed Asset' },
  { name: 'Machines/Equipment', type: 'ASSET', subType: 'Fixed Asset' },

  // Assets -> Current Assets
  { name: 'Stock', type: 'ASSET', subType: 'Current Asset' },
  { name: 'Debtors (people owing me)', type: 'ASSET', subType: 'Accounts Receivable' },
  { name: 'Bank Balance', type: 'ASSET', subType: 'Bank' },
  { name: 'Cash Balance', type: 'ASSET', subType: 'Cash' },

  // Liabilities -> Long Term Liability
  { name: 'Long Term Loan', type: 'LIABILITY', subType: 'Long Term Liability' },

  // Liabilities -> Short Term Liability
  { name: 'Creditors', type: 'LIABILITY', subType: 'Accounts Payable' },
  { name: 'Others (Other people I am owing)', type: 'LIABILITY', subType: 'Short Term Liability' },

  // Owners Funds (Equity)
  { name: 'Capital', type: 'EQUITY', subType: 'Owner\'s Equity' },
  { name: 'Retained Profit', type: 'EQUITY', subType: 'Retained Earnings' },

  // Revenue
  { name: 'Sales', type: 'REVENUE', subType: 'Sales Revenue' },
  { name: 'Other Income', type: 'REVENUE', subType: 'Other Income' },

  // COGS
  { name: 'Direct Cost of goods or services', type: 'EXPENSE', subType: 'Cost of Goods Sold' },

  // Expenses
  { name: 'Salaries & Wages', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Selling & Distribution Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Transport & Travelling', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Motor Running Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Delivery Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Printing & Stationery', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Telephone Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Electricity', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Medical Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Rent/Insurance', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Repairs & Maintenance', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Computer & Internet Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'Legal/Audit Fees', type: 'EXPENSE', subType: 'Operating Expense' },
  { name: 'General Office Expenses', type: 'EXPENSE', subType: 'Operating Expense' },
];

async function main() {
  // Get the first company (assuming single-tenant or default test company)
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error("No company found in the database. Please create a company first.");
    return;
  }

  console.log(`Seeding Chart of Accounts for company: ${company.name} (${company.id})`);

  let addedCount = 0;

  for (const account of accountsToSeed) {
    // Check if account already exists to prevent duplicates
    const exists = await prisma.account.findFirst({
      where: {
        companyId: company.id,
        name: account.name,
        type: account.type,
      }
    });

    if (!exists) {
      await prisma.account.create({
        data: {
          companyId: company.id,
          name: account.name,
          type: account.type,
          subType: account.subType,
          openingBalance: 0,
        }
      });
      console.log(`+ Added: ${account.name} (${account.type})`);
      addedCount++;
    } else {
      console.log(`~ Skipped (Already exists): ${account.name}`);
    }
  }

  console.log(`Seeding complete. Added ${addedCount} accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();

  for (const company of companies) {
    console.log(`Migrating company: ${company.id}`);

    // Create default accounts for this company to handle legacy transaction categories
    const getOrCreateAccount = async (name: string, type: string) => {
      let acc = await prisma.account.findFirst({
        where: { companyId: company.id, name }
      });
      if (!acc) {
        acc = await prisma.account.create({
          data: {
            companyId: company.id,
            name,
            type,
            openingBalance: 0,
          }
        });
      }
      return acc;
    };

    const cashAccount = await getOrCreateAccount("Cash", "ASSET");
    const salesAccount = await getOrCreateAccount("Sales", "REVENUE");
    const expenseAccount = await getOrCreateAccount("Expense", "EXPENSE");
    const capitalAccount = await getOrCreateAccount("Capital", "EQUITY");
    const liabilityAccount = await getOrCreateAccount("Liability (Loan)", "LIABILITY");

    // Fetch old transactions
    const transactions = await prisma.transaction.findMany({
      where: { companyId: company.id },
      include: { account: true }
    });

    for (const txn of transactions) {
      // Check if a journal entry already exists for this transaction (using reference)
      const existing = await prisma.journalEntry.findFirst({
        where: { reference: `txn-${txn.id}` }
      });

      if (existing) {
        console.log(`Skipping transaction ${txn.id}, journal entry already exists.`);
        continue;
      }

      // Determine the opposing account based on old category string or categoryId
      let opposingAccount = txn.account; 
      if (!opposingAccount) {
        if (txn.category === "sales") opposingAccount = salesAccount;
        else if (txn.category === "expense" || txn.category === "vendor_payment") opposingAccount = expenseAccount;
        else if (txn.category === "capital") opposingAccount = capitalAccount;
        else if (txn.category === "loan") opposingAccount = liabilityAccount;
        else opposingAccount = expenseAccount; // Fallback
      }

      const amount = Number(txn.amount);

      // Money In: Debit Cash, Credit Opposing
      // Money Out: Credit Cash, Debit Opposing
      const debitAccountId = txn.direction === "inflow" ? cashAccount.id : opposingAccount.id;
      const creditAccountId = txn.direction === "inflow" ? opposingAccount.id : cashAccount.id;

      await prisma.journalEntry.create({
        data: {
          companyId: company.id,
          date: txn.occurredOn,
          description: txn.note || `Migrated ${txn.category} transaction`,
          reference: `txn-${txn.id}`,
          status: "POSTED",
          lines: {
            create: [
              {
                accountId: debitAccountId,
                debit: amount,
                credit: 0
              },
              {
                accountId: creditAccountId,
                debit: 0,
                credit: amount
              }
            ]
          }
        }
      });
      console.log(`Migrated txn ${txn.id} -> JournalEntry`);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

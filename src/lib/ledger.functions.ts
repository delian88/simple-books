import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { prisma } from "@/server/db";
import { z } from "zod";

async function getActiveCompanyId(userId: string): Promise<string> {
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true }
  });
  if (!companyUser) throw new Error("User does not belong to any company");
  return companyUser.companyId;
}

const journalLineInput = z.object({
  accountId: z.string().uuid(),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

const journalEntryInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(1),
  reference: z.string().trim().nullable().default(null),
  lines: z.array(journalLineInput).min(2),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "POSTED"]).default("POSTED"),
});

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => journalEntryInput.parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);

    // Validate double-entry logic
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);
    
    // Using a small epsilon for floating point comparison just in case, though they are decimals in DB
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Debits (${totalDebit}) and Credits (${totalCredit}) must balance.`);
    }

    const entry = await prisma.journalEntry.create({
      data: {
        companyId,
        date: new Date(data.date),
        description: data.description,
        reference: data.reference,
        status: data.status,
        lines: {
          create: data.lines.map(l => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit
          }))
        }
      },
      include: { lines: true }
    });

    return { ok: true, entryId: entry.id };
  });

export const listJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const data = await prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: "desc" }
    });
    // Explicitly serialize Decimal values to numbers for safe client-side transport
    return data.map(entry => ({
      ...entry,
      lines: entry.lines.map(line => {
        const { debit, credit, ...restLine } = line;
        const { openingBalance, ...restAccount } = line.account;
        return {
          ...restLine,
          debit: Number(debit),
          credit: Number(credit),
          account: {
            ...restAccount,
            openingBalance: Number(openingBalance)
          }
        };
      })
    }));
  });

export const approveJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    await prisma.journalEntry.updateMany({
      where: { id: data.id, companyId, status: "PENDING_APPROVAL" },
      data: { status: "POSTED" }
    });

    return { ok: true };
  });

export const reverseJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    const original = await prisma.journalEntry.findFirst({
      where: { id: data.id, companyId },
      include: { lines: true }
    });

    if (!original) throw new Error("Journal entry not found.");
    if (original.status === "REVERSED") throw new Error("Entry is already reversed.");
    
    // Create reversal entry (flip debits and credits)
    const reversed = await prisma.journalEntry.create({
      data: {
        companyId,
        date: new Date(),
        description: `Reversal of: ${original.description}`,
        reference: original.reference ? `REV-${original.reference}` : null,
        status: "POSTED",
        reversalId: original.id,
        lines: {
          create: original.lines.map(l => ({
            accountId: l.accountId,
            debit: Number(l.credit), // Flip debit/credit
            credit: Number(l.debit)
          }))
        }
      }
    });

    // Mark original as reversed
    await prisma.journalEntry.update({
      where: { id: original.id },
      data: { status: "REVERSED" }
    });

    return { ok: true, reversalId: reversed.id };
  });

const templateLineInput = z.object({
  accountId: z.string().uuid(),
  debitRatio: z.number().min(0),
  creditRatio: z.number().min(0),
  isFixedAmount: z.boolean().default(false),
});

export const createJournalTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().nullable().default(null),
    lines: z.array(templateLineInput).min(2)
  }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const template = await prisma.journalTemplate.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        templateLines: {
          create: data.lines.map(l => ({
            accountId: l.accountId,
            debitRatio: l.debitRatio,
            creditRatio: l.creditRatio,
            isFixedAmount: l.isFixedAmount
          }))
        }
      }
    });
    return { ok: true, templateId: template.id };
  });

export const listJournalTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const templates = await prisma.journalTemplate.findMany({
      where: { companyId },
      include: { templateLines: { include: { account: true } } }
    });
    
    // Explicitly serialize Decimal values to numbers for safe client-side transport
    return templates.map(t => ({
      ...t,
      templateLines: t.templateLines.map(l => {
        const { debitRatio, creditRatio, ...restLine } = l;
        const { openingBalance, ...restAccount } = l.account;
        return {
          ...restLine,
          debitRatio: Number(debitRatio),
          creditRatio: Number(creditRatio),
          account: {
            ...restAccount,
            openingBalance: Number(openingBalance)
          }
        };
      })
    }));
  });

const statementInput = z.object({
  accountId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getAccountStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => statementInput.parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    // Get account to know type and base opening balance
    const account = await prisma.account.findUnique({
      where: { id: data.accountId, companyId: companyId }
    });
    
    if (!account) throw new Error("Account not found");

    // Get prior journal lines to calculate opening balance as of startDate
    const priorLines = await prisma.journalLine.findMany({
      where: {
        accountId: data.accountId,
        journalEntry: {
          companyId,
          status: "POSTED",
          date: { lt: new Date(data.startDate) }
        }
      }
    });

    let runningBalance = Number(account.openingBalance);
    // Determine normal balance based on account type
    const isNormalDebit = ["ASSET", "EXPENSE"].includes(account.type);

    for (const line of priorLines) {
      if (isNormalDebit) {
         runningBalance += Number(line.debit) - Number(line.credit);
      } else {
         runningBalance += Number(line.credit) - Number(line.debit);
      }
    }

    const initialOpeningBalance = runningBalance;

    // Get journal lines for the period
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: data.accountId,
        journalEntry: {
          companyId,
          status: "POSTED",
          date: { 
            gte: new Date(data.startDate),
            lte: new Date(data.endDate + 'T23:59:59.999Z') 
          }
        }
      },
      include: {
        journalEntry: true
      },
      orderBy: {
        journalEntry: {
          date: 'asc'
        }
      }
    });

    const formattedLines = lines.map(line => {
      if (isNormalDebit) {
         runningBalance += Number(line.debit) - Number(line.credit);
      } else {
         runningBalance += Number(line.credit) - Number(line.debit);
      }
      return {
        id: line.id,
        date: line.journalEntry.date,
        description: line.journalEntry.description,
        reference: line.journalEntry.reference,
        debit: Number(line.debit),
        credit: Number(line.credit),
        balance: runningBalance
      };
    });

    return {
      accountName: account.name,
      accountCode: account.code,
      type: account.type,
      startDate: data.startDate,
      endDate: data.endDate,
      openingBalance: initialOpeningBalance,
      closingBalance: runningBalance,
      lines: formattedLines
    };
  });

export const getTrialBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const accounts = await prisma.account.findMany({
      where: { companyId },
    });

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          companyId,
          status: "POSTED",
        }
      }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const balances = accounts.map(acc => {
      const accLines = lines.filter(l => l.accountId === acc.id);
      const debits = accLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credits = accLines.reduce((sum, l) => sum + Number(l.credit), 0);
      
      let balance = Number(acc.openingBalance);
      let debitBalance = 0;
      let creditBalance = 0;

      const isNormalDebit = ["ASSET", "EXPENSE"].includes(acc.type);
      if (isNormalDebit) {
        balance += debits - credits;
        if (balance >= 0) debitBalance = balance;
        else creditBalance = Math.abs(balance);
      } else {
        balance += credits - debits;
        if (balance >= 0) creditBalance = balance;
        else debitBalance = Math.abs(balance);
      }

      totalDebit += debitBalance;
      totalCredit += creditBalance;

      return {
        id: acc.id,
        name: acc.name,
        code: acc.code,
        type: acc.type,
        subType: acc.subType,
        debit: debitBalance,
        credit: creditBalance,
      };
    }).filter(b => b.debit !== 0 || b.credit !== 0);

    return { balances, totalDebit, totalCredit };
  });

export const getFinancialStatements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const accounts = await prisma.account.findMany({
      where: { companyId },
    });

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          companyId,
          status: "POSTED",
        }
      }
    });

    // Calculate balances for each account
    const balances = accounts.map(acc => {
      const accLines = lines.filter(l => l.accountId === acc.id);
      const debits = accLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credits = accLines.reduce((sum, l) => sum + Number(l.credit), 0);
      
      let balance = Number(acc.openingBalance);
      const isNormalDebit = ["ASSET", "EXPENSE"].includes(acc.type);
      if (isNormalDebit) {
        balance += debits - credits;
      } else {
        balance += credits - debits;
      }

      return {
        ...acc,
        balance
      };
    });

    // 1. Income Statement
    let revenue = 0;
    let cogs = 0;
    let expenses = 0;

    const incomeStatementAccounts = balances.filter(a => ["REVENUE", "EXPENSE"].includes(a.type));
    
    incomeStatementAccounts.forEach(acc => {
      if (acc.type === "REVENUE") {
        revenue += acc.balance;
      } else if (acc.type === "EXPENSE") {
        if (acc.subType === "Cost of Goods Sold") {
          cogs += acc.balance;
        } else {
          expenses += acc.balance;
        }
      }
    });

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    const incomeStatement = {
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      details: incomeStatementAccounts
    };

    // 2. Balance Sheet
    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    const balanceSheetAccounts = balances.filter(a => ["ASSET", "LIABILITY", "EQUITY"].includes(a.type));

    balanceSheetAccounts.forEach(acc => {
      if (acc.type === "ASSET") assets += acc.balance;
      if (acc.type === "LIABILITY") liabilities += acc.balance;
      if (acc.type === "EQUITY") equity += acc.balance;
    });

    // Add Net Profit to Retained Earnings / Equity
    equity += netProfit;

    const balanceSheet = {
      assets,
      liabilities,
      equity,
      details: balanceSheetAccounts
    };

    return { incomeStatement, balanceSheet };
  });



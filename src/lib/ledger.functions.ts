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

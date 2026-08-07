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

const accountInput = z.object({
  name: z.string().trim().min(1).max(255),
  code: z.string().trim().max(50).nullable().default(null),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  subType: z.string().trim().max(100).nullable().default(null),
  parentId: z.string().uuid().nullable().default(null),
  openingBalance: z.number().default(0),
});

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const data = await prisma.account.findMany({
      where: { companyId, isArchived: false },
      orderBy: [{ code: 'asc' }, { name: 'asc' }]
    });
    return data.map((row) => ({
      ...row,
      openingBalance: Number(row.openingBalance),
    }));
  });

export const addAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accountInput.parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    // Create the account
    const account = await prisma.account.create({
      data: {
        companyId,
        name: data.name,
        code: data.code,
        type: data.type,
        subType: data.subType,
        parentId: data.parentId,
        openingBalance: data.openingBalance,
      }
    });

    // If there is an opening balance, we would typically generate a Journal Entry here against Opening Balance Equity.
    // For now, we just save the balance.

    return { ok: true, accountId: account.id };
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), ...accountInput.shape }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    await prisma.account.updateMany({
      where: { id: data.id, companyId },
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        subType: data.subType,
        parentId: data.parentId,
      }
    });
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    // Check if account has transactions (journal lines)
    const linesCount = await prisma.journalLine.count({
      where: { accountId: data.id, account: { companyId } }
    });

    if (linesCount > 0) {
      // Archive instead of delete
      await prisma.account.updateMany({
        where: { id: data.id, companyId },
        data: { isArchived: true }
      });
      return { ok: true, archived: true };
    }

    await prisma.account.deleteMany({
      where: { id: data.id, companyId }
    });
    return { ok: true, deleted: true };
  });

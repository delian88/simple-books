import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/db";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Prisma } from "@prisma/client";

async function getActiveCompanyId(userId: string): Promise<string> {
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true }
  });
  if (!companyUser) throw new Error("User does not belong to any company");
  return companyUser.companyId;
}

async function ensureDefaultAccount(tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, companyId: string, type: string, subType: string, name: string): Promise<string> {
  let account = await tx.account.findFirst({
    where: { companyId, type, subType }
  });
  if (!account) {
    account = await tx.account.create({
      data: {
        companyId,
        name,
        type,
        subType,
        openingBalance: 0,
      }
    });
  }
  return account.id;
}

// ----- CUSTOMERS -----

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string; email?: string; phone?: string; address?: string; currency?: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const customer = await prisma.customer.create({
      data: {
        ...data,
        companyId,
      }
    });
    return { ok: true, customerId: customer.id };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; name?: string; email?: string; phone?: string; address?: string; currency?: string; isArchived?: boolean }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const { id, ...updateData } = data;
    await prisma.customer.update({
      where: { id, companyId },
      data: updateData
    });
    return { ok: true };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const customers = await prisma.customer.findMany({
      where: { companyId, isArchived: false },
      orderBy: { name: "asc" }
    });
    return customers;
  });

// ----- INVOICES -----

export const createSalesInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    customerId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    notes?: string;
    terms?: string;
    lines: {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }[]
  }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    let subtotal = 0;
    let taxAmount = 0;

    data.lines.forEach(line => {
      const lineAmount = line.quantity * line.unitPrice;
      subtotal += lineAmount;
      taxAmount += lineAmount * (line.taxRate / 100);
    });

    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.salesInvoice.create({
      data: {
        companyId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        status: "DRAFT",
        lines: {
          create: data.lines.map(line => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            amount: line.quantity * line.unitPrice,
            taxRate: line.taxRate
          }))
        }
      }
    });

    return { ok: true, invoiceId: invoice.id };
  });

export const updateSalesInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id: string;
    customerId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    notes?: string;
    terms?: string;
    lines: {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }[]
  }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    let subtotal = 0;
    let taxAmount = 0;

    data.lines.forEach(line => {
      const lineAmount = line.quantity * line.unitPrice;
      subtotal += lineAmount;
      taxAmount += lineAmount * (line.taxRate / 100);
    });

    const totalAmount = subtotal + taxAmount;

    // Delete existing lines first
    await prisma.salesInvoiceLine.deleteMany({
      where: { invoiceId: data.id }
    });

    const invoice = await prisma.salesInvoice.update({
      where: { id: data.id, companyId },
      data: {
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        lines: {
          create: data.lines.map(line => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            amount: line.quantity * line.unitPrice,
            taxRate: line.taxRate
          }))
        }
      }
    });

    return { ok: true, invoiceId: invoice.id };
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findUnique({ where: { id: data.id } });
      if (!invoice) throw new Error("Invoice not found");

      // Optional GL Posting Logic could go here when status moves to SENT
      // e.g. Debit Accounts Receivable, Credit Revenue
      if (data.status === "SENT" && invoice.status === "DRAFT") {
        const arAccountId = await ensureDefaultAccount(tx, companyId, "ASSET", "Accounts Receivable", "Accounts Receivable");
        const salesAccountId = await ensureDefaultAccount(tx, companyId, "REVENUE", "Sales Revenue", "Sales Revenue");

        const ref = `INV-${invoice.invoiceNumber}`;
        const existingEntry = await tx.journalEntry.findFirst({
          where: { companyId, reference: ref }
        });

        if (!existingEntry) {
          await tx.journalEntry.create({
            data: {
              companyId,
              date: invoice.issueDate,
              description: `Invoice ${invoice.invoiceNumber}`,
              reference: ref,
              status: "POSTED",
              lines: {
                create: [
                  { accountId: arAccountId, debit: invoice.totalAmount, credit: 0 },
                  { accountId: salesAccountId, debit: 0, credit: invoice.totalAmount }
                ]
              }
            }
          });
        }
      }

      await tx.salesInvoice.update({
        where: { id: data.id, companyId },
        data: { status: data.status }
      });
    });

    return { ok: true };
  });

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const companyId = await getActiveCompanyId(context.userId);
      const invoices = await prisma.salesInvoice.findMany({
        where: { companyId },
        include: { customer: true, lines: true },
        orderBy: { issueDate: "desc" }
      });

      // Fix decimals for tanstack react-start
      return invoices.map(inv => {
        const { subtotal, taxAmount, totalAmount, ...restInv } = inv;
        const { companyId: cid, ...restCustomer } = inv.customer;
        return {
          ...restInv,
          subtotal: Number(subtotal),
          taxAmount: Number(taxAmount),
          totalAmount: Number(totalAmount),
          customer: restCustomer,
          lines: inv.lines.map(l => {
            const { quantity, unitPrice, amount, taxRate, ...restLine } = l;
            return {
              ...restLine,
              quantity: Number(quantity),
              unitPrice: Number(unitPrice),
              amount: Number(amount),
              taxRate: Number(taxRate)
            };
          })
        };
      });
    } catch (err) {
      console.error("Error in listInvoices:", err);
      throw err;
    }
  });

// ----- PAYMENTS -----

export const recordCustomerPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    customerId: string;
    date: Date;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    allocations: { invoiceId: string; amount: number }[]
  }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          companyId,
          customerId: data.customerId,
          date: data.date,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          allocations: {
            create: data.allocations.map(a => ({
              invoiceId: a.invoiceId,
              amount: a.amount
            }))
          }
        }
      });

      // Update Invoice Statuses based on payment amount vs outstanding
      for (const alloc of data.allocations) {
        const invoice = await tx.salesInvoice.findUnique({ 
          where: { id: alloc.invoiceId },
          include: { payments: true }
        });
        
        if (invoice) {
          const totalAllocated = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + alloc.amount;
          
          let newStatus = invoice.status;
          if (totalAllocated >= Number(invoice.totalAmount)) {
            newStatus = "PAID";
          } else if (totalAllocated > 0) {
            newStatus = "PARTIAL";
          }
          
          if (newStatus !== invoice.status) {
            await tx.salesInvoice.update({
              where: { id: invoice.id },
              data: { status: newStatus }
            });
          }
        }
      }

      // Automatically post to GL here if required in the future
      const bankAccountId = await ensureDefaultAccount(tx, companyId, "ASSET", "Bank", "Cash & Bank");
      const arAccountId = await ensureDefaultAccount(tx, companyId, "ASSET", "Accounts Receivable", "Accounts Receivable");
      
      const paymentRef = data.reference || `PMT-${payment.id.substring(0, 8)}`;
      await tx.journalEntry.create({
        data: {
          companyId,
          date: data.date,
          description: `Customer Payment ${paymentRef}`,
          reference: paymentRef,
          status: "POSTED",
          lines: {
            create: [
              { accountId: bankAccountId, debit: data.amount, credit: 0 },
              { accountId: arAccountId, debit: 0, credit: data.amount }
            ]
          }
        }
      });

      return { ok: true, paymentId: payment.id };
    });
  });

// ----- REPORTING / STATEMENTS -----

export const getCustomerStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { customerId: string }) => data)
  .handler(async ({ context, data }: any) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    const invoices = await prisma.salesInvoice.findMany({
      where: { companyId, customerId: data.customerId, status: { notIn: ["DRAFT", "CANCELLED"] } },
      orderBy: { issueDate: "asc" }
    });

    const payments = await prisma.customerPayment.findMany({
      where: { companyId, customerId: data.customerId },
      orderBy: { date: "asc" }
    });

    const transactions = [
      ...invoices.map(i => ({ type: "INVOICE", date: i.issueDate, id: i.id, reference: i.invoiceNumber, amount: Number(i.totalAmount) })),
      ...payments.map(p => ({ type: "PAYMENT", date: p.date, id: p.id, reference: p.reference || 'Payment', amount: -Number(p.amount) }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const statement = transactions.map(t => {
      balance += t.amount;
      return { ...t, balance };
    });

    return statement;
  });

export const getAgingReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: any) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    const unpaidInvoices = await prisma.salesInvoice.findMany({
      where: { companyId, status: { notIn: ["DRAFT", "PAID", "CANCELLED"] } },
      include: { customer: true, payments: true }
    });

    const now = new Date();
    
    const report: Record<string, {
      customer: any;
      current: number;
      thirty: number;
      sixty: number;
      ninety: number;
      older: number;
      total: number;
    }> = {};

    unpaidInvoices.forEach(inv => {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = totalAmount - paidAmount;
      
      if (balance <= 0) return;

      const customerId = inv.customerId;
      if (!report[customerId]) {
        const { companyId, ...restCustomer } = inv.customer;
        report[customerId] = {
          customer: restCustomer,
          current: 0, thirty: 0, sixty: 0, ninety: 0, older: 0, total: 0
        };
      }

      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 3600 * 24));
      
      if (daysOverdue <= 0) report[customerId].current += balance;
      else if (daysOverdue <= 30) report[customerId].thirty += balance;
      else if (daysOverdue <= 60) report[customerId].sixty += balance;
      else if (daysOverdue <= 90) report[customerId].ninety += balance;
      else report[customerId].older += balance;

      report[customerId].total += balance;
    });

    return Object.values(report);
  });

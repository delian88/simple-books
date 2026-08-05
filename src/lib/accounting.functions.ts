import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { prisma } from "@/server/db";
import { z } from "zod";

const txnInput = z.object({
  direction: z.enum(["inflow", "outflow"]),
  category: z.enum([
    "capital",
    "sales",
    "loan",
    "debtor_payment",
    "asset_purchase",
    "expense",
    "vendor_payment",
    "loan_repayment",
  ]),
  amount: z.number().positive().max(1_000_000_000_00),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  counterparty: z.string().trim().max(120).nullable().default(null),
  note: z.string().trim().max(400).nullable().default(null),
  source: z.enum(["manual", "bank_statement", "receipt_scan"]).default("manual"),
});

const balanceInput = z.object({
  side: z.enum(["asset", "liability"]),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  amount: z.number().min(0).max(1_000_000_000_00),
  as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const data = await prisma.profile.findUnique({
      where: { id: context.userId },
      select: { id: true, businessName: true, currency: true }
    });
    return data ? { id: data.id, business_name: data.businessName, currency: data.currency } : { id: context.userId, business_name: "My Business", currency: "NGN" };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ business_name: z.string().trim().min(1).max(120), currency: z.string().trim().min(1).max(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.profile.upsert({
      where: { id: context.userId },
      update: { businessName: data.business_name, currency: data.currency },
      create: { id: context.userId, businessName: data.business_name, currency: data.currency }
    });
    return { ok: true };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const data = await prisma.transaction.findMany({
      where: { userId: context.userId },
      select: { id: true, direction: true, category: true, amount: true, occurredOn: true, counterparty: true, note: true, source: true },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
      take: 500
    });
    return data.map((row) => ({ ...row, amount: Number(row.amount), occurred_on: row.occurredOn.toISOString().slice(0, 10) }));
  });

export const addTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ rows: z.array(txnInput).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = data.rows.map((row) => ({
      userId: context.userId,
      direction: row.direction,
      category: row.category,
      amount: row.amount,
      occurredOn: new Date(row.occurred_on),
      counterparty: row.counterparty,
      note: row.note,
      source: row.source
    }));
    await prisma.transaction.createMany({ data: rows });
    return { inserted: rows.length };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await prisma.transaction.deleteMany({ where: { id: data.id, userId: context.userId } });
    return { ok: true };
  });

export const listBalanceItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const data = await prisma.balanceItem.findMany({
      where: { userId: context.userId },
      select: { id: true, side: true, name: true, category: true, amount: true, asOf: true },
      orderBy: [{ side: 'asc' }, { createdAt: 'desc' }]
    });
    return data.map((row) => ({ ...row, amount: Number(row.amount), as_of: row.asOf.toISOString().slice(0, 10) }));
  });

export const addBalanceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => balanceInput.parse(input))
  .handler(async ({ data, context }) => {
    await prisma.balanceItem.create({
      data: {
        userId: context.userId,
        side: data.side,
        name: data.name,
        category: data.category,
        amount: data.amount,
        asOf: new Date(data.as_of)
      }
    });
    return { ok: true };
  });

export const deleteBalanceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await prisma.balanceItem.deleteMany({ where: { id: data.id, userId: context.userId } });
    return { ok: true };
  });

export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        imageDataUrl: z
          .string()
          .startsWith("data:image/")
          .max(8_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this app yet.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You read scanned third-party receipts for a small business bookkeeping app. " +
              "Reply with ONLY a JSON object, no markdown fences, with keys: " +
              "vendor (string), amount (number, the grand total paid), date (YYYY-MM-DD, empty string if unreadable), " +
              "description (short string), category (one of: asset_purchase, expense, vendor_payment, loan_repayment). " +
              "Choose asset_purchase for equipment/vehicles/property, loan_repayment for loan or interest payments, " +
              "vendor_payment when it settles a supplier invoice or account, otherwise expense.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the receipt details." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (response.status === 429) throw new Error("AI is busy right now — please try again in a moment.");
    if (response.status === 402) throw new Error("AI credits are exhausted. Add credits to keep scanning receipts.");
    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway error [${response.status}]: ${body}`);
      throw new Error("Could not read that receipt. Try a clearer photo.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      throw new Error("Could not read that receipt. Try a clearer photo.");
    }

    const amount = Number(parsed["amount"]);
    const date = typeof parsed["date"] === "string" ? parsed["date"] : "";
    const category = String(parsed["category"] ?? "expense");

    return {
      vendor: typeof parsed["vendor"] === "string" ? parsed["vendor"].slice(0, 120) : "",
      amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0,
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      description: typeof parsed["description"] === "string" ? parsed["description"].slice(0, 200) : "",
      category: ["asset_purchase", "expense", "vendor_payment", "loan_repayment"].includes(category)
        ? category
        : "expense",
    };
  });

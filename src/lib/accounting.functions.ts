import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
    const { data } = await context.supabase
      .from("profiles")
      .select("id, business_name, currency")
      .eq("id", context.userId)
      .maybeSingle();
    return data ?? { id: context.userId, business_name: "My Business", currency: "NGN" };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ business_name: z.string().trim().min(1).max(120), currency: z.string().trim().min(1).max(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transactions")
      .select("id, direction, category, amount, occurred_on, counterparty, note, source")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
  });

export const addTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ rows: z.array(txnInput).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = data.rows.map((row) => ({ ...row, user_id: context.userId }));
    const { error } = await context.supabase.from("transactions").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transactions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBalanceItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("balance_items")
      .select("id, side, name, category, amount, as_of")
      .order("side")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
  });

export const addBalanceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => balanceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("balance_items")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBalanceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("balance_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
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

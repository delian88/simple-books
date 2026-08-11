import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { prisma } from "@/server/db";

async function getActiveCompanyId(userId: string): Promise<string> {
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId },
    select: { companyId: true }
  });
  if (!companyUser) throw new Error("User does not belong to any company");
  return companyUser.companyId;
}

// Call Pollinations API for JSON formatting
function extractAmountFromText(text: string, aiAmount?: any): number {
  if (aiAmount != null) {
    if (typeof aiAmount === "number" && !isNaN(aiAmount) && aiAmount > 0) {
      return aiAmount;
    }
    if (typeof aiAmount === "string") {
      const clean = aiAmount.replace(/[^0-9.]/g, "");
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  const lines = text.split(/\r?\n/);
  const totalKeywords = /total|amount|due|balance|net|grand total|subtotal|pay|price|cost/i;

  for (const line of lines) {
    if (totalKeywords.test(line)) {
      const matches = line.match(/(?:[₦$€£\s]*)(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g);
      if (matches) {
        for (const match of matches) {
          const numStr = match.replace(/[^0-9.]/g, "");
          const val = parseFloat(numStr);
          if (!isNaN(val) && val > 0) return val;
        }
      }
    }
  }

  const numbers = text.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b\d+\.\d{2}\b|\b\d{2,7}\b/g);
  if (numbers) {
    const validNums = numbers
      .map(n => parseFloat(n.replace(/,/g, "")))
      .filter(n => !isNaN(n) && n > 0 && n < 100000000);
    if (validNums.length > 0) {
      return Math.max(...validNums);
    }
  }

  return 0;
}

function extractVendorFromText(text: string, aiVendor?: string): string {
  if (aiVendor && aiVendor.trim() && aiVendor.toLowerCase() !== "unknown vendor" && aiVendor.toLowerCase() !== "unknown") {
    return aiVendor.trim();
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
  for (const line of lines) {
    if (!/total|receipt|date|tax|thank you|welcome|amount|tel|phone|cashier|invoice|subtotal/i.test(line)) {
      return line.substring(0, 60);
    }
  }

  return "Scanned Merchant";
}

async function formatWithPollinations(text: string): Promise<any> {
  const prompt = `
    Extract the following fields from this raw receipt OCR text.
    Return ONLY a valid JSON object with these keys (no markdown formatting, no code blocks):
    - vendor: string (name of the store/vendor)
    - date: string (YYYY-MM-DD format)
    - amount: number (total numeric amount without currency symbols, e.g. 1500 or 45.99)
    - category: string (best guess of expense category, e.g., "Office Supplies", "Meals", "Software", "Travel", "Utilities", "Other")
    - description: string (summary or list of items purchased on the receipt)
    
    Raw OCR Text:
    """
    ${text.substring(0, 1500)}
    """
  `;

  try {
    const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?model=openai`;
    const response = await fetch(url);
    const result = await response.text();
    
    let cleanJson = result.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Pollinations formatting error:", err);
    return {
      vendor: "Unknown Vendor",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      category: "Other",
      description: "General expense"
    };
  }
}

export const processReceiptBase64 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { base64Data: string; mimeType: string; filename: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);

    const base64Clean = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    const document = await prisma.document.create({
      data: {
        companyId,
        filename: data.filename,
        mimeType: data.mimeType,
        content: buffer
      }
    });

    let ocrText = "";
    try {
      const { default: Tesseract } = await import(/* @vite-ignore */ "tesseract.js");
      const result = await Tesseract.recognize(buffer, "eng");
      ocrText = result.data.text;
    } catch (err) {
      console.error("OCR Error:", err);
      throw new Error("Failed to read text from image");
    }

    if (!ocrText.trim()) {
      throw new Error("No text found in the image");
    }

    const parsed = await formatWithPollinations(ocrText);
    const amount = extractAmountFromText(ocrText, parsed?.amount);
    const vendor = extractVendorFromText(ocrText, parsed?.vendor);

    return {
      documentId: document.id,
      vendor: vendor,
      amount: amount,
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Other",
      description: parsed.description || `Scanned receipt: ${data.filename}`,
      rawText: ocrText.substring(0, 500)
    };
  });

export const saveAIExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    id?: string;
    documentId?: string;
    vendor: string;
    description?: string;
    amount: number;
    date: Date | string;
    category: string;
  }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    const parsedDate = data.date instanceof Date ? data.date : new Date(data.date || Date.now());
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    let isFlagged = false;
    let flagReason = null;

    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const duplicate = await prisma.expense.findFirst({
      where: {
        companyId,
        vendor: data.vendor,
        amount: data.amount,
        createdAt: { gte: fortyEightHoursAgo },
        ...(data.id ? { id: { not: data.id } } : {})
      }
    });

    if (duplicate) {
      isFlagged = true;
      flagReason = "DUPLICATE: An expense with this exact vendor and amount was submitted within the last 48 hours.";
    }

    if (!isFlagged) {
      const pastExpenses = await prisma.expense.findMany({
        where: { companyId, vendor: data.vendor },
        select: { amount: true }
      });

      if (pastExpenses.length >= 3) {
        const sum = pastExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
        const avg = sum / pastExpenses.length;
        if (data.amount > avg * 3) {
          isFlagged = true;
          flagReason = `ANOMALY: This amount is >300% higher than your historical average (₦${avg.toFixed(2)}) for ${data.vendor}.`;
        }
      } else if (data.amount > 500000) {
        isFlagged = true;
        flagReason = "ANOMALY: High value expense requiring manual review.";
      }
    }

    let expense;
    if (data.id) {
      expense = await prisma.expense.update({
        where: { id: data.id },
        data: {
          vendor: data.vendor,
          description: data.description || null,
          amount: data.amount,
          date: validDate,
          category: data.category,
          isFlagged,
          flagReason
        }
      });
    } else {
      expense = await prisma.expense.create({
        data: {
          companyId,
          documentId: data.documentId || null,
          vendor: data.vendor,
          description: data.description || null,
          amount: data.amount,
          date: validDate,
          category: data.category,
          isFlagged,
          flagReason
        }
      });
    }

    try {
      let expenseAccount = await prisma.account.findFirst({
        where: { companyId, type: "EXPENSE" }
      });
      if (!expenseAccount) {
        expenseAccount = await prisma.account.create({
          data: { companyId, name: "General Expenses", type: "EXPENSE" }
        });
      }

      let cashAccount = await prisma.account.findFirst({
        where: { companyId, name: "Cash" }
      });
      if (!cashAccount) {
        cashAccount = await prisma.account.create({
          data: { companyId, name: "Cash", type: "ASSET" }
        });
      }

      await prisma.transaction.create({
        data: {
          userId: context.userId,
          companyId,
          createdBy: context.userId,
          direction: "outflow",
          categoryId: expenseAccount.id,
          category: data.category || "Expense",
          amount: data.amount,
          occurredOn: validDate,
          counterparty: data.vendor,
          note: data.description || `Scanned receipt from ${data.vendor}`,
          source: data.documentId ? "receipt_scan" : "manual"
        }
      });

      await prisma.journalEntry.create({
        data: {
          companyId,
          date: validDate,
          description: `Receipt: ${data.vendor} - ${data.category}`,
          status: "POSTED",
          lines: {
            create: [
              { accountId: expenseAccount.id, debit: data.amount, credit: 0 },
              { accountId: cashAccount.id, debit: 0, credit: data.amount }
            ]
          }
        }
      });
    } catch (journalErr) {
      console.error("Failed to post journal entry for expense:", journalErr);
    }
    
    return { ok: true, expenseId: expense.id, isFlagged, flagReason };
  });

export const aiChatQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query: string; history: { role: string; content: string }[] }) => data)
  .handler(async ({ context, data }) => {
    const systemPrompt = `You are an expert AI accounting assistant for a platform called Ledgerly. Be concise and helpful.`;
    
    const fullHistory = [
      { role: "system", content: systemPrompt },
      ...data.history,
      { role: "user", content: data.query }
    ];

    try {
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullHistory,
          model: "openai"
        })
      });
      const text = await response.text();
      return { response: text };
    } catch (err) {
      console.error("AI Chat Error:", err);
      return { response: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
    }
  });

export const deleteAIExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    await prisma.expense.deleteMany({
      where: { id: data.id, companyId }
    });
    return { ok: true };
  });

export const getExpenseDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { documentId: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const doc = await prisma.document.findFirst({
      where: { id: data.documentId, companyId },
      select: { filename: true, mimeType: true, content: true }
    });
    if (!doc) throw new Error("Document not found");
    const base64 = doc.content.toString("base64");
    return {
      filename: doc.filename,
      mimeType: doc.mimeType,
      dataUrl: `data:${doc.mimeType};base64,${base64}`
    };
  });

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const expenses = await prisma.expense.findMany({
      where: { companyId },
      include: {
        document: {
          select: { id: true, filename: true, mimeType: true }
        }
      },
      orderBy: { date: "desc" }
    });
    return expenses.map((exp) => ({
      ...exp,
      amount: Number(exp.amount),
      date: exp.date.toISOString().split("T")[0]
    }));
  });

export const generateFinancialInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    // Get last 90 days of data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const expenses = await prisma.expense.findMany({
      where: { companyId, date: { gte: ninetyDaysAgo } },
      select: { amount: true, category: true, date: true }
    });

    const invoices = await prisma.salesInvoice.findMany({
      where: { companyId, issueDate: { gte: ninetyDaysAgo }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, issueDate: true, status: true }
    });

    // Aggregate
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenue = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    
    const categories = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    const prompt = `
      You are an expert financial analyst. Analyze the following 90-day financial summary for a small business.
      Total Revenue (Invoiced): ${totalRevenue}
      Total Expenses: ${totalExpenses}
      Expenses by Category: ${JSON.stringify(categories)}
      
      Generate a JSON response with exactly two keys:
      - "insights": An array of 3 strings. Each string is a brief, actionable insight or observation about their spending/revenue.
      - "prediction": A short 1-sentence prediction for their cash flow over the next 30 days based on these numbers.

      Return ONLY valid JSON. No markdown.
    `;

    try {
      const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?model=openai`;
      const response = await fetch(url);
      const result = await response.text();
      
      let cleanJson = result.trim();
      if (cleanJson.startsWith('\`\`\`json')) cleanJson = cleanJson.slice(7);
      if (cleanJson.startsWith('\`\`\`')) cleanJson = cleanJson.slice(3);
      if (cleanJson.endsWith('\`\`\`')) cleanJson = cleanJson.slice(0, -3);
      
      return JSON.parse(cleanJson.trim());
    } catch (err) {
      console.error("Insights Error:", err);
      return {
        insights: ["Revenue looks steady.", "Keep an eye on categorizing your expenses.", "Upload more receipts to get better insights!"],
        prediction: "Cash flow should remain stable over the next 30 days."
      };
    }
  });

export const processVoiceExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { text: string }) => data)
  .handler(async ({ data }) => {
    const parsed = await formatWithPollinations(data.text);
    const amount = extractAmountFromText(data.text, parsed?.amount);
    const vendor = extractVendorFromText(data.text, parsed?.vendor);
    return {
      vendor: vendor || "Voice Entry",
      amount: amount,
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Other"
    };
  });

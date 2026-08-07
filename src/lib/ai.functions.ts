import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth.functions";
import { getActiveCompanyId } from "./auth.functions";
import { prisma } from "./prisma";
import Tesseract from "tesseract.js";

// Call Pollinations API for JSON formatting
async function formatWithPollinations(text: string): Promise<any> {
  const prompt = `
    Extract the following fields from this raw receipt OCR text.
    Return ONLY a valid JSON object with these keys (no markdown formatting, no code blocks):
    - vendor: string (name of the store/vendor)
    - date: string (YYYY-MM-DD format)
    - amount: number (total amount)
    - category: string (best guess of expense category, e.g., "Office Supplies", "Meals", "Software", "Travel", "Utilities", "Other")
    
    Raw OCR Text:
    """
    ${text.substring(0, 1000)} // truncate to avoid giant inputs
    """
  `;

  try {
    const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?model=openai`;
    const response = await fetch(url);
    const result = await response.text();
    
    // Sometimes LLMs return markdown code blocks anyway. Let's clean it up.
    let cleanJson = result.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    
    return JSON.parse(cleanJson.trim());
  } catch (err) {
    console.error("Pollinations formatting error:", err);
    // Fallback if parsing fails
    return {
      vendor: "Unknown Vendor",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      category: "Other"
    };
  }
}

export const processReceiptBase64 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { base64Data: string; mimeType: string; filename: string }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);

    // 1. Remove data URL prefix if present
    const base64Clean = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    // 2. Save document to MySQL LONGBLOB
    const document = await prisma.document.create({
      data: {
        companyId,
        filename: data.filename,
        mimeType: data.mimeType,
        content: buffer
      }
    });

    // 3. Run Tesseract OCR directly on the buffer
    let ocrText = "";
    try {
      const result = await Tesseract.recognize(buffer, "eng");
      ocrText = result.data.text;
    } catch (err) {
      console.error("OCR Error:", err);
      throw new Error("Failed to read text from image");
    }

    if (!ocrText.trim()) {
      throw new Error("No text found in the image");
    }

    // 4. Use Pollinations AI to format into JSON
    const parsed = await formatWithPollinations(ocrText);

    return {
      documentId: document.id,
      vendor: parsed.vendor || "Unknown Vendor",
      amount: parsed.amount || 0,
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Other"
    };
  });

export const saveAIExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    documentId: string;
    vendor: string;
    description?: string;
    amount: number;
    date: Date;
    category: string;
  }) => data)
  .handler(async ({ context, data }) => {
    const companyId = await getActiveCompanyId(context.userId);
    
    let isFlagged = false;
    let flagReason = null;

    // 1. Duplicate Check: Same vendor & amount within 48 hours
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const duplicate = await prisma.expense.findFirst({
      where: {
        companyId,
        vendor: data.vendor,
        amount: data.amount,
        createdAt: { gte: fortyEightHoursAgo }
      }
    });

    if (duplicate) {
      isFlagged = true;
      flagReason = "DUPLICATE: An expense with this exact vendor and amount was submitted within the last 48 hours.";
    }

    // 2. Anomaly Detection: Check if amount is unusually high for this vendor
    if (!isFlagged) {
      const pastExpenses = await prisma.expense.findMany({
        where: { companyId, vendor: data.vendor },
        select: { amount: true }
      });

      if (pastExpenses.length >= 3) {
        const sum = pastExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
        const avg = sum / pastExpenses.length;
        if (data.amount > avg * 3) { // >300% of average
          isFlagged = true;
          flagReason = `ANOMALY: This amount is >300% higher than your historical average (₦${avg.toFixed(2)}) for ${data.vendor}.`;
        }
      } else if (data.amount > 500000) {
        // Generic flag for very high undocumented single expenses
        isFlagged = true;
        flagReason = "ANOMALY: High value expense requiring manual review.";
      }
    }

    const expense = await prisma.expense.create({
      data: {
        companyId,
        documentId: data.documentId,
        vendor: data.vendor,
        description: data.description,
        amount: data.amount,
        date: data.date,
        category: data.category,
        isFlagged,
        flagReason
      }
    });
    
    return { ok: true, expenseId: expense.id, isFlagged, flagReason };
  });

export const aiChatQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query: string; history: { role: string; content: string }[] }) => data)
  .handler(async ({ context, data }) => {
    // In a real app we would pass company data to the prompt context.
    // Here we'll just forward the chat to Pollinations for a generic accounting assistant.
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
      return { response: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." };
    }
  });

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getActiveCompanyId(context.userId);
    const expenses = await prisma.expense.findMany({
      where: { companyId },
      orderBy: { date: "desc" }
    });
    return expenses;
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
    // We reuse the Pollinations API to parse the transcribed text
    const parsed = await formatWithPollinations(data.text);
    return {
      vendor: parsed.vendor || "Voice Entry",
      amount: parsed.amount || 0,
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Other"
    };
  });

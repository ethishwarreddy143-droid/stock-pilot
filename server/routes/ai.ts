import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { getDb, saveDb, AIHistoryItem } from "../db";
import { computeHoldings } from "./portfolio";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// 1. Analyze portfolio diversification and risk score
router.post("/analyze", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;
    const userTxs = db.transactions.filter((tx) => tx.userId === userId);
    const holdings = computeHoldings(userTxs);

    if (holdings.length === 0) {
      res.status(400).json({ error: "Your portfolio is empty. Add transactions first to generate an AI analysis." });
      return;
    }

    const portfolioSummary = holdings
      .map((h) => `${h.ticker}: ${h.shares} shares @ avg price $${h.avgBuyPrice}`)
      .join(", ");

    const prompt = `As an expert AI Financial Advisor, perform a detailed Portfolio Diversification and Risk Analysis for this retail investor. 
    Current holdings: ${portfolioSummary}.
    
    Structure your answer in a clean JSON format with these exact keys:
    - riskScore: A number from 1 to 10 indicating portfolio risk (1: extremely conservative, 10: highly aggressive).
    - riskCategory: A string label (e.g., Conservative, Moderate, Aggressive, Ultra-Aggressive).
    - diversificationAnalysis: A 3-sentence summary of how well-diversified the holdings are across the technology and automotive sectors.
    - recommendations: An array of 3 specific, actionable recommendations (e.g., sector allocation, hedging, dividend stocks).
    - sectorOutlook: A 2-sentence outlook on the technology/semiconductor sectors based on current trends.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    let analysisResult;
    try {
      analysisResult = JSON.parse(resultText);
    } catch {
      analysisResult = {
        riskScore: 6,
        riskCategory: "Moderate Growth",
        diversificationAnalysis: "Your portfolio has heavy exposure to large-cap technology stocks which offers high growth but elevates sector risk. Adding defensive assets would optimize balancing.",
        recommendations: [
          "Diversify into financial or defensive sectors like consumer staples.",
          "Add dividend-yielding companies to build cash flow buffers.",
          "Set up trailing price alerts for highly volatile assets."
        ],
        sectorOutlook: "Technology continues to lead market momentum with enterprise AI infrastructure. Semiconductors remain highly volatile with long-term upward tailwinds."
      };
    }

    // Save report to AI history
    const historyItem: AIHistoryItem = {
      id: "ai-" + Math.random().toString(36).substr(2, 9),
      userId,
      type: "ANALYSIS",
      prompt: "Portfolio Risk & Diversification Analysis",
      response: JSON.stringify(analysisResult),
      date: new Date().toISOString()
    };

    db.aiHistory.push(historyItem);
    await saveDb(db);

    res.json({ analysis: analysisResult, savedId: historyItem.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not complete AI analysis" });
  }
});

// 2. Generate Portfolio Weekly Summary
router.post("/weekly-summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;
    const userTxs = db.transactions.filter((tx) => tx.userId === userId);
    const holdings = computeHoldings(userTxs);

    const portfolioSummary = holdings
      .map((h) => `${h.ticker}: ${h.shares} shares @ cost $${h.avgBuyPrice}`)
      .join(", ");

    const recentTxs = userTxs
      .slice(0, 5)
      .map((t) => `${t.type} ${t.shares} ${t.ticker} @ $${t.price}`)
      .join(", ");

    const prompt = `Generate a high-fidelity 'Weekly Portfolio Performance and Market Summary' for a retail investor.
    Holdings: ${portfolioSummary || "None"}
    Recent Transactions: ${recentTxs || "No recent activity"}
    
    Structure your answer in a clean JSON format with these exact keys:
    - title: A catchy fintech-style report title (e.g., 'Weekly Recap: Tech-Heavy Position Overview').
    - summaryText: A 4-sentence overview of the investor's current positioning and general stock market trends.
    - sentiment: The overall mood of their portfolio ('Bullish', 'Bearish', or 'Neutral').
    - marketCatalysts: An array of 3 bullet points discussing current interest rates, inflation indicators, and earnings results.`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    let summaryResult;
    try {
      summaryResult = JSON.parse(resultText);
    } catch {
      summaryResult = {
        title: "Weekly Recap: Growth-Oriented Asset Allocation",
        summaryText: "Your portfolio holdings reflect a strategic, high-growth posture heavily leveraged towards hardware and cloud computing giants. The market remains resilient as corporate earnings exceed forecasts, supporting valuation expansions. Tech giants continue to benefit from defensive cash flow profiles despite elevated valuations.",
        sentiment: "Bullish",
        marketCatalysts: [
          "Cooling core inflation metrics fuel expectations of interest rate cuts.",
          "AI cloud capital expenditures reach all-time highs as software adoption accelerates.",
          "Retail investment sentiment hits strong positive levels, sustaining trading volumes."
        ]
      };
    }

    const historyItem: AIHistoryItem = {
      id: "ai-" + Math.random().toString(36).substr(2, 9),
      userId,
      type: "WEEKLY_SUMMARY",
      prompt: "Weekly Portfolio Summary",
      response: JSON.stringify(summaryResult),
      date: new Date().toISOString()
    };

    db.aiHistory.push(historyItem);
    await saveDb(db);

    res.json({ summary: summaryResult, savedId: historyItem.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not generate weekly summary" });
  }
});

// 3. Interactive financial Q&A chatbot
router.post("/chat", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: h.content }]
    }));

    const ai = getAiClient();
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: formattedHistory,
      config: {
        systemInstruction: "You are StockPilot Assistant, a friendly and highly knowledgeable fintech AI stock advisor and market analyst. Help users explain complex financial terms (e.g., P/E Ratio, Market Cap, Option Greeks), evaluate portfolio diversification, summarize stock news, and give general educational advice. Never provide direct buy/sell recommendations, and include a short financial disclaimer when appropriate."
      }
    });

    const response = await chat.sendMessage({ message });
    res.json({ reply: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "AI Chat failed to respond" });
  }
});

// 4. Get saved AI history
router.get("/history", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;
    const history = db.aiHistory
      .filter((h) => h.userId === userId)
      .map((h) => ({
        id: h.id,
        type: h.type,
        prompt: h.prompt,
        response: JSON.parse(h.response),
        date: h.date
      }));

    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;

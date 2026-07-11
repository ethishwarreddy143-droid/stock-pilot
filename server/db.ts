// NOTE: This module uses a purely in-memory database for serverless compatibility (Netlify Functions).
// Data is seeded from initialDb on first access and does not persist across cold starts.

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  verified: boolean;
  verificationCode?: string;
  resetCode?: string;
  watchlist: string[];
  alerts: {
    id: string;
    type: "PRICE" | "NEWS" | "AI";
    ticker?: string;
    targetPrice?: number;
    condition?: "ABOVE" | "BELOW";
    active: boolean;
    message: string;
    date: string;
  }[];
  profileImage?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "BUY" | "SELL";
  ticker: string;
  shares: number;
  price: number;
  date: string;
}

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface AIHistoryItem {
  id: string;
  userId: string;
  type: "ANALYSIS" | "DIVERSIFICATION" | "WEEKLY_SUMMARY";
  prompt: string;
  response: string;
  date: string;
}

export interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  feedbacks: Feedback[];
  aiHistory: AIHistoryItem[];
}

function makeInitialDb(): DatabaseSchema {
  return {
    users: [
      {
        id: "admin-1",
        email: "admin@stockpilot.com",
        passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
        name: "StockPilot Admin",
        role: "admin",
        verified: true,
        watchlist: ["AAPL", "MSFT", "GOOG", "TSLA", "NVDA"],
        alerts: [
          {
            id: "alert-1",
            type: "PRICE",
            ticker: "AAPL",
            targetPrice: 200,
            condition: "ABOVE",
            active: true,
            message: "AAPL broke above $200 resistance level.",
            date: new Date().toISOString()
          }
        ]
      },
      {
        id: "user-1",
        email: "demo@stockpilot.com",
        passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        name: "Demo Investor",
        role: "user",
        verified: true,
        watchlist: ["AAPL", "TSLA", "NVDA"],
        alerts: []
      }
    ],
    transactions: [
      {
        id: "tx-1",
        userId: "user-1",
        type: "BUY",
        ticker: "AAPL",
        shares: 10,
        price: 175.50,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "tx-2",
        userId: "user-1",
        type: "BUY",
        ticker: "TSLA",
        shares: 15,
        price: 220.00,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "tx-3",
        userId: "user-1",
        type: "BUY",
        ticker: "NVDA",
        shares: 25,
        price: 110.25,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    feedbacks: [
      {
        id: "fb-1",
        name: "Sarah Jenkins",
        email: "sarah@gmail.com",
        message: "The AI Portfolio Analyzer is incredible! Saved me hours of research.",
        date: new Date().toISOString()
      }
    ],
    aiHistory: []
  };
}

// In-memory DB — shared within a single function invocation
let dbCache: DatabaseSchema | null = null;

export async function getDb(): Promise<DatabaseSchema> {
  if (!dbCache) {
    dbCache = makeInitialDb();
  }
  return dbCache;
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  // In serverless mode, just update the in-memory cache (no filesystem writes)
  dbCache = data;
}

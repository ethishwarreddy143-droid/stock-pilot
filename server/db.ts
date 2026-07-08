import { promises as fs } from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "server_db.json");

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

const initialDb: DatabaseSchema = {
  users: [
    {
      id: "admin-1",
      email: "admin@stockpilot.com",
      // sha256 hash for 'admin123' combined with salt
      passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // 'admin123'
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
      passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // 'password'
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
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    },
    {
      id: "tx-2",
      userId: "user-1",
      type: "BUY",
      ticker: "TSLA",
      shares: 15,
      price: 220.00,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
    },
    {
      id: "tx-3",
      userId: "user-1",
      type: "BUY",
      ticker: "NVDA",
      shares: 25,
      price: 110.25,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
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

let dbCache: DatabaseSchema | null = null;

export async function getDb(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    dbCache = JSON.parse(data);
    return dbCache!;
  } catch (err) {
    // If doesn't exist, create it
    await saveDb(initialDb);
    dbCache = initialDb;
    return dbCache;
  }
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

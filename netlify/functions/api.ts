/**
 * Netlify Function: api.ts
 * Single entry-point that handles all /api/* routes by porting
 * the Express route logic into a serverless-compatible handler.
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import crypto from "crypto";

// ─── Crypto Utils ────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "stockpilot_secret_key_67890";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(payload: object, expiryHours = 24): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiryHours * 60 * 60;
  const fullPayload = { ...payload, exp };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
  return `${signatureInput}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const signatureInput = `${header}.${payload}`;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) return null;
    return decodedPayload;
  } catch {
    return null;
  }
}

// ─── In-Memory Database ───────────────────────────────────────────────────────

interface User {
  id: string; email: string; passwordHash: string; name: string;
  role: "user" | "admin"; verified: boolean; verificationCode?: string;
  resetCode?: string; watchlist: string[];
  alerts: { id: string; type: "PRICE"|"NEWS"|"AI"; ticker?: string; targetPrice?: number; condition?: "ABOVE"|"BELOW"; active: boolean; message: string; date: string; }[];
  profileImage?: string;
}
interface Transaction { id: string; userId: string; type: "BUY"|"SELL"; ticker: string; shares: number; price: number; date: string; }
interface Feedback { id: string; name: string; email: string; message: string; date: string; }
interface AIHistoryItem { id: string; userId: string; type: string; prompt: string; response: string; date: string; }
interface DB { users: User[]; transactions: Transaction[]; feedbacks: Feedback[]; aiHistory: AIHistoryItem[]; }

let _db: DB | null = null;

function getDb(): DB {
  if (_db) return _db;
  _db = {
    users: [
      { id: "admin-1", email: "admin@stockpilot.com", passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", name: "StockPilot Admin", role: "admin", verified: true, watchlist: ["AAPL","MSFT","GOOG","TSLA","NVDA"], alerts: [{ id: "alert-1", type: "PRICE", ticker: "AAPL", targetPrice: 200, condition: "ABOVE", active: true, message: "AAPL broke above $200 resistance level.", date: new Date().toISOString() }] },
      { id: "user-1", email: "demo@stockpilot.com", passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", name: "Demo Investor", role: "user", verified: true, watchlist: ["AAPL","TSLA","NVDA"], alerts: [] }
    ],
    transactions: [
      { id: "tx-1", userId: "user-1", type: "BUY", ticker: "AAPL", shares: 10, price: 175.50, date: new Date(Date.now() - 30*24*60*60*1000).toISOString() },
      { id: "tx-2", userId: "user-1", type: "BUY", ticker: "TSLA", shares: 15, price: 220.00, date: new Date(Date.now() - 15*24*60*60*1000).toISOString() },
      { id: "tx-3", userId: "user-1", type: "BUY", ticker: "NVDA", shares: 25, price: 110.25, date: new Date(Date.now() - 5*24*60*60*1000).toISOString() }
    ],
    feedbacks: [{ id: "fb-1", name: "Sarah Jenkins", email: "sarah@gmail.com", message: "The AI Portfolio Analyzer is incredible! Saved me hours of research.", date: new Date().toISOString() }],
    aiHistory: []
  };
  return _db;
}

// ─── Stocks Data ─────────────────────────────────────────────────────────────

const STOCKS_DB: Record<string, any> = {
  AAPL: { ticker: "AAPL", name: "Apple Inc.", basePrice: 224.50, open: 223.10, high: 225.80, low: 222.90, marketCap: "3.45 Trillion", peRatio: 31.2, dividendYield: 0.45, fiftyTwoWeekHigh: 237.49, fiftyTwoWeekLow: 164.08, description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.", sector: "Technology / Consumer Electronics", ceo: "Tim Cook", employees: 164000 },
  MSFT: { ticker: "MSFT", name: "Microsoft Corporation", basePrice: 418.20, open: 417.00, high: 420.50, low: 416.30, marketCap: "3.11 Trillion", peRatio: 35.8, dividendYield: 0.72, fiftyTwoWeekHigh: 468.35, fiftyTwoWeekLow: 328.60, description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.", sector: "Technology / Systems Software", ceo: "Satya Nadella", employees: 221000 },
  GOOG: { ticker: "GOOG", name: "Alphabet Inc.", basePrice: 178.60, open: 177.50, high: 179.90, low: 176.80, marketCap: "2.22 Trillion", peRatio: 26.4, dividendYield: 0.45, fiftyTwoWeekHigh: 193.31, fiftyTwoWeekLow: 121.22, description: "Alphabet Inc. provides Google Search, Android, Chrome, Gmail, Google Drive, Google Maps, Google Play, and YouTube.", sector: "Technology / Internet Content & Information", ceo: "Sundar Pichai", employees: 182000 },
  TSLA: { ticker: "TSLA", name: "Tesla, Inc.", basePrice: 248.30, open: 245.20, high: 251.40, low: 243.00, marketCap: "792.40 Billion", peRatio: 64.3, dividendYield: 0.00, fiftyTwoWeekHigh: 271.00, fiftyTwoWeekLow: 138.80, description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.", sector: "Automotive / Electric Vehicles", ceo: "Elon Musk", employees: 140000 },
  NVDA: { ticker: "NVDA", name: "NVIDIA Corporation", basePrice: 128.40, open: 126.80, high: 130.20, low: 125.50, marketCap: "3.15 Trillion", peRatio: 72.8, dividendYield: 0.03, fiftyTwoWeekHigh: 140.76, fiftyTwoWeekLow: 45.01, description: "NVIDIA Corporation focuses on personal computer graphics, GPUs, and AI solutions.", sector: "Technology / Semiconductors", ceo: "Jensen Huang", employees: 29600 },
  AMZN: { ticker: "AMZN", name: "Amazon.com, Inc.", basePrice: 189.10, open: 188.00, high: 191.30, low: 187.50, marketCap: "1.97 Trillion", peRatio: 40.5, dividendYield: 0.00, fiftyTwoWeekHigh: 201.20, fiftyTwoWeekLow: 118.35, description: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.", sector: "Consumer Cyclical / Internet Retail", ceo: "Andy Jassy", employees: 1541000 },
  NFLX: { ticker: "NFLX", name: "Netflix, Inc.", basePrice: 654.80, open: 650.20, high: 659.50, low: 648.00, marketCap: "282.40 Billion", peRatio: 42.1, dividendYield: 0.00, fiftyTwoWeekHigh: 697.49, fiftyTwoWeekLow: 341.00, description: "Netflix, Inc. provides entertainment services with paid memberships in approximately 190 countries.", sector: "Communication Services / Entertainment", ceo: "Ted Sarandos", employees: 13000 }
};

function getLivePrice(ticker: string) {
  const stock = STOCKS_DB[ticker];
  if (!stock) return { price: 100, change: 0, changePercent: 0 };
  const seconds = new Date().getSeconds();
  const minute = new Date().getMinutes();
  const wave = Math.sin(seconds / 10) * 0.4 + Math.cos(minute / 5) * 0.8;
  const price = Number((stock.basePrice + wave).toFixed(2));
  const change = Number((price - stock.open).toFixed(2));
  const changePercent = Number(((change / stock.open) * 100).toFixed(2));
  return { price, change, changePercent };
}

// ─── Portfolio Helpers ────────────────────────────────────────────────────────

function computeHoldings(transactions: Transaction[]) {
  const holdingsMap: Record<string, { totalShares: number; totalCost: number }> = {};
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const tx of sorted) {
    const ticker = tx.ticker.toUpperCase();
    if (!holdingsMap[ticker]) holdingsMap[ticker] = { totalShares: 0, totalCost: 0 };
    const h = holdingsMap[ticker];
    if (tx.type === "BUY") { h.totalShares += tx.shares; h.totalCost += tx.shares * tx.price; }
    else { const avg = h.totalShares > 0 ? h.totalCost / h.totalShares : 0; h.totalShares = Math.max(0, h.totalShares - tx.shares); h.totalCost = h.totalShares * avg; }
  }
  return Object.entries(holdingsMap).filter(([, d]) => d.totalShares > 0).map(([ticker, d]) => ({
    ticker, name: STOCKS_DB[ticker]?.name || ticker,
    shares: Number(d.totalShares.toFixed(4)),
    avgBuyPrice: Number((d.totalCost / d.totalShares).toFixed(2))
  }));
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

function getAuthUser(headers: Record<string, string | undefined>): User | null {
  const auth = headers["authorization"] || headers["Authorization"] || "";
  if (!auth.startsWith("Bearer ")) return null;
  const payload = verifyToken(auth.split(" ")[1]);
  if (!payload) return null;
  const db = getDb();
  return db.users.find(u => u.id === payload.id) || null;
}

function requireAuth(headers: Record<string, string | undefined>): { user: User } | { error: string; status: number } {
  const user = getAuthUser(headers);
  if (!user) return { error: "Access denied. No valid token provided.", status: 401 };
  return { user };
}

function requireAdmin(headers: Record<string, string | undefined>): { user: User } | { error: string; status: number } {
  const result = requireAuth(headers);
  if ("error" in result) return result;
  if (result.user.role !== "admin") return { error: "Access denied. Administrator privileges required.", status: 403 };
  return result;
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

function ok(body: object, status = 200) {
  return { statusCode: status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) };
}
function err(message: string, status = 400) {
  return { statusCode: status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: message }) };
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

async function handleAuth(method: string, subPath: string, body: any, headers: Record<string, string | undefined>) {
  const db = getDb();

  // POST /auth/register
  if (method === "POST" && subPath === "/register") {
    const { email, password, name } = body;
    if (!email || !password || !name) return err("Name, email, and password are required.");
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return err("An account with this email already exists.");
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newUser: User = { id: "user-" + Math.random().toString(36).substr(2, 9), email: email.toLowerCase(), passwordHash: hashPassword(password), name, role: "user", verified: false, verificationCode, watchlist: ["AAPL", "MSFT", "GOOG"], alerts: [] };
    db.users.push(newUser);
    return ok({ message: "Registration successful. Please verify your email.", userId: newUser.id, email: newUser.email, verificationCode }, 201);
  }

  // POST /auth/verify-email
  if (method === "POST" && subPath === "/verify-email") {
    const { email, code } = body;
    if (!email || !code) return err("Email and verification code are required.");
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return err("User not found.", 404);
    if (user.verified) return ok({ message: "Email is already verified." });
    if (user.verificationCode !== code) return err("Invalid verification code.");
    user.verified = true; user.verificationCode = undefined;
    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    return ok({ message: "Email verified successfully.", token, user: { id: user.id, email: user.email, name: user.name, role: user.role, watchlist: user.watchlist, profileImage: user.profileImage } });
  }

  // POST /auth/login
  if (method === "POST" && subPath === "/login") {
    const { email, password } = body;
    if (!email || !password) return err("Email and password are required.");
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) return err("Invalid email or password.");
    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    return ok({ message: "Login successful.", token, user: { id: user.id, email: user.email, name: user.name, role: user.role, verified: user.verified, watchlist: user.watchlist, profileImage: user.profileImage } });
  }

  // POST /auth/forgot-password
  if (method === "POST" && subPath === "/forgot-password") {
    const { email } = body;
    if (!email) return err("Email is required.");
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return err("User with this email does not exist.", 404);
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    return ok({ message: "Password reset code sent.", email: user.email, resetCode });
  }

  // POST /auth/reset-password
  if (method === "POST" && subPath === "/reset-password") {
    const { email, code, newPassword } = body;
    if (!email || !code || !newPassword) return err("Email, code, and new password are required.");
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return err("User not found.", 404);
    if (user.resetCode !== code) return err("Invalid password reset code.");
    user.passwordHash = hashPassword(newPassword); user.resetCode = undefined;
    return ok({ message: "Password reset successfully. You can now log in." });
  }

  // GET /auth/profile
  if (method === "GET" && subPath === "/profile") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, verified: user.verified, watchlist: user.watchlist, profileImage: user.profileImage, alerts: user.alerts } });
  }

  // POST /auth/change-password
  if (method === "POST" && subPath === "/change-password") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword) return err("Current and new passwords are required.");
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    if (!verifyPassword(oldPassword, user.passwordHash)) return err("Incorrect current password.");
    user.passwordHash = hashPassword(newPassword);
    return ok({ message: "Password changed successfully." });
  }

  // POST /auth/update-profile
  if (method === "POST" && subPath === "/update-profile") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const { name, profileImage } = body;
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;
    return ok({ message: "Profile updated successfully.", user: { id: user.id, email: user.email, name: user.name, role: user.role, verified: user.verified, watchlist: user.watchlist, profileImage: user.profileImage } });
  }

  return err("Not found.", 404);
}

async function handleStocks(method: string, subPath: string, body: any, headers: Record<string, string | undefined>, queryParams: Record<string, string>) {
  const db = getDb();

  // GET /stocks/market-summary
  if (method === "GET" && subPath === "/market-summary") {
    const gainers = ["NVDA","AAPL","TSLA"].map(t => ({ ticker: t, name: STOCKS_DB[t].name, ...getLivePrice(t) })).sort((a,b) => b.changePercent - a.changePercent);
    const losers = ["MSFT","GOOG","AMZN"].map(t => ({ ticker: t, name: STOCKS_DB[t].name, ...getLivePrice(t) })).sort((a,b) => a.changePercent - b.changePercent);
    return ok({ indices: { SP500: { price: 5432.50, change: 18.20, changePercent: 0.34 }, NASDAQ: { price: 17855.40, change: 105.60, changePercent: 0.60 }, DOW: { price: 39560.10, change: -45.30, changePercent: -0.11 } }, topGainers: gainers, topLosers: losers, news: [{ id: "news-1", title: "Federal Reserve hints at future rate stability as inflation pressures cool", source: "Financial Times", date: "2 hours ago", summary: "The Fed leaves interest rates unchanged, noting positive progress on core consumer prices.", sentiment: "positive", category: "Macro" }, { id: "news-2", title: "AI Infrastructure spending surges to record heights, tech leaders report", source: "Bloomberg", date: "4 hours ago", summary: "Capital expenditures for datacenter scale-outs hit new records, boosting semiconductor stocks.", sentiment: "positive", category: "Tech" }, { id: "news-3", title: "EV market faces regulatory headwinds as global supply lines shift", source: "Wall Street Journal", date: "6 hours ago", summary: "Battery supply chain rules challenge automakers preparing new electric car models.", sentiment: "negative", category: "Automotive" }] });
  }

  // GET /stocks/search
  if (method === "GET" && subPath === "/search") {
    const query = (queryParams.q || "").toUpperCase();
    const results = Object.values(STOCKS_DB).filter(s => s.ticker.includes(query) || s.name.toUpperCase().includes(query)).map(s => ({ ticker: s.ticker, name: s.name, sector: s.sector, price: getLivePrice(s.ticker).price }));
    return ok({ results });
  }

  // GET /stocks/watchlist
  if (method === "GET" && subPath === "/watchlist") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    const watchlistDetails = user.watchlist.map(ticker => { const stock = STOCKS_DB[ticker]; if (!stock) return null; return { ticker, name: stock.name, sector: stock.sector, ...getLivePrice(ticker) }; }).filter(Boolean);
    return ok({ watchlist: watchlistDetails });
  }

  // POST /stocks/watchlist/add
  if (method === "POST" && subPath === "/watchlist/add") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const { ticker } = body;
    if (!ticker) return err("Stock ticker is required.");
    const t = ticker.toUpperCase();
    if (!STOCKS_DB[t]) return err("Ticker not supported. Choose AAPL, MSFT, GOOG, TSLA, NVDA, AMZN or NFLX.");
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    if (!user.watchlist.includes(t)) user.watchlist.push(t);
    return ok({ message: "Stock added to watchlist successfully.", watchlist: user.watchlist });
  }

  // POST /stocks/watchlist/remove
  if (method === "POST" && subPath === "/watchlist/remove") {
    const auth = requireAuth(headers);
    if ("error" in auth) return err(auth.error, auth.status);
    const { ticker } = body;
    if (!ticker) return err("Stock ticker is required.");
    const t = ticker.toUpperCase();
    const user = db.users.find(u => u.id === auth.user.id);
    if (!user) return err("User not found.", 404);
    user.watchlist = user.watchlist.filter(w => w !== t);
    return ok({ message: "Stock removed from watchlist successfully.", watchlist: user.watchlist });
  }

  // GET /stocks/details/:ticker
  const detailMatch = subPath.match(/^\/details\/([A-Z]+)$/);
  if (method === "GET" && detailMatch) {
    const ticker = detailMatch[1];
    const stock = STOCKS_DB[ticker];
    if (!stock) return err("Stock ticker not supported. Please use AAPL, MSFT, GOOG, TSLA, NVDA, AMZN or NFLX.", 404);
    const live = getLivePrice(ticker);
    const range = queryParams.range || "1M";
    const count = range === "1D" ? 24 : range === "1W" ? 7 : range === "1M" ? 30 : 12;
    const now = Date.now();
    const chartData = Array.from({ length: count + 1 }, (_, i) => {
      const idx = count - i;
      const pointDate = new Date(now - idx * (range === "1D" ? 3600000 : range === "1W" ? 86400000 : range === "1M" ? 86400000 : 2592000000));
      const dateStr = range === "1D" ? pointDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : pointDate.toLocaleDateString([], { month: "short", day: "numeric" });
      const priceSeed = stock.basePrice + Math.sin(idx / 3) * (stock.basePrice * 0.05) + Math.cos(idx / 2) * (stock.basePrice * 0.02);
      return { date: dateStr, price: Number((idx === 0 ? live.price : priceSeed).toFixed(2)), volume: Math.floor(100000 + Math.random() * 900000) };
    });
    return ok({ profile: stock, live, chartData, financials: { revenue: ["$120.5B","$124.3B","$132.1B"], netIncome: ["$24.2B","$26.1B","$28.5B"], eps: ["$1.52","$1.68","$1.85"], years: ["2024","2025","2026 (Est)"] }, news: [{ id: `${ticker}-news-1`, title: `${stock.name} releases quarterly product cycle and supply chain roadmap`, source: "Reuters", date: "3 hours ago", summary: `Industry sources report strong baseline purchase commitments for ${stock.name}'s upcoming offerings.`, sentiment: "positive" }, { id: `${ticker}-news-2`, title: `Analysts adjust price targets for ${stock.name} following latest industry data`, source: "MarketWatch", date: "1 day ago", summary: `Several investment firms upgraded their sentiment score for ${ticker} citing efficient cost optimizations.`, sentiment: "positive" }] });
  }

  return err("Not found.", 404);
}

async function handlePortfolio(method: string, subPath: string, body: any, headers: Record<string, string | undefined>, queryParams: Record<string, string>) {
  const auth = requireAuth(headers);
  if ("error" in auth) return err(auth.error, auth.status);
  const db = getDb();
  const userId = auth.user.id;

  // GET /portfolio/summary
  if (method === "GET" && subPath === "/summary") {
    const userTxs = db.transactions.filter(tx => tx.userId === userId);
    const holdings = computeHoldings(userTxs);
    let totalCurrentValue = 0, totalInvestmentCost = 0, totalTodayOpenValue = 0;
    const holdingDetails = holdings.map(h => {
      const live = getLivePrice(h.ticker);
      const currentValue = h.shares * live.price;
      const investmentCost = h.shares * h.avgBuyPrice;
      const profitLoss = currentValue - investmentCost;
      const profitLossPercent = investmentCost > 0 ? (profitLoss / investmentCost) * 100 : 0;
      const stock = STOCKS_DB[h.ticker];
      const todayOpenValue = h.shares * (stock ? stock.open : h.avgBuyPrice);
      totalCurrentValue += currentValue; totalInvestmentCost += investmentCost; totalTodayOpenValue += todayOpenValue;
      return { ...h, currentPrice: live.price, currentValue: Number(currentValue.toFixed(2)), investmentCost: Number(investmentCost.toFixed(2)), profitLoss: Number(profitLoss.toFixed(2)), profitLossPercent: Number(profitLossPercent.toFixed(2)), changePercentToday: live.changePercent };
    });
    const totalProfitLoss = totalCurrentValue - totalInvestmentCost;
    const todayProfitLoss = totalCurrentValue - totalTodayOpenValue;
    const allocations = holdingDetails.map(h => ({ name: h.ticker, value: Number(h.currentValue.toFixed(2)), percentage: totalCurrentValue > 0 ? Number(((h.currentValue / totalCurrentValue) * 100).toFixed(2)) : 0 }));
    return ok({ totalValue: Number(totalCurrentValue.toFixed(2)), totalInvestment: Number(totalInvestmentCost.toFixed(2)), totalProfitLoss: Number(totalProfitLoss.toFixed(2)), totalProfitLossPercent: totalInvestmentCost > 0 ? Number(((totalProfitLoss / totalInvestmentCost) * 100).toFixed(2)) : 0, todayProfitLoss: Number(todayProfitLoss.toFixed(2)), todayProfitLossPercent: totalTodayOpenValue > 0 ? Number(((todayProfitLoss / totalTodayOpenValue) * 100).toFixed(2)) : 0, holdings: holdingDetails, allocations });
  }

  // GET /portfolio/transactions
  if (method === "GET" && subPath === "/transactions") {
    let userTxs = db.transactions.filter(tx => tx.userId === userId);
    if (queryParams.ticker) userTxs = userTxs.filter(tx => tx.ticker === queryParams.ticker.toUpperCase());
    userTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return ok({ transactions: userTxs });
  }

  // POST /portfolio/buy
  if (method === "POST" && subPath === "/buy") {
    const { ticker, shares, price, date } = body;
    if (!ticker || !shares || !price) return err("Ticker, shares quantity, and share purchase price are required.");
    const t = ticker.toUpperCase();
    if (!STOCKS_DB[t]) return err("Stock ticker not supported.");
    if (Number(shares) <= 0 || Number(price) <= 0) return err("Shares and price must be greater than 0.");
    const newTx: Transaction = { id: "tx-" + Math.random().toString(36).substr(2, 9), userId, type: "BUY", ticker: t, shares: Number(shares), price: Number(price), date: date ? new Date(date).toISOString() : new Date().toISOString() };
    db.transactions.push(newTx);
    return ok({ message: `Successfully bought ${shares} shares of ${t}.`, transaction: newTx }, 201);
  }

  // POST /portfolio/sell
  if (method === "POST" && subPath === "/sell") {
    const { ticker, shares, price, date } = body;
    if (!ticker || !shares || !price) return err("Ticker, shares quantity, and sell price are required.");
    const t = ticker.toUpperCase();
    const userTxs = db.transactions.filter(tx => tx.userId === userId);
    const holdings = computeHoldings(userTxs);
    const holding = holdings.find(h => h.ticker === t);
    if (!holding || holding.shares < Number(shares)) return err(`Insufficient shares. You only own ${holding ? holding.shares : 0} shares of ${t}.`);
    const newTx: Transaction = { id: "tx-" + Math.random().toString(36).substr(2, 9), userId, type: "SELL", ticker: t, shares: Number(shares), price: Number(price), date: date ? new Date(date).toISOString() : new Date().toISOString() };
    db.transactions.push(newTx);
    return ok({ message: `Successfully sold ${shares} shares of ${t}.`, transaction: newTx }, 201);
  }

  // POST /portfolio/edit-holding
  if (method === "POST" && subPath === "/edit-holding") {
    const { ticker, shares, avgBuyPrice } = body;
    if (!ticker || shares === undefined || avgBuyPrice === undefined) return err("Ticker, shares, and average buy price are required.");
    const t = ticker.toUpperCase();
    db.transactions = db.transactions.filter(tx => !(tx.userId === userId && tx.ticker === t));
    if (Number(shares) > 0) db.transactions.push({ id: "tx-" + Math.random().toString(36).substr(2, 9), userId, type: "BUY", ticker: t, shares: Number(shares), price: Number(avgBuyPrice), date: new Date().toISOString() });
    return ok({ message: `Holding for ${t} adjusted successfully.` });
  }

  // DELETE /portfolio/holding/:ticker
  const deleteMatch = subPath.match(/^\/holding\/([A-Z]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const ticker = deleteMatch[1];
    db.transactions = db.transactions.filter(tx => !(tx.userId === userId && tx.ticker === ticker));
    return ok({ message: `All transactions for ${ticker} deleted. Holding cleared.` });
  }

  // GET /portfolio/export-csv
  if (method === "GET" && subPath === "/export-csv") {
    const userTxs = db.transactions.filter(tx => tx.userId === userId);
    const rows = [["TransactionID","Type","Ticker","Shares","Price","Date"].join(","), ...userTxs.map(tx => [tx.id, tx.type, tx.ticker, tx.shares, tx.price, tx.date].join(","))].join("\n");
    return { statusCode: 200, headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=transactions.csv", "Access-Control-Allow-Origin": "*" }, body: rows };
  }

  // POST /portfolio/import-csv
  if (method === "POST" && subPath === "/import-csv") {
    const { csvData } = body;
    if (!csvData) return err("CSV data is required.");
    const lines = csvData.split("\n");
    if (lines.length <= 1) return err("Empty or invalid CSV file.");
    const newTxs: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim(); if (!line) continue;
      const [type, ticker, shares, price, date] = line.split(",");
      if (!type || !ticker || !shares || !price) continue;
      const t = ticker.toUpperCase().trim();
      if (!STOCKS_DB[t]) continue;
      newTxs.push({ id: "tx-imported-" + Math.random().toString(36).substr(2, 9), userId, type: type.toUpperCase().trim() === "SELL" ? "SELL" : "BUY", ticker: t, shares: Number(shares), price: Number(price), date: date ? new Date(date).toISOString() : new Date().toISOString() });
    }
    if (newTxs.length === 0) return err("No valid transactions imported. Check stock tickers.");
    db.transactions.push(...newTxs);
    return ok({ message: `Successfully imported ${newTxs.length} transactions.`, count: newTxs.length });
  }

  return err("Not found.", 404);
}

async function handleAI(method: string, subPath: string, body: any, headers: Record<string, string | undefined>) {
  const auth = requireAuth(headers);
  if ("error" in auth) return err(auth.error, auth.status);
  const db = getDb();
  const userId = auth.user.id;

  if (subPath === "/analyze" && method === "POST") {
    const userTxs = db.transactions.filter(tx => tx.userId === userId);
    const holdings = computeHoldings(userTxs);
    if (holdings.length === 0) return err("Your portfolio is empty. Add transactions first to generate an AI analysis.");
    const portfolioSummary = holdings.map(h => `${h.ticker}: ${h.shares} shares @ avg price $${h.avgBuyPrice}`).join(", ");

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: `As an expert AI Financial Advisor, perform a detailed Portfolio Diversification and Risk Analysis for this retail investor. Current holdings: ${portfolioSummary}. Structure your answer in a clean JSON format with these exact keys: riskScore (1-10), riskCategory (string), diversificationAnalysis (3-sentence string), recommendations (array of 3 strings), sectorOutlook (2-sentence string).`, config: { responseMimeType: "application/json" } });
      const analysisResult = JSON.parse(response.text || "{}");
      const historyItem = { id: "ai-" + Math.random().toString(36).substr(2, 9), userId, type: "ANALYSIS", prompt: "Portfolio Risk & Diversification Analysis", response: JSON.stringify(analysisResult), date: new Date().toISOString() };
      db.aiHistory.push(historyItem);
      return ok({ analysis: analysisResult, savedId: historyItem.id });
    } catch {
      const fallback = { riskScore: 6, riskCategory: "Moderate Growth", diversificationAnalysis: "Your portfolio has heavy exposure to large-cap technology stocks which offers high growth but elevates sector risk. Adding defensive assets would optimize balancing.", recommendations: ["Diversify into financial or defensive sectors like consumer staples.", "Add dividend-yielding companies to build cash flow buffers.", "Set up trailing price alerts for highly volatile assets."], sectorOutlook: "Technology continues to lead market momentum with enterprise AI infrastructure. Semiconductors remain highly volatile with long-term upward tailwinds." };
      const historyItem = { id: "ai-" + Math.random().toString(36).substr(2, 9), userId, type: "ANALYSIS", prompt: "Portfolio Risk & Diversification Analysis", response: JSON.stringify(fallback), date: new Date().toISOString() };
      db.aiHistory.push(historyItem);
      return ok({ analysis: fallback, savedId: historyItem.id });
    }
  }

  if (subPath === "/weekly-summary" && method === "POST") {
    const userTxs = db.transactions.filter(tx => tx.userId === userId);
    const holdings = computeHoldings(userTxs);
    const portfolioSummary = holdings.map(h => `${h.ticker}: ${h.shares} shares @ cost $${h.avgBuyPrice}`).join(", ");

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: `Generate a high-fidelity 'Weekly Portfolio Performance and Market Summary' for a retail investor. Holdings: ${portfolioSummary || "None"}. Structure your answer in JSON with keys: title (string), summaryText (4-sentence string), sentiment ('Bullish'|'Bearish'|'Neutral'), marketCatalysts (array of 3 strings).`, config: { responseMimeType: "application/json" } });
      const summaryResult = JSON.parse(response.text || "{}");
      const historyItem = { id: "ai-" + Math.random().toString(36).substr(2, 9), userId, type: "WEEKLY_SUMMARY", prompt: "Weekly Portfolio Summary", response: JSON.stringify(summaryResult), date: new Date().toISOString() };
      db.aiHistory.push(historyItem);
      return ok({ summary: summaryResult, savedId: historyItem.id });
    } catch {
      const fallback = { title: "Weekly Recap: Growth-Oriented Asset Allocation", summaryText: "Your portfolio holdings reflect a strategic, high-growth posture heavily leveraged towards hardware and cloud computing giants. The market remains resilient as corporate earnings exceed forecasts, supporting valuation expansions. Tech giants continue to benefit from defensive cash flow profiles despite elevated valuations.", sentiment: "Bullish", marketCatalysts: ["Cooling core inflation metrics fuel expectations of interest rate cuts.", "AI cloud capital expenditures reach all-time highs as software adoption accelerates.", "Retail investment sentiment hits strong positive levels, sustaining trading volumes."] };
      const historyItem = { id: "ai-" + Math.random().toString(36).substr(2, 9), userId, type: "WEEKLY_SUMMARY", prompt: "Weekly Portfolio Summary", response: JSON.stringify(fallback), date: new Date().toISOString() };
      db.aiHistory.push(historyItem);
      return ok({ summary: fallback, savedId: historyItem.id });
    }
  }

  if (subPath === "/chat" && method === "POST") {
    const { message, history } = body;
    if (!message) return err("Message is required.");
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");
      const ai = new GoogleGenAI({ apiKey });
      const formattedHistory = (history || []).map((h: any) => ({ role: h.role === "user" ? "user" as const : "model" as const, parts: [{ text: h.content }] }));
      const chat = ai.chats.create({ model: "gemini-2.0-flash", history: formattedHistory, config: { systemInstruction: "You are StockPilot Assistant, a friendly and highly knowledgeable fintech AI stock advisor and market analyst. Help users explain complex financial terms, evaluate portfolio diversification, summarize stock news, and give general educational advice. Never provide direct buy/sell recommendations, and include a short financial disclaimer when appropriate." } });
      const response = await chat.sendMessage({ message });
      return ok({ reply: response.text });
    } catch (e: any) {
      return err(e.message || "AI Chat failed to respond", 500);
    }
  }

  if (subPath === "/history" && method === "GET") {
    const history = db.aiHistory.filter(h => h.userId === userId).map(h => { try { return { id: h.id, type: h.type, prompt: h.prompt, response: JSON.parse(h.response), date: h.date }; } catch { return null; } }).filter(Boolean);
    return ok({ history });
  }

  return err("Not found.", 404);
}

async function handleNotifications(method: string, subPath: string, body: any, headers: Record<string, string | undefined>) {
  const auth = requireAuth(headers);
  if ("error" in auth) return err(auth.error, auth.status);
  const db = getDb();
  const user = db.users.find(u => u.id === auth.user.id);
  if (!user) return err("User not found.", 404);
  if (!user.alerts) user.alerts = [];

  // GET /notifications
  if (method === "GET" && subPath === "/") return ok({ alerts: user.alerts });

  // GET /notifications/check
  if (method === "GET" && subPath === "/check") {
    const triggered: any[] = [];
    for (const alert of user.alerts.filter(a => a.active && a.type === "PRICE")) {
      if (!alert.ticker || alert.targetPrice === undefined || !alert.condition) continue;
      const live = getLivePrice(alert.ticker);
      const isTriggered = (alert.condition === "ABOVE" && live.price >= alert.targetPrice) || (alert.condition === "BELOW" && live.price <= alert.targetPrice);
      if (isTriggered) { alert.active = false; alert.message = `Alert triggered! ${alert.ticker} is currently $${live.price} (Threshold was ${alert.condition.toLowerCase()} $${alert.targetPrice})`; triggered.push({ ...alert, currentPrice: live.price }); }
    }
    return ok({ triggeredAlerts: triggered });
  }

  // POST /notifications
  if (method === "POST" && subPath === "/") {
    const { type, ticker, targetPrice, condition } = body;
    if (!type || (type === "PRICE" && (!ticker || !targetPrice || !condition))) return err("Alert type, stock ticker, target price, and condition are required.");
    const t = ticker ? ticker.toUpperCase() : undefined;
    const newAlert = { id: "alert-" + Math.random().toString(36).substr(2, 9), type: type as any, ticker: t, targetPrice: targetPrice ? Number(targetPrice) : undefined, condition: condition as any, active: true, message: type === "PRICE" ? `Alert created for ${t} when price goes ${condition.toLowerCase()} $${targetPrice}.` : `Alert created for ${type.toLowerCase()} updates.`, date: new Date().toISOString() };
    user.alerts.unshift(newAlert);
    return ok({ message: "Alert created successfully.", alert: newAlert }, 201);
  }

  // PUT /notifications/:id/toggle
  const toggleMatch = subPath.match(/^\/([^/]+)\/toggle$/);
  if (method === "PUT" && toggleMatch) {
    const alertId = toggleMatch[1];
    const alert = user.alerts.find(a => a.id === alertId);
    if (!alert) return err("Alert not found.", 404);
    alert.active = !alert.active;
    return ok({ message: `Alert status toggled to ${alert.active ? "active" : "inactive"}.`, alert });
  }

  // DELETE /notifications/:id
  const deleteMatch = subPath.match(/^\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const alertId = deleteMatch[1];
    user.alerts = user.alerts.filter(a => a.id !== alertId);
    return ok({ message: "Alert deleted successfully." });
  }

  return err("Not found.", 404);
}

async function handleAdmin(method: string, subPath: string, body: any, headers: Record<string, string | undefined>) {
  const db = getDb();

  // POST /admin/feedback — public
  if (method === "POST" && subPath === "/feedback") {
    const { name, email, message } = body;
    if (!name || !email || !message) return err("Name, email, and message are required.");
    const newFeedback: Feedback = { id: "fb-" + Math.random().toString(36).substr(2, 9), name, email, message, date: new Date().toISOString() };
    db.feedbacks.unshift(newFeedback);
    return ok({ message: "Thank you for your feedback! Our team has received your message." }, 201);
  }

  const auth = requireAdmin(headers);
  if ("error" in auth) return err(auth.error, auth.status);

  if (method === "GET" && subPath === "/metrics") {
    const totalUsers = db.users.filter(u => u.role !== "admin").length;
    const totalAdmins = db.users.filter(u => u.role === "admin").length;
    const totalTrades = db.transactions.length;
    const feedbackCount = db.feedbacks.length;
    const portfolios: Record<string, number> = {};
    db.transactions.forEach(tx => { if (!portfolios[tx.userId]) portfolios[tx.userId] = 0; portfolios[tx.userId] += tx.type === "BUY" ? tx.shares * tx.price : -(tx.shares * tx.price); });
    const active = Object.values(portfolios).filter(v => v > 0);
    const totalCapitalInvested = active.reduce((a, b) => a + b, 0);
    return ok({ metrics: { totalUsers, totalAdmins, totalTrades, feedbackCount, totalCapitalInvested: Number(totalCapitalInvested.toFixed(2)), avgPortfolioValue: active.length > 0 ? Number((totalCapitalInvested / active.length).toFixed(2)) : 0 } });
  }

  if (method === "GET" && subPath === "/users") {
    return ok({ users: db.users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, verified: u.verified, watchlistCount: u.watchlist.length, alertsCount: (u.alerts || []).length })) });
  }

  if (method === "GET" && subPath === "/feedbacks") {
    return ok({ feedbacks: db.feedbacks });
  }

  const roleMatch = subPath.match(/^\/users\/([^/]+)\/role$/);
  if (method === "PUT" && roleMatch) {
    const { role } = body;
    if (role !== "user" && role !== "admin") return err("Invalid role. Role must be 'user' or 'admin'.");
    const user = db.users.find(u => u.id === roleMatch[1]);
    if (!user) return err("User not found.", 404);
    user.role = role;
    return ok({ message: `Successfully updated user role to ${role}.` });
  }

  return err("Not found.", 404);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" }, body: "" };
  }

  // Parse path: strip /.netlify/functions/api or /api prefix → get /auth/login etc.
  let rawPath = event.path || "/";
  rawPath = rawPath.replace(/^\/.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";

  // Parse query params
  const queryParams: Record<string, string> = {};
  if (event.queryStringParameters) {
    Object.assign(queryParams, event.queryStringParameters);
  }

  // Parse body
  let body: any = {};
  if (event.body) {
    try { body = JSON.parse(event.body); } catch { body = {}; }
  }

  const headers = event.headers as Record<string, string | undefined>;

  // Route to correct handler
  try {
    if (rawPath.startsWith("/auth")) return await handleAuth(method, rawPath.replace("/auth", "") || "/", body, headers);
    if (rawPath.startsWith("/stocks")) return await handleStocks(method, rawPath.replace("/stocks", "") || "/", body, headers, queryParams);
    if (rawPath.startsWith("/portfolio")) return await handlePortfolio(method, rawPath.replace("/portfolio", "") || "/", body, headers, queryParams);
    if (rawPath.startsWith("/ai")) return await handleAI(method, rawPath.replace("/ai", "") || "/", body, headers);
    if (rawPath.startsWith("/notifications")) return await handleNotifications(method, rawPath.replace("/notifications", "") || "/", body, headers);
    if (rawPath.startsWith("/admin")) return await handleAdmin(method, rawPath.replace("/admin", "") || "/", body, headers);
    if (rawPath === "/health" || rawPath === "") return ok({ status: "healthy", timestamp: new Date().toISOString() });
    return err("API route not found.", 404);
  } catch (e: any) {
    return err(e.message || "Internal server error", 500);
  }
};

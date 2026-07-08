export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  verified: boolean;
  watchlist: string[];
  profileImage?: string;
  alerts?: Alert[];
}

export interface LivePrice {
  price: number;
  change: number;
  changePercent: number;
}

export interface StockProfile {
  ticker: string;
  name: string;
  basePrice: number;
  open: number;
  high: number;
  low: number;
  marketCap: string;
  peRatio: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  description: string;
  sector: string;
  ceo: string;
  employees: number;
}

export interface StockDetailsResponse {
  profile: StockProfile;
  live: LivePrice;
  chartData: { date: string; price: number; volume: number }[];
  financials: {
    revenue: string[];
    netIncome: string[];
    eps: string[];
    years: string[];
  };
  news: {
    id: string;
    title: string;
    source: string;
    date: string;
    summary: string;
    sentiment: string;
  }[];
}

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice?: number;
  currentValue?: number;
  investmentCost?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  changePercentToday?: number;
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

export interface PortfolioSummary {
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  todayProfitLoss: number;
  todayProfitLossPercent: number;
  holdings: Holding[];
  allocations: { name: string; value: number; percentage: number }[];
}

export interface Alert {
  id: string;
  type: "PRICE" | "NEWS" | "AI";
  ticker?: string;
  targetPrice?: number;
  condition?: "ABOVE" | "BELOW";
  active: boolean;
  message: string;
  date: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface AIAnalysis {
  riskScore: number;
  riskCategory: string;
  diversificationAnalysis: string;
  recommendations: string[];
  sectorOutlook: string;
}

export interface AIWeeklySummary {
  title: string;
  summaryText: string;
  sentiment: string;
  marketCatalysts: string[];
}

export interface AIHistoryItem {
  id: string;
  type: "ANALYSIS" | "DIVERSIFICATION" | "WEEKLY_SUMMARY";
  prompt: string;
  response: any;
  date: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalAdmins: number;
  totalTrades: number;
  feedbackCount: number;
  totalCapitalInvested: number;
  avgPortfolioValue: number;
}

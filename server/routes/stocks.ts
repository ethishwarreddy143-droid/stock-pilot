import { Router } from "express";
import { getDb, saveDb } from "../db";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Static high-fidelity stock profiles & metrics
export interface StockDetail {
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

export const STOCKS_DB: Record<string, StockDetail> = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    basePrice: 224.50,
    open: 223.10,
    high: 225.80,
    low: 222.90,
    marketCap: "3.45 Trillion",
    peRatio: 31.2,
    dividendYield: 0.45,
    fiftyTwoWeekHigh: 237.49,
    fiftyTwoWeekLow: 164.08,
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its flagship product is the iPhone, supported by Services like Apple Pay, iCloud, and Apple Music.",
    sector: "Technology / Consumer Electronics",
    ceo: "Tim Cook",
    employees: 164000
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    basePrice: 418.20,
    open: 417.00,
    high: 420.50,
    low: 416.30,
    marketCap: "3.11 Trillion",
    peRatio: 35.8,
    dividendYield: 0.72,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 328.60,
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its Productivity and Business Processes segment includes Office, Exchange, SharePoint, Microsoft Teams, and LinkedIn.",
    sector: "Technology / Systems Software",
    ceo: "Satya Nadella",
    employees: 221000
  },
  GOOG: {
    ticker: "GOOG",
    name: "Alphabet Inc.",
    basePrice: 178.60,
    open: 177.50,
    high: 179.90,
    low: 176.80,
    marketCap: "2.22 Trillion",
    peRatio: 26.4,
    dividendYield: 0.45,
    fiftyTwoWeekHigh: 193.31,
    fiftyTwoWeekLow: 121.22,
    description: "Alphabet Inc. provides Google Search, Android, Chrome, Gmail, Google Drive, Google Maps, Google Play, Search, and YouTube. It also offers Google Cloud infrastructure and other advanced research segments like Waymo.",
    sector: "Technology / Internet Content & Information",
    ceo: "Sundar Pichai",
    employees: 182000
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    basePrice: 248.30,
    open: 245.20,
    high: 251.40,
    low: 243.00,
    marketCap: "792.40 Billion",
    peRatio: 64.3,
    dividendYield: 0.00,
    fiftyTwoWeekHigh: 271.00,
    fiftyTwoWeekLow: 138.80,
    description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally. It operates in Automotive and Energy segments.",
    sector: "Automotive / Electric Vehicles",
    ceo: "Elon Musk",
    employees: 140000
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    basePrice: 128.40,
    open: 126.80,
    high: 130.20,
    low: 125.50,
    marketCap: "3.15 Trillion",
    peRatio: 72.8,
    dividendYield: 0.03,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 45.01,
    description: "NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also AI solutions. It offers GPUs for gaming, enterprise visualization, datacenter workloads, and cloud machine learning applications.",
    sector: "Technology / Semiconductors",
    ceo: "Jensen Huang",
    employees: 29600
  },
  AMZN: {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    basePrice: 189.10,
    open: 188.00,
    high: 191.30,
    low: 187.50,
    marketCap: "1.97 Trillion",
    peRatio: 40.5,
    dividendYield: 0.00,
    fiftyTwoWeekHigh: 201.20,
    fiftyTwoWeekLow: 118.35,
    description: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS).",
    sector: "Consumer Cyclical / Internet Retail",
    ceo: "Andy Jassy",
    employees: 1541000
  },
  NFLX: {
    ticker: "NFLX",
    name: "Netflix, Inc.",
    basePrice: 654.80,
    open: 650.20,
    high: 659.50,
    low: 648.00,
    marketCap: "282.40 Billion",
    peRatio: 42.1,
    dividendYield: 0.00,
    fiftyTwoWeekHigh: 697.49,
    fiftyTwoWeekLow: 341.00,
    description: "Netflix, Inc. provides entertainment services with paid memberships in approximately 190 countries, offering TV series, documentaries, feature films, and mobile games across various genres and languages.",
    sector: "Communication Services / Entertainment",
    ceo: "Ted Sarandos",
    employees: 13000
  }
};

// Help get current dynamic price with slight randomized fluctuation
export function getLivePrice(ticker: string): { price: number; change: number; changePercent: number } {
  const stock = STOCKS_DB[ticker];
  if (!stock) {
    return { price: 100, change: 0, changePercent: 0 };
  }
  
  // Use current second/minute to generate a deterministic but live-looking variation
  const seconds = new Date().getSeconds();
  const minute = new Date().getMinutes();
  const wave = Math.sin(seconds / 10) * 0.4 + Math.cos(minute / 5) * 0.8;
  
  const price = Number((stock.basePrice + wave).toFixed(2));
  const change = Number((price - stock.open).toFixed(2));
  const changePercent = Number(((change / stock.open) * 100).toFixed(2));
  
  return { price, change, changePercent };
}

// Global market summary
router.get("/market-summary", (req, res) => {
  const gainers = [
    { ticker: "NVDA", name: "NVIDIA Corp.", ...getLivePrice("NVDA") },
    { ticker: "AAPL", name: "Apple Inc.", ...getLivePrice("AAPL") },
    { ticker: "TSLA", name: "Tesla, Inc.", ...getLivePrice("TSLA") }
  ].sort((a, b) => b.changePercent - a.changePercent);

  const losers = [
    { ticker: "MSFT", name: "Microsoft Corp.", ...getLivePrice("MSFT") },
    { ticker: "GOOG", name: "Alphabet Inc.", ...getLivePrice("GOOG") },
    { ticker: "AMZN", name: "Amazon.com Inc.", ...getLivePrice("AMZN") }
  ].sort((a, b) => a.changePercent - b.changePercent);

  res.json({
    indices: {
      SP500: { price: 5432.50, change: 18.20, changePercent: 0.34 },
      NASDAQ: { price: 17855.40, change: 105.60, changePercent: 0.60 },
      DOW: { price: 39560.10, change: -45.30, changePercent: -0.11 }
    },
    topGainers: gainers,
    topLosers: losers,
    news: [
      {
        id: "news-1",
        title: "Federal Reserve hints at future rate stability as inflation pressures cool",
        source: "Financial Times",
        date: "2 hours ago",
        summary: "The Fed leaves interest rates unchanged, noting positive progress on core consumer prices.",
        sentiment: "positive",
        category: "Macro"
      },
      {
        id: "news-2",
        title: "AI Infrastructure spending surges to record heights, tech leaders report",
        source: "Bloomberg",
        date: "4 hours ago",
        summary: "Capital expenditures for datacenter scale-outs hit new records, boosting semiconductor stocks.",
        sentiment: "positive",
        category: "Tech"
      },
      {
        id: "news-3",
        title: "EV market faces regulatory headwinds as global supply lines shift",
        source: "Wall Street Journal",
        date: "6 hours ago",
        summary: "Battery supply chain rules challenge automakers preparing new electric car models.",
        sentiment: "negative",
        category: "Automotive"
      }
    ]
  });
});

// Search stock suggestion
router.get("/search", (req, res) => {
  const query = (req.query.q || "").toString().toUpperCase();
  const results = Object.values(STOCKS_DB)
    .filter(
      (s) => s.ticker.includes(query) || s.name.toUpperCase().includes(query)
    )
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      price: getLivePrice(s.ticker).price
    }));
  res.json({ results });
});

// Get specific stock profiles, price and historical chart data
router.get("/details/:ticker", (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const stock = STOCKS_DB[ticker];
  if (!stock) {
    res.status(404).json({ error: "Stock ticker not supported. Please use AAPL, MSFT, GOOG, TSLA, NVDA, AMZN or NFLX." });
    return;
  }

  const live = getLivePrice(ticker);
  const range = (req.query.range || "1M").toString();

  // Generate deterministic interactive chart data
  const dataPointsCount = range === "1D" ? 24 : range === "1W" ? 7 : range === "1M" ? 30 : 12;
  const chartData: { date: string; price: number; volume: number }[] = [];
  
  const now = Date.now();
  for (let i = dataPointsCount; i >= 0; i--) {
    let dateStr = "";
    const pointDate = new Date(now - i * (range === "1D" ? 60 * 60 * 1000 : range === "1W" ? 24 * 60 * 60 * 1000 : range === "1M" ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000));
    
    if (range === "1D") {
      dateStr = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      dateStr = pointDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    const priceSeed = stock.basePrice + Math.sin(i / 3) * (stock.basePrice * 0.05) + Math.cos(i / 2) * (stock.basePrice * 0.02);
    chartData.push({
      date: dateStr,
      price: Number((priceSeed + (i === 0 ? live.price - priceSeed : 0)).toFixed(2)),
      volume: Math.floor(100000 + Math.random() * 900000)
    });
  }

  // Financial highlights
  const financials = {
    revenue: ["$120.5B", "$124.3B", "$132.1B"],
    netIncome: ["$24.2B", "$26.1B", "$28.5B"],
    eps: ["$1.52", "$1.68", "$1.85"],
    years: ["2024", "2025", "2026 (Est)"]
  };

  const news = [
    {
      id: `${ticker}-news-1`,
      title: `${stock.name} releases quarterly product cycle and supply chain roadmap`,
      source: "Reuters",
      date: "3 hours ago",
      summary: `Industry sources report strong baseline purchase commitments for ${stock.name}'s upcoming offerings.`,
      sentiment: "positive"
    },
    {
      id: `${ticker}-news-2`,
      title: `Analysts adjust price targets for ${stock.name} following latest industry data`,
      source: "MarketWatch",
      date: "1 day ago",
      summary: `Several investment firms upgraded their sentiment score for ${ticker} citing efficient cost optimizations.`,
      sentiment: "positive"
    }
  ];

  res.json({
    profile: stock,
    live,
    chartData,
    financials,
    news
  });
});

// Watchlist GET
router.get("/watchlist", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const watchlistDetails = user.watchlist.map((ticker) => {
      const stock = STOCKS_DB[ticker];
      if (!stock) return null;
      return {
        ticker,
        name: stock.name,
        sector: stock.sector,
        ...getLivePrice(ticker)
      };
    }).filter(Boolean);

    res.json({ watchlist: watchlistDetails });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Watchlist ADD
router.post("/watchlist/add", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      res.status(400).json({ error: "Stock ticker is required." });
      return;
    }

    const uppercaseTicker = ticker.toUpperCase();
    if (!STOCKS_DB[uppercaseTicker]) {
      res.status(400).json({ error: "Ticker not supported. Choose AAPL, MSFT, GOOG, TSLA, NVDA, AMZN or NFLX." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.watchlist.includes(uppercaseTicker)) {
      res.status(200).json({ message: "Stock is already in your watchlist.", watchlist: user.watchlist });
      return;
    }

    user.watchlist.push(uppercaseTicker);
    await saveDb(db);

    res.status(200).json({ message: "Stock added to watchlist successfully.", watchlist: user.watchlist });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Watchlist REMOVE
router.post("/watchlist/remove", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      res.status(400).json({ error: "Stock ticker is required." });
      return;
    }

    const uppercaseTicker = ticker.toUpperCase();
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.watchlist = user.watchlist.filter((t) => t !== uppercaseTicker);
    await saveDb(db);

    res.status(200).json({ message: "Stock removed from watchlist successfully.", watchlist: user.watchlist });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;

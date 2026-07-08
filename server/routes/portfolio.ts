import { Router } from "express";
import { getDb, saveDb, Transaction, Holding } from "../db";
import { getLivePrice, STOCKS_DB } from "./stocks";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Helper to compute user holdings dynamically from transaction history
export function computeHoldings(transactions: Transaction[]): Holding[] {
  const holdingsMap: Record<string, { totalShares: number; totalCost: number }> = {};
  
  // Transactions are ordered chronologically to compute standard cost basis
  const chronologicalTxs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of chronologicalTxs) {
    const ticker = tx.ticker.toUpperCase();
    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = { totalShares: 0, totalCost: 0 };
    }

    const h = holdingsMap[ticker];
    if (tx.type === "BUY") {
      h.totalShares += tx.shares;
      h.totalCost += tx.shares * tx.price;
    } else if (tx.type === "SELL") {
      // Deduct shares, keeping track of cost basis
      const prevAvgPrice = h.totalShares > 0 ? h.totalCost / h.totalShares : 0;
      h.totalShares = Math.max(0, h.totalShares - tx.shares);
      h.totalCost = h.totalShares * prevAvgPrice;
    }
  }

  return Object.entries(holdingsMap)
    .filter(([_, data]) => data.totalShares > 0)
    .map(([ticker, data]) => {
      const stock = STOCKS_DB[ticker];
      return {
        ticker,
        name: stock ? stock.name : ticker,
        shares: Number(data.totalShares.toFixed(4)),
        avgBuyPrice: Number((data.totalCost / data.totalShares).toFixed(2))
      };
    });
}

// Get portfolio overview valuation
router.get("/summary", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user?.id;
    const userTxs = db.transactions.filter((tx) => tx.userId === userId);
    
    const holdings = computeHoldings(userTxs);
    
    let totalCurrentValue = 0;
    let totalInvestmentCost = 0;
    let totalTodayOpenValue = 0;
    
    const holdingDetails = holdings.map((h) => {
      const live = getLivePrice(h.ticker);
      const currentValue = h.shares * live.price;
      const investmentCost = h.shares * h.avgBuyPrice;
      const profitLoss = currentValue - investmentCost;
      const profitLossPercent = investmentCost > 0 ? (profitLoss / investmentCost) * 100 : 0;
      
      const stock = STOCKS_DB[h.ticker];
      const todayOpenValue = h.shares * (stock ? stock.open : h.avgBuyPrice);
      
      totalCurrentValue += currentValue;
      totalInvestmentCost += investmentCost;
      totalTodayOpenValue += todayOpenValue;
      
      return {
        ...h,
        currentPrice: live.price,
        currentValue: Number(currentValue.toFixed(2)),
        investmentCost: Number(investmentCost.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
        profitLossPercent: Number(profitLossPercent.toFixed(2)),
        changePercentToday: live.changePercent
      };
    });

    const totalProfitLoss = totalCurrentValue - totalInvestmentCost;
    const totalProfitLossPercent = totalInvestmentCost > 0 ? (totalProfitLoss / totalInvestmentCost) * 100 : 0;
    
    // Profit or loss specifically today
    const todayProfitLoss = totalCurrentValue - totalTodayOpenValue;
    const todayProfitLossPercent = totalTodayOpenValue > 0 ? (todayProfitLoss / totalTodayOpenValue) * 100 : 0;

    // Asset allocation percentages
    const allocations = holdingDetails.map((h) => ({
      name: h.ticker,
      value: Number(h.currentValue.toFixed(2)),
      percentage: totalCurrentValue > 0 ? Number(((h.currentValue / totalCurrentValue) * 100).toFixed(2)) : 0
    }));

    res.json({
      totalValue: Number(totalCurrentValue.toFixed(2)),
      totalInvestment: Number(totalInvestmentCost.toFixed(2)),
      totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
      totalProfitLossPercent: Number(totalProfitLossPercent.toFixed(2)),
      todayProfitLoss: Number(todayProfitLoss.toFixed(2)),
      todayProfitLossPercent: Number(todayProfitLossPercent.toFixed(2)),
      holdings: holdingDetails,
      allocations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Transaction GET with pagination and filtering
router.get("/transactions", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user?.id;
    const tickerFilter = req.query.ticker ? req.query.ticker.toString().toUpperCase() : null;
    
    let userTxs = db.transactions.filter((tx) => tx.userId === userId);
    
    if (tickerFilter) {
      userTxs = userTxs.filter((tx) => tx.ticker === tickerFilter);
    }

    // Sort newest transactions first
    userTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ transactions: userTxs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Buy Stock
router.post("/buy", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticker, shares, price, date } = req.body;
    if (!ticker || !shares || !price) {
      res.status(400).json({ error: "Ticker, shares quantity, and share purchase price are required." });
      return;
    }

    const uppercaseTicker = ticker.toUpperCase();
    if (!STOCKS_DB[uppercaseTicker]) {
      res.status(400).json({ error: "Stock ticker not supported." });
      return;
    }

    if (Number(shares) <= 0 || Number(price) <= 0) {
      res.status(400).json({ error: "Shares and price must be greater than 0." });
      return;
    }

    const db = await getDb();
    const newTx: Transaction = {
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      userId: req.user!.id,
      type: "BUY",
      ticker: uppercaseTicker,
      shares: Number(shares),
      price: Number(price),
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    };

    db.transactions.push(newTx);
    await saveDb(db);

    res.status(201).json({ message: `Successfully bought ${shares} shares of ${uppercaseTicker}.`, transaction: newTx });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Sell Stock
router.post("/sell", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticker, shares, price, date } = req.body;
    if (!ticker || !shares || !price) {
      res.status(400).json({ error: "Ticker, shares quantity, and sell price are required." });
      return;
    }

    const uppercaseTicker = ticker.toUpperCase();
    const db = await getDb();
    const userId = req.user!.id;
    const userTxs = db.transactions.filter((tx) => tx.userId === userId);
    const holdings = computeHoldings(userTxs);
    
    const holding = holdings.find((h) => h.ticker === uppercaseTicker);
    if (!holding || holding.shares < Number(shares)) {
      res.status(400).json({
        error: `Insufficient shares. You only own ${holding ? holding.shares : 0} shares of ${uppercaseTicker}.`
      });
      return;
    }

    if (Number(shares) <= 0 || Number(price) <= 0) {
      res.status(400).json({ error: "Shares and price must be greater than 0." });
      return;
    }

    const newTx: Transaction = {
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      userId,
      type: "SELL",
      ticker: uppercaseTicker,
      shares: Number(shares),
      price: Number(price),
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    };

    db.transactions.push(newTx);
    await saveDb(db);

    res.status(201).json({ message: `Successfully sold ${shares} shares of ${uppercaseTicker}.`, transaction: newTx });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Manual Edit Holdings (compensates with transactions to match requested holdings)
router.post("/edit-holding", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { ticker, shares, avgBuyPrice } = req.body;
    if (!ticker || shares === undefined || avgBuyPrice === undefined) {
      res.status(400).json({ error: "Ticker, shares, and average buy price are required." });
      return;
    }

    const uppercaseTicker = ticker.toUpperCase();
    const db = await getDb();
    const userId = req.user!.id;

    // Filter out previous transactions of this specific ticker for a clean start
    db.transactions = db.transactions.filter(
      (tx) => !(tx.userId === userId && tx.ticker === uppercaseTicker)
    );

    // Insert a single compensating buy transaction
    if (Number(shares) > 0) {
      const newTx: Transaction = {
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        userId,
        type: "BUY",
        ticker: uppercaseTicker,
        shares: Number(shares),
        price: Number(avgBuyPrice),
        date: new Date().toISOString()
      };
      db.transactions.push(newTx);
    }

    await saveDb(db);
    res.json({ message: `Holding for ${uppercaseTicker} adjusted successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Delete Holding (wipes out transactions for this ticker)
router.delete("/holding/:ticker", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const db = await getDb();
    const userId = req.user!.id;

    db.transactions = db.transactions.filter(
      (tx) => !(tx.userId === userId && tx.ticker === ticker)
    );

    await saveDb(db);
    res.json({ message: `All transactions for ${ticker} deleted. Holding cleared.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// CSV Export (sends JSON that client can easily convert to CSV)
router.get("/export-csv", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;
    const userTxs = db.transactions.filter((tx) => tx.userId === userId);
    
    const csvRows = [
      ["TransactionID", "Type", "Ticker", "Shares", "Price", "Date"].join(",")
    ];

    userTxs.forEach((tx) => {
      csvRows.push([
        tx.id,
        tx.type,
        tx.ticker,
        tx.shares,
        tx.price,
        tx.date
      ].join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.status(200).send(csvRows.join("\n"));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// CSV Import
router.post("/import-csv", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      res.status(400).json({ error: "CSV data is required." });
      return;
    }

    const lines = csvData.split("\n");
    if (lines.length <= 1) {
      res.status(400).json({ error: "Empty or invalid CSV file." });
      return;
    }

    const db = await getDb();
    const userId = req.user!.id;
    const newTxs: Transaction[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [type, ticker, shares, price, date] = line.split(",");
      if (!type || !ticker || !shares || !price) continue;

      const cleanType = type.toUpperCase().trim() === "SELL" ? "SELL" : "BUY";
      const cleanTicker = ticker.toUpperCase().trim();
      
      if (!STOCKS_DB[cleanTicker]) continue; // Skip unsupported stocks

      newTxs.push({
        id: "tx-imported-" + Math.random().toString(36).substr(2, 9),
        userId,
        type: cleanType,
        ticker: cleanTicker,
        shares: Number(shares),
        price: Number(price),
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      });
    }

    if (newTxs.length === 0) {
      res.status(400).json({ error: "No valid transactions imported. Check stock tickers." });
      return;
    }

    db.transactions.push(...newTxs);
    await saveDb(db);

    res.json({ message: `Successfully imported ${newTxs.length} transactions.`, count: newTxs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;

import React, { useState, useEffect } from "react";
import { useNavigation } from "../components/NavigationContext";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { StockChart } from "../components/StockChart";
import { StockModal } from "../components/StockModal";
import { 
  Briefcase, 
  History, 
  Trash2, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Upload, 
  Download, 
  Printer, 
  DollarSign, 
  Award, 
  Building,
  Activity,
  Calculator,
  RefreshCw,
  Clock
} from "lucide-react";

export function Portfolio() {
  const { user } = useAuth();
  const { searchParams, setSearchParams } = useNavigation();
  const tickerParam = searchParams.get("ticker");

  // State managers
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(tickerParam || "AAPL");
  const [chartRange, setChartRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Importer state
  const [csvInput, setCsvInput] = useState("");
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  // Trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"BUY" | "SELL">("BUY");

  const fetchPortfolioData = async () => {
    try {
      const [sumRes, txsRes] = await Promise.all([
        api.portfolio.getSummary(),
        api.portfolio.getTransactions()
      ]);
      setSummary(sumRes);
      setTransactions(txsRes.transactions || []);
      
      // If there are holdings but no selectedTicker, set it to the first holding
      if (!selectedTicker && sumRes.holdings?.length > 0) {
        setSelectedTicker(sumRes.holdings[0].ticker);
      }
    } catch {
      setError("Failed to sync portfolio details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async () => {
    if (!selectedTicker) return;
    setStockLoading(true);
    try {
      const details = await api.stocks.getDetails(selectedTicker, chartRange);
      setStockDetails(details);
    } catch {
      // Silent
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    fetchStockData();
    // Sync search parameter
    if (selectedTicker && tickerParam !== selectedTicker) {
      setSearchParams({ ticker: selectedTicker });
    }
  }, [selectedTicker, chartRange]);

  // Sync to searchParam changes
  useEffect(() => {
    if (tickerParam && tickerParam !== selectedTicker) {
      setSelectedTicker(tickerParam);
    }
  }, [tickerParam]);

  const handleOpenTrade = (act: "BUY" | "SELL", tick?: string) => {
    if (tick) setSelectedTicker(tick);
    setModalAction(act);
    setTradeModalOpen(true);
  };

  const handleDeleteHolding = async (tick: string) => {
    if (!confirm(`Are you sure you want to delete all trades and wipe holdings for ${tick}?`)) return;
    try {
      await api.portfolio.deleteHolding(tick);
      if (selectedTicker === tick) setSelectedTicker(null);
      fetchPortfolioData();
    } catch {
      alert("Failed to clear holdings.");
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvStatus(null);
    setCsvError(null);
    if (!csvInput.trim()) {
      setCsvError("Please paste or write transaction rows.");
      return;
    }

    try {
      const res = await api.portfolio.importCsv(csvInput);
      setCsvStatus(res.message);
      setCsvInput("");
      fetchPortfolioData();
      setTimeout(() => setShowImporter(false), 2000);
    } catch (err: any) {
      setCsvError(err.message || "CSV parse error. Ensure columns: Type, Ticker, Shares, Price, [Date]");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 font-sans">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasHoldings = summary && summary.holdings?.length > 0;
  const activeHolding = stockDetails?.profile;
  const isChartPos = stockDetails?.live?.changePercent >= 0;

  return (
    <div className="space-y-8 font-sans print:p-0 print:space-y-4">
      
      {/* Printable Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-b print:pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Portfolio Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 print:text-black">
            View holdings, evaluate financial balances, and export PDF summaries.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="h-9 px-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </button>
          
          <a
            href={api.portfolio.getExportCsvUrl()}
            className="h-9 px-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="h-9 px-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* CSV Bulk Importer Text Block (expandable) */}
      {showImporter && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4 animate-slide-in">
          <h3 className="font-bold text-sm font-sans flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-500" />
            <span>Bulk CSV Transaction Importer</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paste plain comma-separated transaction rows (header line is skipped). Supported tickers: AAPL, MSFT, GOOG, TSLA, NVDA, AMZN, NFLX.
          </p>

          <form onSubmit={handleCsvImport} className="space-y-4">
            {csvStatus && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
                {csvStatus}
              </div>
            )}
            {csvError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
                {csvError}
              </div>
            )}

            <div>
              <textarea
                placeholder="Type,Ticker,Shares,Price,Date&#10;BUY,AAPL,10,175.50,2026-06-01&#10;BUY,TSLA,12,220.00,2026-06-15&#10;SELL,AAPL,2,190.00,2026-06-20"
                rows={5}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImporter(false)}
                className="h-9 px-4 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10"
              >
                Import Bulk Ledger
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. HOLDINGS SUMMARY TABLE */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 print:border-0 print:p-0">
        <h2 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-emerald-500" />
          <span>Active Asset Ledger</span>
        </h2>

        {!hasHoldings ? (
          <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            You don't own any stock holdings. Place your first buy trade to populate your portfolio!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticker</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4">Avg Cost</th>
                  <th className="py-3 px-4">Live Price</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Current Value</th>
                  <th className="py-3 px-4">Returns P&L</th>
                  <th className="py-3 px-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {summary.holdings.map((h: any) => {
                  const isSel = selectedTicker === h.ticker;
                  const pos = h.profitLoss >= 0;
                  return (
                    <tr
                      key={h.ticker}
                      onClick={() => setSelectedTicker(h.ticker)}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all ${
                        isSel ? "bg-slate-50 dark:bg-slate-800/30 border-l-2 border-emerald-500" : ""
                      }`}
                    >
                      <td className="py-4 px-4 font-bold font-sans">
                        <div className="flex flex-col">
                          <span className="text-emerald-500 text-sm font-mono">{h.ticker}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{h.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium">{h.shares}</td>
                      <td className="py-4 px-4 font-mono">₹{h.avgBuyPrice?.toFixed(2)}</td>
                      <td className="py-4 px-4 font-mono font-medium">₹{h.currentPrice?.toFixed(2)}</td>
                      <td className="py-4 px-4 font-mono text-slate-500">₹{h.investmentCost?.toLocaleString()}</td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        ₹{h.currentValue?.toLocaleString()}
                      </td>
                      <td className={`py-4 px-4 font-mono font-bold ${pos ? "text-emerald-500" : "text-rose-500"}`}>
                        <div className="flex flex-col">
                          <span>{pos ? "+" : ""}₹{h.profitLoss?.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold">{pos ? "+" : ""}{h.profitLossPercent?.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center space-x-2 print:hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenTrade("BUY", h.ticker)}
                          className="px-2 py-1 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/10 rounded"
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => handleOpenTrade("SELL", h.ticker)}
                          className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded"
                        >
                          SELL
                        </button>
                        <button
                          onClick={() => handleDeleteHolding(h.ticker)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded inline-block"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. DYNAMIC SELECTED STOCK DETAILS */}
      {selectedTicker && stockDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-6">
          
          {/* Interactive Chart & Description */}
          <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 print:border-0 print:p-0">
            <div className="flex justify-between items-center print:border-b print:pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold font-mono text-emerald-500">
                  {selectedTicker}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base font-sans text-slate-900 dark:text-white">
                    {activeHolding?.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-sans">{activeHolding?.sector}</span>
                </div>
              </div>

              {/* Range Filters */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl print:hidden">
                {["1D", "1W", "1M", "1Y"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      chartRange === r 
                        ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Line Summary */}
            <div className="flex items-baseline gap-2 pb-2">
              <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                ₹{stockDetails.live?.price?.toFixed(2)}
              </span>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                isChartPos ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
                {isChartPos ? "+" : ""}{stockDetails.live?.changePercent?.toFixed(2)}% TODAY
              </span>
            </div>

            {/* Historical Area chart */}
            <div className="print:hidden">
              {stockLoading ? (
                <div className="h-72 w-full bg-slate-100 dark:bg-slate-950 rounded-2xl flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <StockChart data={stockDetails.chartData} isPositive={isChartPos} />
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span>Company profile</span>
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans">
                {activeHolding?.description}
              </p>
            </div>
          </div>

          {/* Key valuation statistics */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6 print:border-0 print:p-0">
            <h3 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span>Asset Valuation Metrics</span>
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Market Capitalization</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{activeHolding?.marketCap}</span>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Price-To-Earnings (P/E)</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{activeHolding?.peRatio}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Dividend Yield</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{activeHolding?.dividendYield}%</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Today's Low / High</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">₹{activeHolding?.low} - ₹{activeHolding?.high}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">52-Week Low</span>
                <span className="font-bold font-mono text-rose-500">₹{activeHolding?.fiftyTwoWeekLow}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">52-Week High</span>
                <span className="font-bold font-mono text-emerald-500">₹{activeHolding?.fiftyTwoWeekHigh}</span>
              </div>
            </div>

            {/* Corporate Leadership */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
              <h4 className="font-bold text-[10px] text-slate-400 tracking-wider uppercase font-sans">Corporate Officers</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Chief Executive:</span>
                <span className="font-bold">{activeHolding?.ceo}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Employees:</span>
                <span className="font-bold font-mono">{activeHolding?.employees?.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. TRANSACTION HISTORY LIST */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 print:hidden">
        <h2 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-500" />
          <span>Complete Trading Ledger</span>
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No transaction records found in ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Ticker</th>
                  <th className="py-2 px-3">Quantity</th>
                  <th className="py-2 px-3">Execution price</th>
                  <th className="py-2 px-3">Total Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-500 dark:text-slate-400">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-3 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(t.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.type === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">{t.ticker}</td>
                    <td className="py-3 px-3 font-mono font-medium">{t.shares}</td>
                    <td className="py-3 px-3 font-mono">₹{t.price?.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{(t.shares * t.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <StockModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        initialTicker={selectedTicker || "AAPL"}
        initialAction={modalAction}
        onSuccess={fetchPortfolioData}
      />

    </div>
  );
}
export default Portfolio;

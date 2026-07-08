import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { AllocationChart } from "../components/AllocationChart";
import { StockModal } from "../components/StockModal";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  PieChart as PieIcon, 
  Plus, 
  Minus, 
  Newspaper, 
  Flame, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Clock
} from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock modal ticket state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"BUY" | "SELL">("BUY");

  const fetchData = async () => {
    try {
      const [sumRes, mktRes] = await Promise.all([
        api.portfolio.getSummary(),
        api.stocks.getMarketSummary()
      ]);
      setSummary(sumRes);
      setMarket(mktRes);
    } catch (err: any) {
      setError("Failed to synchronize active portfolio state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Polling prices
    return () => clearInterval(interval);
  }, []);

  const handleOpenTrade = (act: "BUY" | "SELL") => {
    setModalAction(act);
    setTradeModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 font-sans">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasHoldings = summary && summary.holdings?.length > 0;
  const plPos = summary?.totalProfitLoss >= 0;
  const todayPos = summary?.todayProfitLoss >= 0;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Welcome Back, {user?.name}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Analyze valuations and review AI-predicted diversification scores.
          </p>
        </div>

        {/* Quick Order Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleOpenTrade("BUY")}
            className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>BUY TICKET</span>
          </button>
          <button
            onClick={() => handleOpenTrade("SELL")}
            className="h-10 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/10 transition-all cursor-pointer"
          >
            <Minus className="h-4 w-4" />
            <span>SELL TICKET</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Value */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold tracking-wider uppercase font-sans">Portfolio Valuation</span>
            <IndianRupee className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{summary?.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-sans mt-2">
              <span className="text-slate-400">Net Cost Basis:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-gray-300">
                ₹{summary?.totalInvestment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Total Profit/Loss */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold tracking-wider uppercase font-sans">Unrealized Net P&L</span>
            {plPos ? (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-rose-500" />
            )}
          </div>
          <div className="mt-4">
            <div className={`text-2xl sm:text-3xl font-bold font-mono ${plPos ? "text-emerald-500" : "text-rose-500"}`}>
              {plPos ? "+" : ""}₹{summary?.totalProfitLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded mt-2 ${
              plPos ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            }`}>
              {plPos ? "+" : ""}{summary?.totalProfitLossPercent?.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Today's Returns */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold tracking-wider uppercase font-sans">Today's Returns</span>
            {todayPos ? (
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-rose-500" />
            )}
          </div>
          <div className="mt-4">
            <div className={`text-2xl sm:text-3xl font-bold font-mono ${todayPos ? "text-emerald-500" : "text-rose-500"}`}>
              {todayPos ? "+" : ""}₹{summary?.todayProfitLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded mt-2 ${
              todayPos ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            }`}>
              {todayPos ? "+" : ""}{summary?.todayProfitLossPercent?.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. ALLOCATION CHART AND SECTOR SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocations */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-emerald-500" />
              <span>Asset Allocations</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-sans">Calculated weight distribution</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
            <div>
              <AllocationChart data={summary?.allocations || []} />
            </div>

            {/* Allocation breakdown list */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {hasHoldings ? (
                summary.holdings.map((h: any, idx: number) => (
                  <div key={h.ticker} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900 dark:text-white w-10">{h.ticker}</span>
                      <span className="text-slate-400 truncate max-w-[120px]">{h.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold font-mono text-slate-900 dark:text-white">₹{h.currentValue?.toLocaleString()}</span>
                      <div className="text-[10px] text-emerald-500 font-semibold">{summary.allocations[idx]?.percentage}% weight</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No active holding positions. Purchase assets to calculate distribution metrics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tickers Board */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
            <span>Market Highlights</span>
          </h3>

          <div className="space-y-4">
            {/* Top Gainers */}
            <div>
              <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase font-sans block mb-2">Top Gainers</span>
              <div className="space-y-2">
                {market?.topGainers?.slice(0, 2).map((item: any) => (
                  <div key={item.ticker} className="flex justify-between items-center text-xs p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div>
                      <span className="font-bold font-mono text-emerald-500 block">{item.ticker}</span>
                      <span className="text-[10px] text-slate-400 font-sans truncate block max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-950 dark:text-white">₹{item.price}</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-500 block">+{item.changePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase font-sans block mb-2">Today's Drags</span>
              <div className="space-y-2">
                {market?.topLosers?.slice(0, 2).map((item: any) => (
                  <div key={item.ticker} className="flex justify-between items-center text-xs p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                    <div>
                      <span className="font-bold font-mono text-rose-500 block">{item.ticker}</span>
                      <span className="text-[10px] text-slate-400 font-sans truncate block max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-950 dark:text-white">₹{item.price}</span>
                      <span className="text-[10px] font-mono font-bold text-rose-500 block">{item.changePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEWS FEED AND MARKET INSIGHTS */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Newspaper className="h-5 w-5 text-emerald-500" />
          <span>Market Intel News</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {market?.news?.map((n: any) => (
            <div key={n.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-500/20 transition-all">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-semibold text-emerald-500">{n.category}</span>
                  <span className="text-slate-400 flex items-center gap-1 font-sans">
                    <Clock className="h-3 w-3" />
                    {n.date}
                  </span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-sans line-clamp-2">
                  {n.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 font-sans">
                  {n.summary}
                </p>
              </div>
              <div className="flex justify-between items-center text-[10px] border-t border-slate-200/50 dark:border-slate-800/50 pt-2 text-slate-400">
                <span className="font-bold">{n.source}</span>
                <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                  n.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}>
                  {n.sentiment}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Modal */}
      <StockModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        initialAction={modalAction}
        onSuccess={fetchData}
      />

    </div>
  );
}
export default Dashboard;

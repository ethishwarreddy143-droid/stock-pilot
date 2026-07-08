import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "./AuthContext";
import { X, TrendingUp, DollarSign, Calculator } from "lucide-react";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  initialAction?: "BUY" | "SELL";
  onSuccess?: () => void;
}

const SUPPORTED_TICKERS = ["AAPL", "MSFT", "GOOG", "TSLA", "NVDA", "AMZN", "NFLX"];

export function StockModal({ isOpen, onClose, initialTicker = "AAPL", initialAction = "BUY", onSuccess }: StockModalProps) {
  const { user } = useAuth();
  const [action, setAction] = useState<"BUY" | "SELL">(initialAction);
  const [ticker, setTicker] = useState(initialTicker);
  const [shares, setShares] = useState("10");
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownedShares, setOwnedShares] = useState(0);

  // Sync state if initialProps change
  useEffect(() => {
    setAction(initialAction);
    setTicker(initialTicker);
  }, [initialTicker, initialAction, isOpen]);

  // Fetch current price & owned shares
  const fetchPriceAndShares = async () => {
    try {
      const details = await api.stocks.getDetails(ticker);
      setPrice(details.live.price.toString());

      const summary = await api.portfolio.getSummary();
      const holding = summary.holdings?.find((h: any) => h.ticker === ticker);
      setOwnedShares(holding ? holding.shares : 0);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (isOpen && ticker) {
      fetchPriceAndShares();
    }
  }, [ticker, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const qty = Number(shares);
    const prc = Number(price);

    if (isNaN(qty) || qty <= 0) {
      setError("Please specify a positive quantity of shares.");
      setLoading(false);
      return;
    }

    if (isNaN(prc) || prc <= 0) {
      setError("Please specify a valid asset share price.");
      setLoading(false);
      return;
    }

    if (action === "SELL" && qty > ownedShares) {
      setError(`Insufficient shares. You only own ${ownedShares} shares of ${ticker}.`);
      setLoading(false);
      return;
    }

    try {
      if (action === "BUY") {
        await api.portfolio.buy({ ticker, shares: qty, price: prc });
      } else {
        await api.portfolio.sell({ ticker, shares: qty, price: prc });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Execution failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = Number(shares) * Number(price);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-zoom-in">
        
        {/* Header tabs (Buy vs Sell) */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setAction("BUY"); setError(null); }}
            className={`flex-1 py-4 text-center text-sm font-bold font-sans transition-all border-b-2 ${
              action === "BUY" 
                ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            BUY TICKET
          </button>
          <button
            type="button"
            onClick={() => { setAction("SELL"); setError(null); }}
            className={`flex-1 py-4 text-center text-sm font-bold font-sans transition-all border-b-2 ${
              action === "SELL" 
                ? "border-rose-500 text-rose-500 bg-rose-500/5" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            SELL TICKET
          </button>
          <button
            onClick={onClose}
            className="p-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Select Ticker */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Ticker Asset</label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            >
              {SUPPORTED_TICKERS.map((t) => (
                <option key={t} value={t}>{t} - {t === "AAPL" ? "Apple" : t === "MSFT" ? "Microsoft" : t === "GOOG" ? "Alphabet" : t === "TSLA" ? "Tesla" : t === "NVDA" ? "NVIDIA" : t === "AMZN" ? "Amazon" : "Netflix"}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Shares Quantity</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Execution Price (₹)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Holdings Info Indicator */}
          {action === "SELL" && (
            <div className="text-right text-[10px] font-medium text-slate-400">
              Shares available to sell: <span className="font-mono font-bold text-slate-900 dark:text-white">{ownedShares} shares</span>
            </div>
          )}

          {/* Estimated summary box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Calculator className="h-4 w-4" />
              <span className="text-xs">Estimated Total Basis:</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                ₹{isNaN(estimatedTotal) ? "0.00" : estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-sans text-xs font-bold text-white shadow-xl flex items-center justify-center gap-2 ${
              action === "BUY" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/10" 
                : "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/10"
            }`}
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>PLACE {action} ORDER</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

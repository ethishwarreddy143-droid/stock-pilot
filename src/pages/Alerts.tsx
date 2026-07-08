import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { 
  Bell, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";

export function Alerts() {
  const { user } = useAuth();
  
  // Alert logs list state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [ticker, setTicker] = useState("AAPL");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchAlertsList = async () => {
    try {
      const res = await api.notifications.getAlerts();
      setAlerts(res.alerts || []);
    } catch {
      setError("Could not retrieve price alerts list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsList();
    const interval = setInterval(fetchAlertsList, 8000); // Poll triggers
    return () => clearInterval(interval);
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    setFormSuccess(null);

    const priceNum = Number(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please specify a valid positive target price threshold.");
      setFormLoading(false);
      return;
    }

    try {
      await api.notifications.createAlert({
        type: "PRICE",
        ticker,
        condition,
        targetPrice: priceNum
      });
      setFormSuccess(`Alert configured. We'll monitor if ${ticker} crosses ${condition.toLowerCase()} ₹${priceNum}.`);
      setTargetPrice("");
      fetchAlertsList();
    } catch (err: any) {
      setError(err.message || "Failed to create price alert threshold.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleAlert = async (id: string) => {
    try {
      await api.notifications.toggleAlert(id);
      fetchAlertsList();
    } catch {
      setError("Failed to toggle alert state.");
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    try {
      await api.notifications.deleteAlert(id);
      fetchAlertsList();
    } catch {
      setError("Failed to delete alert.");
    }
  };

  const SUPPORTED_TICKERS = ["AAPL", "MSFT", "GOOG", "TSLA", "NVDA", "AMZN", "NFLX"];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Price Crossing Alerts
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Configure real-time target price crossings. Our backend engine monitors the tape and prompts you immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CREATOR PANEL */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              <span>Configure Price Alert</span>
            </h3>

            <form onSubmit={handleCreateAlert} className="space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
                  {formSuccess}
                </div>
              )}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Ticker Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Ticker Asset</label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                >
                  {SUPPORTED_TICKERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Crossing condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Trigger Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition("ABOVE")}
                    className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      condition === "ABOVE" 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold" 
                        : "border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>GOES ABOVE</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCondition("BELOW")}
                    className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      condition === "BELOW" 
                        ? "bg-rose-500/10 border-rose-500 text-rose-500 font-bold" 
                        : "border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>DROPS BELOW</span>
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Target Price Threshold (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="e.g. 185.50"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {formLoading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    <span>ACTIVATE MONITOR</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Core system helper info card */}
          <div className="p-5 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl space-y-3">
            <h4 className="font-bold text-xs font-sans flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>How alert triggers work</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Our active simulator generates random market price tape changes. The moment a tick crosses your boundary, the background polling thread fires a real-time visual alert toast in your active window and marks the trigger as completed.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE MONITORS FEED */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Bell className="h-5 w-5 text-emerald-500" />
            <span>Active Trigger Monitors ({alerts.length})</span>
          </h3>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              No price alert monitors set yet. Configure one in the left panel.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const above = alert.condition === "ABOVE";
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                      alert.active 
                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-500/5" 
                        : "border-slate-100 dark:border-slate-800 bg-slate-500/5 text-slate-400"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-emerald-500 text-sm">{alert.ticker}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 ${
                          above ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {above ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span>{alert.condition} ₹{alert.targetPrice}</span>
                        </span>
                      </div>
                      <p className="leading-relaxed font-sans text-slate-600 dark:text-slate-400">{alert.message}</p>
                      
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5 font-sans">
                        <Clock className="h-3 w-3" />
                        <span>Created: {new Date(alert.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleAlert(alert.id)}
                        className={`h-8 px-3 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
                          alert.active 
                            ? "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white" 
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                      >
                        {alert.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
export default Alerts;

import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { useNavigation } from "../components/NavigationContext";
import { 
  Eye, 
  Trash2, 
  Plus, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  RefreshCw
} from "lucide-react";

export function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const { navigate } = useNavigation();

  // Search/Add states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Watchlist states
  const [watchlistDetails, setWatchlistDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Sort states
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [sortBy, setSortBy] = useState<"TICKER" | "PRICE" | "CHANGE">("TICKER");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const fetchWatchlistDetails = async () => {
    try {
      const res = await api.stocks.getWatchlist();
      setWatchlistDetails(res.watchlist || []);
    } catch {
      setError("Failed to fetch watchlist details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistDetails();
    const interval = setInterval(fetchWatchlistDetails, 8000); // Poll prices
    return () => clearInterval(interval);
  }, [watchlist]);

  // Handle live search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await api.stocks.search(searchQuery);
          // Filter out what's already in the watchlist
          const filtered = (res.results || []).filter(
            (s: any) => !watchlist.includes(s.ticker)
          );
          setSearchResults(filtered);
          setShowSuggestions(true);
        } catch {
          // Silent
        }
      }, 200);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, watchlist]);

  const handleAddStock = async (ticker: string) => {
    try {
      await addToWatchlist(ticker);
      setSearchQuery("");
      setShowSuggestions(false);
    } catch (err: any) {
      alert(err.message || "Could not add stock to watchlist");
    }
  };

  const handleRemoveStock = async (ticker: string) => {
    try {
      await removeFromWatchlist(ticker);
    } catch {
      alert("Could not remove stock.");
    }
  };

  const toggleSort = (type: "TICKER" | "PRICE" | "CHANGE") => {
    if (sortBy === type) {
      setSortOrder((o) => (o === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(type);
      setSortOrder("ASC");
    }
  };

  // Perform Client-Side Filtering & Sorting
  const filteredWatchlist = watchlistDetails
    .filter((stock) => {
      const matchesSearch = 
        stock.ticker.includes(filterQuery.toUpperCase()) || 
        stock.name.toUpperCase().includes(filterQuery.toUpperCase());
      
      const matchesSector = 
        selectedSector === "ALL" || 
        stock.sector.toUpperCase().includes(selectedSector.toUpperCase());

      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "TICKER") {
        comparison = a.ticker.localeCompare(b.ticker);
      } else if (sortBy === "PRICE") {
        comparison = a.price - b.price;
      } else if (sortBy === "CHANGE") {
        comparison = a.changePercent - b.changePercent;
      }
      return sortOrder === "ASC" ? comparison : -comparison;
    });

  const sectors = ["ALL", "TECHNOLOGY", "AUTOMOTIVE", "ENTERTAINMENT"];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            My Watchlist
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Build personal lists, monitor quotes, and transition to active orders immediately.
          </p>
        </div>

        {/* Dynamic Watchlist Autocomplete Adder */}
        <div className="relative w-full sm:w-80">
          <div className="relative">
            <Plus className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Add stock (e.g. MSFT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>
          
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute top-10 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-40 max-h-60 overflow-y-auto">
              {searchResults.map((stock) => (
                <button
                  key={stock.ticker}
                  onClick={() => handleAddStock(stock.ticker)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{stock.ticker}</span>
                    <span className="text-[10px] text-slate-400 block">{stock.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 font-mono">+ ADD</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. FILTER & SORT NAVIGATION CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Sector Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                selectedSector === sec 
                  ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Client Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by name/ticker..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>
      </div>

      {/* 2. WATCHLIST GRID VIEW */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : watchlistDetails.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs font-sans">
          Your watchlist is empty. Search and add assets in the top right to get started!
        </div>
      ) : (
        <>
          {/* Sorting Indicators */}
          <div className="flex gap-4 justify-end text-[10px] font-semibold text-slate-400 pr-1">
            <button onClick={() => toggleSort("TICKER")} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-white">
              <span>Ticker Symbol</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("PRICE")} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-white">
              <span>Execution Price</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => toggleSort("CHANGE")} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-white">
              <span>Returns %</span>
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredWatchlist.map((stock) => {
              const isPos = stock.changePercent >= 0;
              return (
                <div 
                  key={stock.ticker}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/20 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold font-mono text-emerald-500 text-base">{stock.ticker}</span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white font-sans truncate max-w-[150px]">{stock.name}</h4>
                      <span className="text-[10px] text-slate-400 block font-sans mt-0.5">{stock.sector}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveStock(stock.ticker)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline pt-2">
                    <div>
                      <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">₹{stock.price?.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold block ${isPos ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPos ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => navigate(`/portfolio?ticker=${stock.ticker}`)}
                      className="h-8 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>DETAILS</span>
                    </button>
                    <button
                      onClick={() => navigate(`/portfolio?ticker=${stock.ticker}`)}
                      className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <span>TRADE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
export default Watchlist;

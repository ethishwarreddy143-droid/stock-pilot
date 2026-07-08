import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { api } from "../api";
import { 
  LayoutDashboard, 
  Briefcase, 
  Eye, 
  Sparkles, 
  Bell, 
  User, 
  ShieldAlert, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  Menu, 
  X, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentPath: locationPath, navigate } = useNavigation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userAlerts, setUserAlerts] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);

  // Add a toast notification
  const addToast = (message: string, type: "success" | "warning" | "info" = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Check price alerts on mount and then every 7 seconds
  const checkPriceAlerts = async () => {
    if (!user) return;
    try {
      const checkRes = await api.notifications.checkAlerts();
      if (checkRes.triggeredAlerts && checkRes.triggeredAlerts.length > 0) {
        checkRes.triggeredAlerts.forEach((alert: any) => {
          addToast(alert.message, "warning");
        });
        // Fetch fresh alerts list
        fetchAlerts();
      }
    } catch (err) {
      // Fail silently
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAlerts();
      setUserAlerts(res.alerts || []);
      setActiveAlertsCount(res.alerts?.filter((a: any) => a.active).length || 0);
    } catch {
      // Fail silently
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
      checkPriceAlerts();
      const interval = setInterval(checkPriceAlerts, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside search suggestions closes them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle live stock search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await api.stocks.search(searchQuery);
          setSearchResults(res.results || []);
          setShowSearchSuggestions(true);
        } catch {
          // Silent
        }
      }, 200);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
      setShowSearchSuggestions(false);
    }
  }, [searchQuery]);

  const handleSelectStock = (ticker: string) => {
    setSearchQuery("");
    setShowSearchSuggestions(false);
    navigate(`/portfolio?ticker=${ticker}`);
  };

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Portfolio", href: "/portfolio", icon: Briefcase },
    { name: "Watchlist", href: "/watchlist", icon: Eye },
    { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
    { name: "Price Alerts", href: "/alerts", icon: Bell },
    { name: "My Profile", href: "/profile", icon: User }
  ];

  if (user && user.role === "admin") {
    navigationItems.push({ name: "Admin Panel", href: "/admin", icon: ShieldAlert });
  }

  const handleToggleAlert = async (id: string) => {
    try {
      await api.notifications.toggleAlert(id);
      addToast("Alert status toggled.", "success");
      fetchAlerts();
    } catch {
      addToast("Failed to toggle alert", "warning");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Toast Banners */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg border flex gap-3 items-start animate-slide-in text-white ${
              toast.type === "success" 
                ? "bg-emerald-600 border-emerald-500" 
                : toast.type === "warning"
                ? "bg-amber-600 border-amber-500"
                : "bg-blue-600 border-blue-500"
            }`}
          >
            {toast.type === "warning" ? (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-sans flex-1 font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Primary Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-left cursor-pointer">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-sm font-black tracking-tight">S</span>
              <span>StockPilot</span>
            </span>
          </button>
        </div>

        {/* Header Dynamic Auto-Complete Search */}
        {user && (
          <div className="relative hidden sm:block w-96" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search stocks by ticker or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-4 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white"
              />
            </div>
            
            {showSearchSuggestions && searchResults.length > 0 && (
              <div className="absolute top-11 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-40 max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => handleSelectStock(stock.ticker)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{stock.ticker}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{stock.name}</div>
                    </div>
                    <div className="text-xs font-mono font-medium text-emerald-500">${stock.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Right Action Panel */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user && (
            <>
              {/* Alert Bell Trigger */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <Bell className="h-5 w-5" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {activeAlertsCount}
                  </span>
                )}
              </button>

              {/* Avatar Dropdown Icon */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <img
                  src={user.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                />
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex">
        {/* DESKTOP SIDEBAR */}
        {user && (
          <aside className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto shrink-0 p-4">
            <nav className="space-y-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = locationPath === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        )}

        {/* MOBILE OVERLAY MENU */}
        {user && mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-sm font-black tracking-tight">S</span>
                    <span>StockPilot</span>
                  </span>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="h-6 w-6 text-slate-500" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = locationPath === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => { navigate(item.href); setMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isActive 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDE DRAWER FOR PRICE ALERTS */}
        {user && notificationsOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end" onClick={() => setNotificationsOpen(false)}>
            <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg font-sans">My Active Alerts</h3>
                  <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {userAlerts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No price alerts set. Use the Price Alerts tab to set trigger thresholds!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {userAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
                          alert.active 
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-500/5" 
                            : "border-slate-200 dark:border-slate-800 bg-slate-500/5 text-slate-400"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold font-mono text-emerald-500">{alert.ticker}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            alert.active ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-500/20 text-slate-400"
                          }`}>
                            {alert.active ? "Active" : "Triggered/Off"}
                          </span>
                        </div>
                        <p className="leading-relaxed font-sans">{alert.message}</p>
                        {alert.active && (
                          <button
                            onClick={() => handleToggleAlert(alert.id)}
                            className="text-right text-[10px] font-semibold text-rose-500 hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/alerts");
                }}
                className="w-full text-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs rounded-xl font-medium shadow-md shadow-emerald-500/10"
              >
                Configure New Alerts
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY CONTAINER */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
export default Layout;

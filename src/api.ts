/**
 * Client API utility to interface with backend routes.
 * Automatically handles JWT header token insertion.
 */

const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const token = localStorage.getItem("stockpilot_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "An unexpected error occurred." };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (body: any) => request<any>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    verifyEmail: (body: any) => request<any>("/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),
    login: (body: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    forgotPassword: (body: any) => request<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body: any) => request<any>("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
    getProfile: () => request<any>("/auth/profile"),
    changePassword: (body: any) => request<any>("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
    updateProfile: (body: any) => request<any>("/auth/update-profile", { method: "POST", body: JSON.stringify(body) })
  },

  // Stocks
  stocks: {
    getMarketSummary: () => request<any>("/stocks/market-summary"),
    search: (query: string) => request<any>(`/stocks/search?q=${encodeURIComponent(query)}`),
    getDetails: (ticker: string, range = "1M") => request<any>(`/stocks/details/${ticker}?range=${range}`),
    getWatchlist: () => request<any>("/stocks/watchlist"),
    addToWatchlist: (ticker: string) => request<any>("/stocks/watchlist/add", { method: "POST", body: JSON.stringify({ ticker }) }),
    removeFromWatchlist: (ticker: string) => request<any>("/stocks/watchlist/remove", { method: "POST", body: JSON.stringify({ ticker }) })
  },

  // Portfolio
  portfolio: {
    getSummary: () => request<any>("/portfolio/summary"),
    getTransactions: (ticker?: string) => request<any>(`/portfolio/transactions${ticker ? `?ticker=${ticker}` : ""}`),
    buy: (body: { ticker: string; shares: number; price: number; date?: string }) => 
      request<any>("/portfolio/buy", { method: "POST", body: JSON.stringify(body) }),
    sell: (body: { ticker: string; shares: number; price: number; date?: string }) => 
      request<any>("/portfolio/sell", { method: "POST", body: JSON.stringify(body) }),
    editHolding: (body: { ticker: string; shares: number; avgBuyPrice: number }) => 
      request<any>("/portfolio/edit-holding", { method: "POST", body: JSON.stringify(body) }),
    deleteHolding: (ticker: string) => 
      request<any>(`/portfolio/holding/${ticker}`, { method: "DELETE" }),
    importCsv: (csvData: string) => 
      request<any>("/portfolio/import-csv", { method: "POST", body: JSON.stringify({ csvData }) }),
    getExportCsvUrl: () => `${API_BASE}/portfolio/export-csv?token=${localStorage.getItem("stockpilot_token") || ""}`
  },

  // AI Assistant (Gemini)
  ai: {
    analyze: () => request<any>("/ai/analyze", { method: "POST" }),
    weeklySummary: () => request<any>("/ai/weekly-summary", { method: "POST" }),
    chat: (message: string, history: { role: "user" | "model"; content: string }[]) => 
      request<any>("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
    getHistory: () => request<any>("/ai/history")
  },

  // Notifications & Alerts
  notifications: {
    getAlerts: () => request<any>("/notifications"),
    createAlert: (body: { type: string; ticker?: string; targetPrice?: number; condition?: "ABOVE" | "BELOW" }) => 
      request<any>("/notifications", { method: "POST", body: JSON.stringify(body) }),
    toggleAlert: (id: string) => request<any>(`/notifications/${id}/toggle`, { method: "PUT" }),
    deleteAlert: (id: string) => request<any>(`/notifications/${id}`, { method: "DELETE" }),
    checkAlerts: () => request<any>("/notifications/check")
  },

  // Admin Controls
  admin: {
    submitFeedback: (body: { name: string; email: string; message: string }) => 
      request<any>("/admin/feedback", { method: "POST", body: JSON.stringify(body) }),
    getMetrics: () => request<any>("/admin/metrics"),
    getUsers: () => request<any>("/admin/users"),
    getFeedbacks: () => request<any>("/admin/feedbacks"),
    updateUserRole: (id: string, role: "user" | "admin") => 
      request<any>(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) })
  }
};

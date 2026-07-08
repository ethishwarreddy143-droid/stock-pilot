import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (name?: string, profileImage?: string) => Promise<void>;
  watchlist: string[];
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("stockpilot_token"));
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.auth.getProfile();
      setUser(response.user);
      setWatchlist(response.user.watchlist || []);
    } catch (err) {
      // If token expired or invalid, log out
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("stockpilot_token", token);
      fetchProfile();
    } else {
      localStorage.removeItem("stockpilot_token");
      setUser(null);
      setWatchlist([]);
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  };

  const register = async (email: string, password: string, name: string) => {
    return await api.auth.register({ email, password, name });
  };

  const verifyEmail = async (email: string, code: string) => {
    const data = await api.auth.verifyEmail({ email, code });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWatchlist([]);
    localStorage.removeItem("stockpilot_token");
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  const updateProfile = async (name?: string, profileImage?: string) => {
    const data = await api.auth.updateProfile({ name, profileImage });
    setUser(data.user);
  };

  const addToWatchlist = async (ticker: string) => {
    const data = await api.stocks.addToWatchlist(ticker);
    setWatchlist(data.watchlist);
  };

  const removeFromWatchlist = async (ticker: string) => {
    const data = await api.stocks.removeFromWatchlist(ticker);
    setWatchlist(data.watchlist);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        refreshProfile,
        updateProfile,
        watchlist,
        addToWatchlist,
        removeFromWatchlist
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

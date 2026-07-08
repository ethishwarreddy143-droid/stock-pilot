import React, { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { 
  ShieldAlert, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  IndianRupee, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";

export function Admin() {
  const { user } = useAuth();
  
  // States
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [metRes, usrRes, fbkRes] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getUsers(),
        api.admin.getFeedbacks()
      ]);
      setMetrics(metRes.metrics);
      setUsersList(usrRes.users || []);
      setFeedbacks(fbkRes.feedbacks || []);
    } catch {
      setError("Failed to fetch administrative records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const handleUpdateRole = async (id: string, newRole: "user" | "admin") => {
    setError(null);
    setSuccess(null);
    try {
      await api.admin.updateUserRole(id, newRole);
      setSuccess("User role updated successfully.");
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to update user role.");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto font-sans">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Administrative Guard</h2>
        <p className="text-xs text-slate-400">
          This panel is restricted to system administrators only.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 font-sans">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Admin Control Center
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Review system-wide telemetry, update user permissions, and audit public feedback logs.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. METRICS GRID CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        
        {/* Total Registrations */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Total Users</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{metrics?.totalUsers}</div>
          </div>
        </div>

        {/* Total Capital Invested */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Capital Invested</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ₹{metrics?.totalCapitalInvested?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Total Transactions Trade Count */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Global Trades</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{metrics?.totalTrades}</div>
          </div>
        </div>

        {/* Feedback submissions count */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans tracking-wide">Feedbacks Log</span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{metrics?.feedbackCount}</div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. REGISTERED USERS DIRECTORY (Left 2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <span>Registered Investor Profiles</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2 px-3">Investor Name</th>
                  <th className="py-2 px-3">Email Address</th>
                  <th className="py-2 px-3 text-center">Verified</th>
                  <th className="py-2 px-3">Active Watchlist</th>
                  <th className="py-2 px-3">Access Level</th>
                  <th className="py-2 px-3 text-center">Permit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white">{usr.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{usr.email}</td>
                    <td className="py-3 px-3 text-center">
                      {usr.verified ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-rose-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {usr.watchlist?.length || 0} Assets
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        usr.role === "admin" ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {usr.id !== user.id ? (
                        <button
                          onClick={() => handleUpdateRole(usr.id, usr.role === "admin" ? "user" : "admin")}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[10px] font-bold"
                        >
                          TOGGLE
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans">SELF</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. FEEDBACK MESSAGES PANEL (Right 1 col) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <span>Public Feedbacks ({feedbacks.length})</span>
          </h3>

          {feedbacks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              No message submissions logged.
            </div>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/50 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block font-sans">{fb.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{fb.email}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1 font-sans">
                      <Clock className="h-3 w-3" />
                      {new Date(fb.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans p-2 bg-white dark:bg-slate-900 rounded-lg">
                    {fb.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
export default Admin;

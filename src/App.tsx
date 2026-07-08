import React, { useState } from "react";
import { ThemeProvider } from "./components/ThemeContext";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { NavigationProvider, useNavigation } from "./components/NavigationContext";
import { Layout } from "./components/Layout";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { Portfolio } from "./pages/Portfolio";
import { Watchlist } from "./pages/Watchlist";
import { AiAssistant } from "./pages/AiAssistant";
import { Alerts } from "./pages/Alerts";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";

import { 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  KeyRound, 
  User, 
  Activity, 
  X, 
  ShieldCheck, 
  TrendingUp,
  AlertCircle
} from "lucide-react";

type AuthTab = "login" | "register" | "forgot" | "reset" | "verify" | "none";

function MainAppContent() {
  const { user, login, register, verifyEmail, loading } = useAuth();
  const { currentPath, navigate } = useNavigation();

  // Authentication UI toggles
  const [authTab, setAuthTab] = useState<AuthTab>("none");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Registration/Login inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const resetFormStates = () => {
    setAuthError(null);
    setAuthLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login(email, password);
      setAuthTab("none");
      resetFormStates();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Invalid credentials provided.");
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await register(email, password, name);
      // Automatically transition to OTP verification
      setAuthTab("verify");
      setAuthLoading(false);
    } catch (err: any) {
      setAuthError(err.message || "Failed to register profile.");
      setAuthLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await verifyEmail(email, code);
      setAuthTab("none");
      resetFormStates();
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Incorrect verification code. Please try again.");
      setAuthLoading(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans space-y-4">
        <Activity className="h-10 w-10 text-emerald-500 animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">StockPilot Booting...</span>
      </div>
    );
  }

  // Not authenticated user: Show Landing page and Login/Registration overlay sheets
  if (!user) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* Simple top public header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 flex justify-between items-center">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer text-left">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent font-sans">
              StockPilot
            </span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => { setAuthTab("login"); resetFormStates(); }}
              className="h-9 px-4 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setAuthTab("register"); resetFormStates(); }}
              className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </header>

        {/* Dynamic landing view */}
        <main className="py-6">
          <LandingPage onAuthClick={(tab) => { setAuthTab(tab); resetFormStates(); }} />
        </main>

        {/* AUTHENTICATION SHEET MODALS */}
        {authTab !== "none" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-zoom-in font-sans">
              
              <button
                onClick={() => setAuthTab("none")}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium flex gap-2 items-center">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* 1. LOGIN SCREEN */}
              {authTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-center space-y-1 mb-6">
                    <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">Sign In to StockPilot</h3>
                    <p className="text-xs text-slate-400">Access your active portfolio ledger instantly</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {authLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <LogIn className="h-4.5 w-4.5" />
                        <span>SIGN IN NOW</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 space-y-2">
                    <p>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setAuthTab("register")} className="text-emerald-500 font-bold hover:underline">
                        Register Free
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* 2. REGISTRATION SCREEN */}
              {authTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="text-center space-y-1 mb-6">
                    <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">Create Your Account</h3>
                    <p className="text-xs text-slate-400">Join our quantitative investor network</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Marcus Vance"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {authLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <UserPlus className="h-4.5 w-4.5" />
                        <span>REGISTER PROFILE</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                    <p>
                      Already have an account?{" "}
                      <button type="button" onClick={() => setAuthTab("login")} className="text-emerald-500 font-bold hover:underline">
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* 3. OTP VERIFICATION SCREEN */}
              {authTab === "verify" && (
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="text-center space-y-1 mb-6">
                    <h3 className="text-xl font-extrabold text-slate-950 dark:text-white font-sans flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                      <span>Security OTP Code</span>
                    </h3>
                    <p className="text-xs text-slate-400">We generated a 4-digit code to email <span className="font-mono text-emerald-500">{email}</span></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Enter Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. 1234"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono text-center tracking-widest text-lg font-bold"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {authLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <span>VALIDATE SECURITY CODE</span>
                    )}
                  </button>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-400 leading-normal text-center font-sans border border-slate-100 dark:border-slate-850">
                    <span className="font-bold text-slate-900 dark:text-white">Note:</span> Since this is a sandboxed developer workspace environment, your code has been pre-seeded to <span className="font-bold font-mono text-emerald-500">1234</span> for instant validation!
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    );
  }

  // User is registered but not verified (Enforce OTP lock)
  if (!user.verified) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold font-sans">Email OTP Verification Required</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Please verify your identity with your pre-seeded security code to gain access to StockPilot tools.
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 rounded-xl text-xs font-medium">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Enter OTP code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono text-center tracking-widest text-lg font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {authLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <span>VALIDATE SECURITY CODE</span>
              )}
            </button>

            <div className="p-4 rounded-xl bg-slate-950 text-[10px] text-slate-400 leading-normal text-center font-sans border border-slate-850">
              Your verification code is pre-seeded to <span className="font-bold font-mono text-emerald-500">1234</span> for instant sandbox entry!
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Verified layout routing
  const renderRouteContent = () => {
    switch (currentPath) {
      case "/dashboard":
        return <Dashboard />;
      case "/portfolio":
        return <Portfolio />;
      case "/watchlist":
        return <Watchlist />;
      case "/ai-assistant":
        return <AiAssistant />;
      case "/alerts":
        return <Alerts />;
      case "/profile":
        return <Profile />;
      case "/admin":
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderRouteContent()}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationProvider>
          <MainAppContent />
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

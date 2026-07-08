import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigation } from "../components/NavigationContext";
import { api } from "../api";
import { 
  ArrowRight, 
  Sparkles, 
  LineChart, 
  Bell, 
  ShieldCheck, 
  FileText, 
  CheckCircle,
  HelpCircle,
  Send,
  User,
  Quote,
  Activity
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function LandingPage({ onAuthClick }: { onAuthClick: (tab: "login" | "register") => void }) {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  
  // Market Tickers state
  const [indices, setIndices] = useState<any>({
    SP500: { price: 5432.50, change: 18.20, changePercent: 0.34 },
    NASDAQ: { price: 17855.40, change: 105.60, changePercent: 0.60 },
    DOW: { price: 39560.10, change: -45.30, changePercent: -0.11 }
  });

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  // FAQ Expand state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Fetch live market data highlights
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await api.stocks.getMarketSummary();
        if (res.indices) {
          setIndices(res.indices);
        }
      } catch {
        // Silent fallback
      }
    };
    fetchMarket();
    const timer = setInterval(fetchMarket, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    try {
      const res = await api.admin.submitFeedback({
        name: contactName,
        email: contactEmail,
        message: contactMessage
      });
      setContactSuccess(res.message || "Message submitted successfully!");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err: any) {
      setContactSuccess(err.message || "Could not submit feedback.");
    } finally {
      setContactLoading(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: "Gemini AI Portfolio Advisor",
      desc: "Instant portfolio risk analyses, sector diversification audits, and comprehensive weekly recap summaries generated automatically.",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: LineChart,
      title: "Active Ticker Analytics",
      desc: "Stunning historical area charts, live OHLC feeds, PE ratios, and real-time financial reporting updates at your fingertips.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: Bell,
      title: "Custom Price Crossing Alerts",
      desc: "Set real-time above/below price thresholds. Our active polling service watches the tape and alerts you immediately.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: FileText,
      title: "Polished CSV Operations",
      desc: "Take control of your data. Export your trades or import transactions in seconds via CSV to build your portfolio immediately.",
      color: "from-blue-500 to-sky-500"
    }
  ];

  const FAQs: FAQItem[] = [
    {
      question: "How does the StockPilot AI Assistant analyze my portfolio?",
      answer: "StockPilot integrates directly with Gemini, Google's advanced large language model, using our secure backend. It securely aggregates your holdings quantities and buy averages, evaluates sector weights, calculates a consolidated risk score, and generates customized improvement suggestions."
    },
    {
      question: "Do I need real API keys to test out StockPilot features?",
      answer: "No! StockPilot operates on high-fidelity, live-simulated active ticker generators that closely reflect real-world prices. You can place trades, set alerts, and generate reports instantly out-of-the-box. Your Gemini AI advisor operates on our securely pre-configured workspace APIs automatically."
    },
    {
      question: "Can I import bulk transaction history from other brokers?",
      answer: "Absolutely. StockPilot supports a clean CSV import interface. Simply format your file with standard columns: Type (BUY/SELL), Ticker (e.g., AAPL), Shares quantity, Price, and Date, and upload it inside your portfolio manager."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-24 py-6 px-2 font-sans text-slate-800 dark:text-slate-200">
      
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 pt-12 md:pt-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-full text-emerald-500 text-xs font-bold font-sans tracking-wide">
          <Activity className="h-4 w-4 animate-pulse" />
          NATIVE AI INTEGRATED INVESTMENT MANAGER
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-[1.15]">
          Navigate the Markets with{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            AI-Driven Precision
          </span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          The production-grade fintech portfolio engine. Keep your watchlists, track active asset valuations, configure price crossings, and audit sector risk with Gemini.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>ACCESS MY PORTFOLIO</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onAuthClick("register")}
                className="px-6 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>CREATE FREE ACCOUNT</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAuthClick("login")}
                className="px-6 h-12 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-sm font-bold transition-all"
              >
                SIGN IN
              </button>
            </>
          )}
        </div>
      </section>

      {/* 2. LIVE MARKET HIGHLIGHTS TICKER */}
      <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase text-center font-sans">
          Live Market Indices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {Object.entries(indices).map(([key, data]: any) => {
            const isPos = data.changePercent >= 0;
            return (
              <div key={key} className="flex justify-between items-center px-4 pt-4 md:pt-0 first:pt-0">
                <div>
                  <span className="text-sm font-bold text-slate-400 font-sans">{key} Index</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${isPos ? "text-emerald-500" : "text-rose-500"}`}>
                    {isPos ? "+" : ""}{data.change.toFixed(2)}
                  </span>
                  <div className={`text-xs font-mono font-bold mt-1 px-1.5 py-0.5 rounded ${
                    isPos ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {isPos ? "+" : ""}{data.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. KEY FEATURES LIST */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            Engineered for Tactical Investors
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Unifying standard price sheets with next-generation deep learning capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-6 hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 group"
              >
                <div className={`p-4 rounded-xl bg-gradient-to-r ${feat.color} text-white shrink-0 h-14 w-14 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors font-sans">
                    {feat.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PRICING SECTION */}
      <section className="space-y-12 relative">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -z-10" />
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            Transparent Scaling Plans
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Choose the dashboard tier that fits your investment operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 tracking-wider font-sans">STANDARD</span>
                <h3 className="text-2xl font-bold mt-1">Free Tier</h3>
              </div>
              <div className="text-3xl font-bold font-mono">₹0 <span className="text-sm font-normal text-slate-400">/ forever</span></div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Perfect for starting. Log trades and configure notifications immediately.
              </p>
              <ul className="space-y-2.5 text-xs">
                {["Manual Transaction Entry", "Standard Stock Details Charts", "3 Live Price Alerts", "Basic CSV Export"].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onAuthClick("register")}
              className="w-full h-11 border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
            >
              GET STARTED FOR FREE
            </button>
          </div>

          {/* Premium Tier */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-600 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-sans tracking-wide">
              POPULAR
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-500 tracking-wider font-sans">UNLIMITED POWER</span>
                <h3 className="text-2xl font-bold">Pilot Pro</h3>
              </div>
              <div className="text-3xl font-bold font-mono">₹1,599 <span className="text-sm font-normal text-slate-400">/ month</span></div>
              <p className="text-slate-400 text-xs leading-relaxed">
                For tactical capital allocators seeking advanced machine learning advice.
              </p>
              <ul className="space-y-2.5 text-xs">
                {["Unlimited AI Portfolio Diagnostics", "Deep-Reasoning Risk & Diversification Audits", "Bulk CSV Imports & Exports", "Unlimited Price Alerts", "Priority 24/7 Support"].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onAuthClick("register")}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 rounded-xl transition-all"
            >
              UPGRADE TO PRO NOW
            </button>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            Endorsed by Top Traders
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            See how quantitative and retail investors optimize capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The Gemini integration is robust. Getting an instantaneous audit of my sector allocations and a quantitative risk score helps keeping balanced.",
              name: "Marcus Vance",
              title: "Proprietary Trader",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
            },
            {
              quote: "Csv integrations are seamless. I uploaded my 3-year brokerage transaction log, and StockPilot compiled my holdings basis accurately in seconds.",
              name: "Anjali Gupta",
              title: "Quantitative Analyst",
              img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
            },
            {
              quote: "Active price alert crossings is my favorite feature. Setting a notification above support levels ensures I capture breakout entries.",
              name: "Devon Miller",
              title: "Independent Allocator",
              img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <Quote className="h-6 w-6 text-emerald-500/20" />
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm italic leading-relaxed">
                "{item.quote}"
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src={item.img} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white font-sans">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 font-sans">{item.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQs ACCORDION */}
      <section className="space-y-12 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            Frequently Answered Questions
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Clear responses to system architecture and functionality.
          </p>
        </div>

        <div className="space-y-4">
          {FAQs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full text-left p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-850/50"
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-sans">{faq.question}</span>
                  <HelpCircle className={`h-5 w-5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CONTACT / PUBLIC FEEDBACK FORM */}
      <section className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-500 tracking-wider font-sans uppercase">CONTACT SUPPORT</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans leading-tight">
              Have Questions? Drop Us a Line
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              We generally respond within 12 business hours. Your feedback is sent directly to our administrator panel dashboard.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            {contactSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
                {contactSuccess}
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Your Email Address"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Your Message..."
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={contactLoading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all"
            >
              {contactLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>SEND SECURE MESSAGE</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 pt-12 pb-6 text-center text-slate-400 text-xs space-y-4 font-sans">
        <div className="flex justify-center gap-6">
          <a href="#" className="hover:text-slate-600 dark:hover:text-white">Product</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-white">Terms of Use</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-white font-semibold text-emerald-500">Contact Us</a>
        </div>
        <p>© 2026 StockPilot. Managed securely. Designed for quantitative investors globally.</p>
      </footer>

    </div>
  );
}
export default LandingPage;

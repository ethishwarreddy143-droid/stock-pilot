import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { 
  Sparkles, 
  Send, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  HelpCircle,
  BrainCircuit,
  PieChart,
  RefreshCw,
  ThumbsUp,
  AlertTriangle,
  ChevronRight,
  User,
  Bot
} from "lucide-react";

export function AiAssistant() {
  const { user } = useAuth();
  
  // States
  const [analysis, setAnalysis] = useState<any>(null);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; content: string }[]>([]);
  
  // Loading states
  const [analyzing, setAnalyzing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Errors
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAiLogsAndStates = async () => {
    try {
      setLoadingHistory(true);
      const histRes = await api.ai.getHistory();
      setHistory(histRes.history || []);
      
      // Look for latest analysis in history to populate immediately
      const latestAnalysis = histRes.history?.find((h: any) => h.type === "ANALYSIS");
      if (latestAnalysis) {
        setAnalysis(latestAnalysis.response);
      }

      const latestSummary = histRes.history?.find((h: any) => h.type === "WEEKLY_SUMMARY");
      if (latestSummary) {
        setWeeklySummary(latestSummary.response);
      }
    } catch {
      // Fail silently
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchAiLogsAndStates();
  }, []);

  useEffect(() => {
    // Scroll chat window to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.ai.analyze();
      setAnalysis(res.analysis);
      await fetchAiLogsAndStates();
    } catch (err: any) {
      setError(err.message || "Failed to compile Gemini portfolio analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateWeeklySummary = async () => {
    setSummarizing(true);
    setError(null);
    try {
      const res = await api.ai.weeklySummary();
      setWeeklySummary(res.summary);
      await fetchAiLogsAndStates();
    } catch (err: any) {
      setError(err.message || "Failed to generate weekly recap summary.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await api.ai.chat(userMsg, chatHistory);
      setChatHistory((prev) => [...prev, { role: "model", content: res.reply }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: "model", content: "I'm sorry, I encountered a connection issue. Please verify your Gemini API Key configuration." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick Chat Shortcut prompts
  const quickPrompts = [
    "What are the risks of holding tech stock Apple in high concentrations?",
    "Suggest a simple 3-step diversification strategy for beginners",
    "Explain price-to-earnings ratios simply"
  ];

  const triggerQuickPrompt = (promptText: string) => {
    setChatMessage(promptText);
  };

  const parseRiskColor = (score: number) => {
    if (score < 30) return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (score < 65) return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Gemini AI Advisor
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Perform full portfolio diagnostics, audit sector overlap risks, and converse with Gemini.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* SECULATORY DISCLAIMER (High Fidelity Constraint) */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Tactical Financial Notice:</span>
          Generative artificial intelligence audits, consolidated risk metrics, and chat outputs are provided for simulated reference only. These do not constitute real-world certified financial fiduciary recommendations.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: DIAGNOSTICS & SUMMARY */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* A. Dynamic Portfolio Diagnostics */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-emerald-500" />
                <span>AI Portfolio Diagnostics</span>
              </h3>
              <button
                onClick={handleGenerateAnalysis}
                disabled={analyzing}
                className="h-9 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {analyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{analysis ? "RE-AUDIT PORTFOLIO" : "AUDIT PORTFOLIO"}</span>
              </button>
            </div>

            {!analysis ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Click Audit Portfolio to let Gemini calculate risk scores, audit allocations, and generate customized reports.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Risk Score Meter */}
                <div className="flex flex-col sm:flex-row gap-6 items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                  <div className="relative h-28 w-28 shrink-0 flex items-center justify-center border-4 border-slate-200 dark:border-slate-800 rounded-full">
                    <div className="text-center">
                      <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{analysis.riskScore}</span>
                      <span className="text-[9px] text-slate-400 block font-bold">RISK POINT</span>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Class Rating:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${parseRiskColor(analysis.riskScore).bg} ${parseRiskColor(analysis.riskScore).text}`}>
                        {analysis.riskCategory}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans">
                      {analysis.diversificationAnalysis}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase font-sans">Gemini Strategic Directives</h4>
                  <ul className="space-y-2.5">
                    {analysis.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="text-xs leading-relaxed font-sans p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                        <ThumbsUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sector Outlook */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase font-sans">Sector Outlook & Trends</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans">
                    {analysis.sectorOutlook}
                  </p>
                </div>

              </div>
            )}
          </div>

          {/* B. Weekly Market Recap */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                <span>Macro Weekly Summary</span>
              </h3>
              <button
                onClick={handleGenerateWeeklySummary}
                disabled={summarizing}
                className="h-9 px-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {summarizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )}
                <span>GET MACRO RECAP</span>
              </button>
            </div>

            {!weeklySummary ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                Request a Macro recap to let Gemini summarize current active global market forces and general catalysts.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-sans">{weeklySummary.title}</h4>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Predicted Sentiment Outlook:</span>
                    <span className="font-bold text-emerald-500 uppercase">{weeklySummary.sentiment}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{weeklySummary.summaryText}</p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 tracking-wider uppercase font-sans block">Primary Market Catalysts</span>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-500 dark:text-slate-400 font-sans">
                    {weeklySummary.marketCatalysts?.map((cat: string, i: number) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE AI CHAT ASSISTANT */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[700px]">
          
          {/* Chat Header */}
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm font-sans text-slate-900 dark:text-white">Active Companion</h3>
              <span className="text-[10px] text-emerald-500 font-bold font-sans">ONLINE - POWERED BY GEMINI</span>
            </div>
          </div>

          {/* Messages Display Box */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                <Bot className="h-10 w-10 text-emerald-500/20" />
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs">I am your StockPilot companion.</p>
                  <p className="text-[10px] text-slate-500">Ask me anything about stocks, valuations, or portfolio diversification.</p>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-1.5 w-full pt-4">
                  {quickPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => triggerQuickPrompt(p)}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-normal hover:border-emerald-500/20 transition-all cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex gap-2.5 items-start ${chat.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`p-1.5 rounded-full ${chat.role === "user" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    {chat.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl max-w-[80%] font-sans leading-relaxed ${
                    chat.role === "user" 
                      ? "bg-emerald-500 text-white rounded-tr-none" 
                      : "bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850/50 rounded-tl-none text-slate-800 dark:text-slate-300 whitespace-pre-wrap"
                  }`}>
                    {chat.content}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850/50 rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-1.5">
                  <span className="animate-bounce h-1.5 w-1.5 bg-slate-400 rounded-full" style={{ animationDelay: "0ms" }} />
                  <span className="animate-bounce h-1.5 w-1.5 bg-slate-400 rounded-full" style={{ animationDelay: "150ms" }} />
                  <span className="animate-bounce h-1.5 w-1.5 bg-slate-400 rounded-full" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input Bar */}
          <form onSubmit={handleSendChat} className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask stock questions..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatMessage.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
export default AiAssistant;

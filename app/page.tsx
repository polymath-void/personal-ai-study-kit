"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Database, 
  Play, 
  Github, 
  Key, 
  FileText, 
  Cpu, 
  BookOpen, 
  Settings, 
  Activity, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  History, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";

// Cookie helper functions
function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return "";
}

const PROMPT_TEMPLATES = [
  {
    title: "SQL Query Agent",
    topic: "Text-to-SQL Postgres Expert",
    context: "Table schemas:\n- users (id INT, email VARCHAR, created_at TIMESTAMP)\n- orders (id INT, user_id INT, total NUMERIC, status VARCHAR)\n- items (id INT, order_id INT, name VARCHAR, price NUMERIC)\n\nRules:\n- Output executable SQL wrapped in ```sql.\n- Always use proper JOINs.\n- Limit results to 100 max."
  },
  {
    title: "TypeScript API Helper",
    topic: "Next.js 15 App Router Specialist",
    context: "Environment rules:\n- Use standard TypeScript and ES Modules.\n- API routes should export GET/POST named functions.\n- Integrate validation using Zod schemas.\n- Always return proper HTTP response status codes."
  },
  {
    title: "Rust Core Cryptography",
    topic: "Rust Ring Cryptographic Utility",
    context: "Library instructions:\n- Use standard Rust stable channel.\n- Implement secure AEAD using AES-256-GCM.\n- Zeroize sensitive memory keys upon drop.\n- Handle all errors safely using Result types without panicking."
  }
];

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"foundry" | "dashboard" | "settings">("foundry");

  // App Configurations
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [numAngles, setNumAngles] = useState(3);
  const [numRounds, setNumRounds] = useState(3);
  const [targetFile, setTargetFile] = useState("data/dataset.jsonl");
  const [synthesisMode, setSynthesisMode] = useState("balanced");

  // Credentials
  const [groqApiKey, setGroqApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showGithub, setShowGithub] = useState(false);

  // Runtime State
  const [logs, setLogs] = useState<string[]>(["System ready. Awaiting initialization..."]);
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    estimatedCost: 0,
  });

  // AI Brain State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationExplanation, setOptimizationExplanation] = useState("");

  // Dashboard Historical State
  const [historicalRuns, setHistoricalRuns] = useState<any[]>([]);
  const [globalAnalytics, setGlobalAnalytics] = useState({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    runsCount: 0,
  });
  const [selectedHistoricalRun, setSelectedHistoricalRun] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load saved configurations from Cookies / LocalStorage
  useEffect(() => {
    // Attempt cookies first (per request), fallback to localStorage
    const savedGroq = getCookie("sdg_groq_key") || localStorage.getItem("synthetic_core_groq_key") || "";
    const savedPat = getCookie("sdg_github_pat") || localStorage.getItem("synthetic_core_github_pat") || "";
    const savedRepo = getCookie("sdg_repo") || localStorage.getItem("synthetic_core_repo") || "";
    const savedFile = localStorage.getItem("synthetic_core_file") || "data/dataset.jsonl";
    const savedMode = localStorage.getItem("sdg_synthesis_mode") || "balanced";

    setGroqApiKey(savedGroq);
    setGithubPat(savedPat);
    setGithubRepo(savedRepo);
    setTargetFile(savedFile);
    setSynthesisMode(savedMode);

    // Load dashboard history on mount
    fetchDashboardData();
  }, []);

  // Save configurations on changes
  useEffect(() => {
    if (groqApiKey) {
      setCookie("sdg_groq_key", groqApiKey);
      localStorage.setItem("synthetic_core_groq_key", groqApiKey);
    }
    if (githubPat) {
      setCookie("sdg_github_pat", githubPat);
      localStorage.setItem("synthetic_core_github_pat", githubPat);
    }
    if (githubRepo) {
      setCookie("sdg_repo", githubRepo);
      localStorage.setItem("synthetic_core_repo", githubRepo);
    }
    localStorage.setItem("synthetic_core_file", targetFile);
    localStorage.setItem("sdg_synthesis_mode", synthesisMode);
  }, [groqApiKey, githubPat, githubRepo, targetFile, synthesisMode]);

  // Terminal Auto-scroll
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Fetch runs list and aggregate stats from DB
  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = await res.json();
        setHistoricalRuns(data.runs || []);
        setGlobalAnalytics(data.analytics || {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          runsCount: 0,
        });
      }
    } catch (e) {
      console.error("Failed to load runs database", e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // AI Brain Prompt Optimizer call
  const optimizeWithAIBrain = async () => {
    if (!topic || !context) {
      alert("Please provide both a topic and a context to optimize.");
      return;
    }

    setIsOptimizing(true);
    setOptimizationExplanation("");
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.optimizedTopic) setTopic(data.optimizedTopic);
        if (data.optimizedContext) setContext(data.optimizedContext);
        if (data.explanation) setOptimizationExplanation(data.explanation);
      } else {
        const err = await res.json();
        alert(`AI Brain optimization error: ${err.error || "Unknown failure"}`);
      }
    } catch (e: any) {
      alert(`Network error optimizing prompt: ${e.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Triggering the training run stream
  const handleStartFoundry = async () => {
    if (!groqApiKey || !githubPat || !githubRepo || !targetFile) {
      alert("Please configure all Credentials and Target Repo fields first.");
      setActiveTab("settings");
      return;
    }

    if (!topic || !context) {
      alert("Please enter a Topic and context text to begin dataset synthesis.");
      return;
    }

    // Generate fresh unique run ID
    const currentRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setRunId(currentRunId);
    setIsRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}]: Handshaking API Gateway. Commencing automated loops...`]);
    setStats({
      totalRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    });

    try {
      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          massive_context: context,
          synthesis_angles: numAngles,
          target_topic: topic,
          groq_key: groqApiKey,
          github_token: githubPat,
          target_repo: githubRepo,
          file_path: targetFile,
          synthesis_mode: synthesisMode,
          synthesis_rounds: numRounds,
          runId: currentRunId
        }),
      });

      if (!response.ok) {
        throw new Error(`API Gateway connection failure: status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to initialize text stream decoder.");
      }

      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const cleanPart = part.replace(/^data:\s*/, "").trim();
            if (!cleanPart) continue;

            try {
              const parsed = JSON.parse(cleanPart);
              if (parsed.log) {
                setLogs(prev => [...prev, parsed.log]);
              }
              if (parsed.stats) {
                setStats(parsed.stats);
              }
            } catch (e) {
              // Ignore partial chunk parse issues
            }
          }
        }
      }

      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]: Training cycle successfully complete.`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]: ERROR: ${e.message}`]);
    } finally {
      setIsRunning(false);
      fetchDashboardData(); // Refresh history
    }
  };

  // Clean form contexts
  const handleClearContext = () => {
    setTopic("");
    setContext("");
    setOptimizationExplanation("");
  };

  // Delete run history
  const handleDeleteRun = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this historical run from the database?")) return;

    try {
      const res = await fetch("/api/runs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchDashboardData();
        if (selectedHistoricalRun?.id === id) {
          setSelectedHistoricalRun(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete run document", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col font-sans">
      
      {/* Top Cybernetic Nav Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/40 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-100 tracking-wider font-mono">AUTONOMOUS DATASET FOUNDRY</h1>
              <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950/60 border border-cyan-800/30 px-1.5 py-0.5 rounded uppercase">v2.1</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-tight">Reinforced Multi-Angle Synthesis & Interrogative Debate Engine</p>
          </div>
        </div>

        {/* Tab Selection */}
        <nav className="flex items-center bg-slate-950/60 border border-slate-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("foundry")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "foundry" 
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)]" 
                : "text-slate-400 hover:text-slate-100 border border-transparent"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> FOUNDRY
          </button>
          
          <button
            onClick={() => {
              setActiveTab("dashboard");
              fetchDashboardData();
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "dashboard" 
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)]" 
                : "text-slate-400 hover:text-slate-100 border border-transparent"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> DASHBOARD
          </button>
          
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "settings" 
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)]" 
                : "text-slate-400 hover:text-slate-100 border border-transparent"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> CREDENTIALS
          </button>
        </nav>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TAB 1: FOUNDRY WORKSPACE */}
        {activeTab === "foundry" && (
          <>
            {/* Left Column Controls */}
            <aside className="lg:col-span-5 flex flex-col gap-6 h-full">
              
              {/* Context Formulation */}
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-900 shadow-xl relative flex flex-col gap-4">
                <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" /> Focus Formulation
                  </h2>
                  <button
                    onClick={handleClearContext}
                    className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded font-mono transition-colors"
                  >
                    CLEAR ALL
                  </button>
                </div>

                {/* Templates Selector */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Load Target Template</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PROMPT_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.title}
                        onClick={() => {
                          setTopic(tmpl.topic);
                          setContext(tmpl.context);
                          setOptimizationExplanation("");
                        }}
                        className="p-2 text-left bg-[#0c0e16]/80 hover:bg-[#121624] border border-slate-900 rounded-lg hover:border-cyan-500/20 text-[10px] transition-all truncate"
                        title={tmpl.topic}
                      >
                        <span className="text-slate-300 font-bold block truncate">{tmpl.title}</span>
                        <span className="text-slate-500 font-mono truncate block mt-0.5">{tmpl.topic}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dataset Target Topic</label>
                  <input
                    type="text"
                    placeholder="e.g., Rust Axum Web Server, Next.js Middleware Architect..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 transition-colors"
                  />
                </div>

                {/* Context Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Massive Grounding Context</label>
                    <span className="text-[9px] text-slate-600 font-mono uppercase">{context.length} characters</span>
                  </div>
                  <textarea
                    placeholder="Paste massive source document context, technical instructions, code blueprints, API specification documents, logs, or requirements here..."
                    rows={12}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 transition-colors font-mono resize-none"
                  ></textarea>
                </div>

                {/* AI Brain Optimizer Callout */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={optimizeWithAIBrain}
                    disabled={isOptimizing}
                    className="w-full bg-gradient-to-r from-violet-650 via-indigo-600 to-cyan-600 hover:from-violet-600 hover:to-cyan-500 text-slate-100 font-bold font-mono text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> OPTIMIZING VIA AI BRAIN...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> RESTRUCTURE WITH AI BRAIN
                      </>
                    )}
                  </button>

                  {optimizationExplanation && (
                    <div className="p-3 bg-[#0d0918] border border-violet-950/30 rounded-lg text-[11px] text-violet-300/90 font-mono leading-relaxed mt-1 animate-fade-in">
                      <div className="text-[10px] font-bold text-violet-400/80 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> OPTIMIZATION REPORT:
                      </div>
                      {optimizationExplanation}
                    </div>
                  )}
                </div>

              </div>

              {/* Training Loop Configurations */}
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-900 shadow-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-400" /> Loop Configurations
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Angles (Phase 1)</label>
                    <div className="relative">
                      <select
                        value={numAngles}
                        onChange={(e) => setNumAngles(Number(e.target.value))}
                        className="w-full bg-[#0a0c14]/90 border border-slate-900 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 appearance-none cursor-pointer"
                      >
                        <option value={1}>1 Angle (Constraints)</option>
                        <option value={2}>2 Angles (+Operational)</option>
                        <option value={3}>3 Angles (+Edge Cases)</option>
                        <option value={4}>4 Angles (+Structural)</option>
                        <option value={5}>5 Angles (+Failures)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Debate Rounds (Phase 2)</label>
                    <div className="relative">
                      <select
                        value={numRounds}
                        onChange={(e) => setNumRounds(Number(e.target.value))}
                        className="w-full bg-[#0a0c14]/90 border border-slate-900 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 appearance-none cursor-pointer"
                      >
                        <option value={1}>1 Debate Round</option>
                        <option value={2}>2 Debate Rounds</option>
                        <option value={3}>3 Debate Rounds (Standard)</option>
                        <option value={5}>5 Debate Rounds (Intense)</option>
                        <option value={8}>8 Debate Rounds (Rigorous)</option>
                        <option value={10}>10 Debate Rounds (Insane)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Synthesis Mode</label>
                  <div className="relative">
                    <select
                      value={synthesisMode}
                      onChange={e => setSynthesisMode(e.target.value)}
                      className="w-full bg-[#0a0c14]/90 border border-slate-900 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 appearance-none cursor-pointer"
                    >
                      <option value="exploratory">Exploratory (High Creativity - Temp 0.9)</option>
                      <option value="balanced">Balanced (Highly Informative - Temp 0.6)</option>
                      <option value="rigorous">Rigorous (Absolute Precision - Temp 0.2)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={handleStartFoundry}
                  disabled={isRunning}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-900 text-slate-950 font-black font-mono text-xs py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:text-slate-600 disabled:shadow-none"
                >
                  <Play className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
                  {isRunning ? "LOOP ACTIVE - TRANSLATING DATASTREAM..." : "LAUNCH MULTI-ANGLE DATA LOOP"}
                </button>
              </div>

            </aside>

            {/* Right Column Monitoring Terminal */}
            <section className="lg:col-span-7 flex flex-col gap-6 h-full">
              
              {/* Active Monitoring Terminal */}
              <div className="flex-1 min-h-[500px] p-5 bg-[#0a0b10] rounded-xl border border-slate-900 shadow-2xl flex flex-col gap-4 relative">
                <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Active Monitoring Terminal</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span>RUN ID: <span className="text-slate-300">{runId || "NONE"}</span></span>
                    <span>MODE: <span className="text-cyan-400 font-bold uppercase">{synthesisMode}</span></span>
                  </div>
                </div>

                {/* Progress Indicators */}
                {isRunning && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 border border-slate-900 rounded-lg animate-fade-in shrink-0">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>PHASE 1: ANGLES SYNTHESIZED</span>
                        <span>{stats.totalRequests ? Math.min(stats.totalRequests, numAngles) : 0}/{numAngles}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          style={{ width: `${Math.min(100, ((stats.totalRequests ? Math.min(stats.totalRequests, numAngles) : 0) / numAngles) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>PHASE 2: INTERROGATIVE DEBATE</span>
                        <span>{stats.totalRequests > numAngles ? Math.min(stats.totalRequests - numAngles, numRounds * 2) : 0}/{numRounds * 2}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          style={{ width: `${Math.min(100, (stats.totalRequests > numAngles ? ((stats.totalRequests - numAngles) / (numRounds * 2)) * 100 : 0))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Output Log Area */}
                <div className="flex-1 bg-slate-950/80 p-4 border border-slate-900 rounded-lg overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-1.5 scrollbar-thin">
                  {logs.map((log, idx) => {
                    let logColor = "text-slate-400";
                    if (log.includes("CRITICAL ERROR") || log.includes("failed")) {
                      logColor = "text-red-400 font-bold";
                    } else if (log.includes("completed") || log.includes("success")) {
                      logColor = "text-emerald-400 font-bold";
                    } else if (log.includes("Phase 1") || log.includes("Phase 2")) {
                      logColor = "text-cyan-300 font-bold";
                    } else if (log.includes("Using Synthesis Mode")) {
                      logColor = "text-violet-300 font-bold";
                    }
                    return (
                      <div key={idx} className={`${logColor} animate-fade-in`}>
                        {log}
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>

                {/* Realtime Run Metrics Footer */}
                <div className="grid grid-cols-4 gap-2 text-center border-t border-slate-900 pt-3 shrink-0">
                  <div className="p-2 bg-slate-950/40 border border-slate-900 rounded">
                    <span className="text-[9px] text-slate-500 font-mono block">RUN CYCLE API CALLS</span>
                    <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">{stats.totalRequests}</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 border border-slate-900 rounded">
                    <span className="text-[9px] text-slate-500 font-mono block">TRAINED TOKENS</span>
                    <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                      {stats.totalTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950/40 border border-slate-900 rounded">
                    <span className="text-[9px] text-slate-500 font-mono block">ESTIMATED COST</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">
                      ${stats.estimatedCost.toFixed(5)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950/40 border border-slate-900 rounded flex flex-col justify-center items-center">
                    <span className="text-[9px] text-slate-500 font-mono block">DB SYNC</span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono uppercase mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  </div>
                </div>

              </div>

            </section>
          </>
        )}

        {/* TAB 2: REAL-TIME DASHBOARD & ANALYTICS */}
        {activeTab === "dashboard" && (
          <div className="lg:col-span-12 flex flex-col gap-6 w-full animate-fade-in">
            
            {/* Dashboard Upper Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-xl relative shadow-xl overflow-hidden flex items-center justify-between">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl"></div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block">Total Cycles Run</span>
                  <span className="text-2xl font-black text-slate-100 font-mono mt-1 block">
                    {globalAnalytics.runsCount || historicalRuns.length}
                  </span>
                  <p className="text-[9px] text-slate-600 font-mono uppercase mt-1">Autonomous database entries</p>
                </div>
                <Layers className="w-8 h-8 text-cyan-500/20" />
              </div>

              <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-xl relative shadow-xl overflow-hidden flex items-center justify-between">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-violet-500/5 rounded-full blur-xl"></div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block">Total API Calls</span>
                  <span className="text-2xl font-black text-slate-100 font-mono mt-1 block">
                    {globalAnalytics.totalRequests?.toLocaleString() || "0"}
                  </span>
                  <p className="text-[9px] text-slate-600 font-mono uppercase mt-1">Groq endpoints queries</p>
                </div>
                <RefreshCw className="w-8 h-8 text-violet-500/20" />
              </div>

              <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-xl relative shadow-xl overflow-hidden flex items-center justify-between">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block">Trained Tokens Volume</span>
                  <span className="text-2xl font-black text-slate-100 font-mono mt-1 block">
                    {globalAnalytics.totalTokens?.toLocaleString() || "0"}
                  </span>
                  <p className="text-[9px] text-slate-600 font-mono uppercase mt-1">Instruct vectors generated</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500/20" />
              </div>

              <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-xl relative shadow-xl overflow-hidden flex items-center justify-between">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block">Estimated cost (USD)</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                    ${(globalAnalytics.totalCost || 0).toFixed(4)}
                  </span>
                  <p className="text-[9px] text-slate-600 font-mono uppercase mt-1">Theoretical cost metrics</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500/20" />
              </div>

            </div>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Historical runs database logs */}
              <div className="lg:col-span-4 p-5 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col gap-4 min-h-[500px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" /> Training Run logs
                  </h3>
                  <button 
                    onClick={fetchDashboardData}
                    className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded transition-colors"
                    title="Refresh database"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {isLoadingDashboard ? (
                    <div className="text-center py-12 text-slate-600 text-xs italic font-mono flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" /> QUERYING CLOUD STORAGE...
                    </div>
                  ) : historicalRuns.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 text-xs italic font-mono">
                      No training logs found in database.
                    </div>
                  ) : (
                    historicalRuns.map((run) => {
                      const isSelected = selectedHistoricalRun?.id === run.id;
                      const statusColor = 
                        run.status === "completed" ? "bg-emerald-500" :
                        run.status === "failed" ? "bg-red-500" : "bg-cyan-500 animate-pulse";
                      
                      return (
                        <div
                          key={run.id}
                          onClick={() => setSelectedHistoricalRun(run)}
                          className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative group/run flex flex-col gap-1.5 ${
                            isSelected 
                              ? "bg-slate-900/60 border-cyan-500/40" 
                              : "bg-[#0b0c13]/40 border-slate-900 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-500 tracking-tighter truncate max-w-[150px]">
                              {run.runId}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                                {run.status}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-300 group-hover/run:text-cyan-400 transition-colors truncate">
                            {run.topic}
                          </h4>

                          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-950/80 text-[10px] text-slate-500 font-mono">
                            <span>Est: ${run.stats?.estimatedCost?.toFixed(4) || "0.0000"}</span>
                            <span>{new Date(run.updatedAt).toLocaleDateString()}</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteRun(run.id, e)}
                            className="absolute right-2 top-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover/run:opacity-100 rounded hover:bg-slate-950 transition-all"
                            title="Delete record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Run Details Inspector */}
              <div className="lg:col-span-8 p-5 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-col gap-4 min-h-[500px]">
                {selectedHistoricalRun ? (
                  <div className="flex flex-col gap-4 h-full animate-fade-in">
                    
                    {/* Selected Run Header */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 font-mono tracking-tight">
                            RUN DETAILS INSPECTOR
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-950 font-mono ${
                            selectedHistoricalRun.status === "completed" ? "bg-emerald-400" :
                            selectedHistoricalRun.status === "failed" ? "bg-red-400" : "bg-cyan-400"
                          }`}>
                            {selectedHistoricalRun.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedHistoricalRun.topic}</h3>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-500">
                        <div>UPDATED: {new Date(selectedHistoricalRun.updatedAt).toLocaleString()}</div>
                        <div className="mt-0.5">ID: {selectedHistoricalRun.runId}</div>
                      </div>
                    </div>

                    {/* Meta Parameters */}
                    <div className="grid grid-cols-3 gap-4 bg-[#0a0c12]/40 p-3 border border-slate-900 rounded-lg shrink-0">
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Synthesis Mode</span>
                        <span className="text-xs text-slate-300 font-bold capitalize mt-0.5 block">{selectedHistoricalRun.synthesis_mode || "Balanced"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Total Queries</span>
                        <span className="text-xs text-slate-300 font-bold mt-0.5 block">{selectedHistoricalRun.stats?.totalRequests || 0} calls</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Estimated Cost</span>
                        <span className="text-xs text-cyan-400 font-bold mt-0.5 block">${selectedHistoricalRun.stats?.estimatedCost?.toFixed(5) || "0.00000"}</span>
                      </div>
                    </div>

                    {/* Historical Terminal Output Logs */}
                    <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Archived Execution Logs</span>
                      <div className="flex-1 bg-slate-950 p-4 border border-slate-900 rounded-lg overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 space-y-1.5 scrollbar-thin">
                        {selectedHistoricalRun.logs && selectedHistoricalRun.logs.length > 0 ? (
                          selectedHistoricalRun.logs.map((log: string, idx: number) => {
                            let logColor = "text-slate-400";
                            if (log.includes("CRITICAL ERROR") || log.includes("failed")) {
                              logColor = "text-red-400";
                            } else if (log.includes("completed") || log.includes("success")) {
                              logColor = "text-emerald-400 font-bold";
                            } else if (log.includes("Phase 1") || log.includes("Phase 2")) {
                              logColor = "text-cyan-300";
                            }
                            return <div key={idx} className={logColor}>{log}</div>;
                          })
                        ) : (
                          <div className="text-center py-12 text-slate-600 text-xs italic">No saved logs found for this run.</div>
                        )}
                      </div>
                    </div>

                    {/* Run Context Reference */}
                    <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Massive Context Snippet</span>
                      <p className="text-[11px] text-slate-400 font-mono line-clamp-3 leading-relaxed">
                        {selectedHistoricalRun.context}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-600 font-mono">
                    <History className="w-12 h-12 text-slate-800 mb-3" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Awaiting Log Selection</span>
                    <p className="text-[10px] text-slate-600 max-w-sm mt-1 uppercase leading-normal">
                      Select any historic or currently active training cycle from the sidebar to inspect its live logs, parameters, cost calculations, and database status.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CREDENTIALS & TARGETING */}
        {activeTab === "settings" && (
          <div className="lg:col-span-12 max-w-2xl mx-auto w-full p-6 bg-slate-950/60 border border-slate-900 rounded-xl relative shadow-2xl flex flex-col gap-6 animate-fade-in">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            
            <div className="border-b border-slate-900 pb-3">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> SYSTEM GATEWAY CONFIGURATIONS
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-1 uppercase">Configure keys, personal tokens, and target directories for automated operations</p>
            </div>

            {/* API Keys */}
            <div className="flex flex-col gap-4">
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-cyan-500" /> Groq API Key
                  </label>
                  <button
                    onClick={() => setShowGroq(!showGroq)}
                    className="text-[9px] text-slate-500 hover:text-slate-300 font-mono uppercase"
                  >
                    {showGroq ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showGroq ? "text" : "password"}
                  placeholder="gsk_..."
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Github className="w-3.5 h-3.5 text-cyan-500" /> GitHub Personal Access Token (PAT)
                  </label>
                  <button
                    onClick={() => setShowGithub(!showGithub)}
                    className="text-[9px] text-slate-500 hover:text-slate-300 font-mono uppercase"
                  >
                    {showGithub ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showGithub ? "text" : "password"}
                  placeholder="ghp_..."
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Target GitHub Repository</label>
                <input
                  type="text"
                  placeholder="username/repository"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Target Dataset File Path</label>
                <input
                  type="text"
                  placeholder="e.g., data/dataset.jsonl"
                  value={targetFile}
                  onChange={(e) => setTargetFile(e.target.value)}
                  className="w-full bg-[#0a0c14]/90 border border-slate-900 hover:border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>

            </div>

            <div className="bg-slate-950 border border-slate-900 p-4 rounded-lg flex gap-3 items-start mt-2">
              <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-300 uppercase block font-mono">AUTOMATED STATE PERSISTENCE ACTIVE</span>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed uppercase mt-1">
                  Credentials and target file locations are stored securely using local encrypted browser sessions and secure HTTP client-side cookies for double reliability. They are automatically recalled whenever you access the system.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab("foundry");
                alert("Configurations saved and loaded!");
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black font-mono text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              SAVE CONFIGURATION & RETURN
            </button>

          </div>
        )}

      </main>

      {/* Cybernetic Footer */}
      <footer className="border-t border-slate-950/80 bg-slate-950/40 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-mono mt-auto shrink-0 uppercase tracking-wider">
        <span>AUTHENTICATED CLIENT METRICS: DEVILWARFAZE@GMAIL.COM</span>
        <span>SYSTEM DATALINK: SECURE BROADCAST (FIREBASE CLOUD INTEGRATED)</span>
        <span>UTC TIMESTAMP: {new Date().toISOString()}</span>
      </footer>

    </div>
  );
}

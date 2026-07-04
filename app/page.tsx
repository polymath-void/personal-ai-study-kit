"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Database, 
  Play, 
  Github, 
  Key, 
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
  CheckCircle2, 
  Zap, 
  Sliders, 
  Info, 
  BarChart3, 
  RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PROMPT_TEMPLATES = [
  {
    name: "Code Documentation",
    topic: "RESTful Payment Gateway API",
    context: "API reference for a RESTful payment gateway. Includes endpoints for creating charges, refunding transactions, and managing webhooks. Contains details on authentication headers, rate limits (1000 req/min), and standard error responses (400, 401, 403, 429, 500). Authentication uses Bearer tokens. Data payloads are JSON formatted."
  },
  {
    name: "Medical Patient Logs",
    topic: "Acute Respiratory Distress Patient Case",
    context: "Anonymized clinical notes for a 45-year-old patient presenting with symptoms of acute respiratory distress. Includes vital signs history (temp: 38.5C, HR: 110 bpm, SpO2: 88%), prescribed medications (Albuterol, Dexamethasone), and physician's observations over a 48-hour hospital admission period showing gradual improvement with supplemental oxygen."
  },
  {
    name: "Financial Analysis",
    topic: "Tech Company Q3 Earnings",
    context: "Quarterly earnings report for a mid-cap technology company. Highlights revenue growth of 22% in the cloud services division, increased operational costs due to $50M R&D investments in AI, and forward-looking guidance projecting a 15% YoY increase in profit margins. Net income stood at $120M for the quarter."
  }
];

export default function SyntheticDataGenerator() {
  const [topic, setTopic] = useState("");
  const [numAngles, setNumAngles] = useState(3);
  const [context, setContext] = useState("");
  const [rawIdea, setRawIdea] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [synthesisMode, setSynthesisMode] = useState("balanced");
  
  // New features state
  const [apiProvider, setApiProvider] = useState<"gemini" | "groq">("gemini");
  const [debateRoundsMode, setDebateRoundsMode] = useState<"manual" | "auto">("auto");
  const [debateRounds, setDebateRounds] = useState(3);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [optimizationJustification, setOptimizationJustification] = useState("");
  
  const [promptHistory, setPromptHistory] = useState<{id: string, topic: string, context: string, timestamp: string}[]>([]);
  const [logs, setLogs] = useState<string[]>(["System ready. Awaiting initialization..."]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGithubPat, setShowGithubPat] = useState(false);
  
  // Richer statistics state for analytics monitoring
  const [stats, setStats] = useState({
    apiCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    cost: 0,
    completedAngles: 0,
    completedRounds: 0,
    totalCompletions: 0
  });

  // Load configuration from local storage & API
  useEffect(() => {
    // 1. Local storage load
    setTopic(localStorage.getItem("sdg_topic") || "");
    setNumAngles(Number(localStorage.getItem("sdg_numAngles")) || 3);
    setContext(localStorage.getItem("sdg_context") || "");
    setRawIdea(localStorage.getItem("sdg_raw_idea") || "");
    setGroqApiKey(localStorage.getItem("synthetic_core_groq_key") || "");
    setGithubPat(localStorage.getItem("synthetic_core_github_pat") || "");
    setGithubRepo(localStorage.getItem("synthetic_core_repo") || "");
    setSynthesisMode(localStorage.getItem("sdg_synthesis_mode") || "balanced");
    setDebateRoundsMode((localStorage.getItem("sdg_debate_rounds_mode") as "manual" | "auto") || "auto");
    setDebateRounds(Number(localStorage.getItem("sdg_debate_rounds")) || 3);
    
    try {
      const stored = localStorage.getItem("sdg_prompt_history");
      if (stored) {
        setPromptHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse prompt history", e);
    }

    // 2. Load API provider from server state (to check last used API)
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data && data.lastUsedApi) {
          setApiProvider(data.lastUsedApi);
        }
      })
      .catch(err => console.error("Failed to fetch API config from server", err));

    setIsLoaded(true);
  }, []);

  // Save configuration changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("sdg_topic", topic);
    localStorage.setItem("sdg_numAngles", numAngles.toString());
    localStorage.setItem("sdg_context", context);
    localStorage.setItem("sdg_raw_idea", rawIdea);
    localStorage.setItem("synthetic_core_groq_key", groqApiKey);
    localStorage.setItem("synthetic_core_github_pat", githubPat);
    localStorage.setItem("synthetic_core_repo", githubRepo);
    localStorage.setItem("sdg_synthesis_mode", synthesisMode);
    localStorage.setItem("sdg_debate_rounds_mode", debateRoundsMode);
    localStorage.setItem("sdg_debate_rounds", debateRounds.toString());
    localStorage.setItem("sdg_prompt_history", JSON.stringify(promptHistory));
  }, [topic, numAngles, context, rawIdea, groqApiKey, githubPat, githubRepo, synthesisMode, debateRoundsMode, debateRounds, promptHistory, isLoaded]);

  // Sync active API to the server configuration store immediately
  const handleApiChange = async (provider: "gemini" | "groq") => {
    setApiProvider(provider);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api: provider })
      });
      setLogs(prev => [...prev, `[SYSTEM]: API provider updated to ${provider.toUpperCase()} in persistent server state.`]);
    } catch (e) {
      console.error("Failed to update API config on server", e);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setPromptHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setPromptHistory([]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Prompt regeneration based on context (Teacher Agent optimizer)
  const optimizePromptWithAI = async (useRaw: boolean = false) => {
    if (useRaw && !rawIdea.trim()) {
      alert("Please write a raw prompt idea or thought segment first.");
      return;
    }
    if (!useRaw && !topic.trim()) {
      alert("Please enter a focus topic before optimizing, or type a raw idea instead.");
      return;
    }

    setIsOptimizingPrompt(true);
    setLogs(prev => [
      ...prev, 
      useRaw 
        ? `[TEACHER_AGENT]: Fabricating custom structured curriculum from raw idea: "${rawIdea.substring(0, 60)}..."`
        : `[TEACHER_AGENT]: Optimizing and expanding current prompt context for topic "${topic}"...`
    ]);
    
    try {
      const res = await fetch("/api/prompt-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: useRaw ? "" : topic, 
          context: useRaw ? "" : context, 
          rawIdea: useRaw ? rawIdea : "" 
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Optimization failed.");
      }

      setTopic(data.topic);
      setContext(data.context);
      setOptimizationJustification(data.justification);
      
      setLogs(prev => [
        ...prev, 
        `[TEACHER_AGENT COMPLETE]: Regenerated highly instructions-dense training prompt context.`,
        `[JUSTIFICATION]: ${data.justification}`
      ]);
    } catch (error: any) {
      setLogs(prev => [...prev, `[TEACHER_AGENT ERROR]: Prompt optimization failed: ${error.message}`]);
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const startSynthesis = async () => {
    if (!topic || !context || !githubPat || !githubRepo) {
      alert("Please provide the topic, reference context, and GitHub configuration.");
      return;
    }

    if (apiProvider === "groq" && !groqApiKey) {
      alert("Groq API key is required when running in Groq mode.");
      return;
    }
    
    // Store in prompt history
    const existingIndex = promptHistory.findIndex(
      (h) => h.topic.toLowerCase() === topic.toLowerCase() && h.context === context
    );
    let updatedHistory = [...promptHistory];
    if (existingIndex !== -1) {
      const item = updatedHistory.splice(existingIndex, 1)[0];
      item.timestamp = new Date().toLocaleString();
      updatedHistory = [item, ...updatedHistory];
    } else {
      updatedHistory = [
        {
          id: Math.random().toString(36).substring(2, 9),
          topic,
          context,
          timestamp: new Date().toLocaleString()
        },
        ...updatedHistory.slice(0, 9)
      ];
    }
    setPromptHistory(updatedHistory);

    setIsRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}]: Initiating training process run...`]);
    setStats({
      apiCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      completedAngles: 0,
      completedRounds: 0,
      totalCompletions: 0
    });
    
    const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const targetFile = `training_data/${topicSlug}.jsonl`;

    const payload = {
      massive_context: context,
      target_topic: topic,
      synthesis_angles: numAngles,
      groq_key: groqApiKey,
      github_token: githubPat,
      target_repo: githubRepo,
      file_path: targetFile,
      synthesis_mode: synthesisMode,
      api_provider: apiProvider,
      debate_rounds_mode: debateRoundsMode,
      debate_rounds: debateRounds
    };

    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]: Activating state monitors on ${apiProvider.toUpperCase()} Gateway...`]);

    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.body) throw new Error("No response body.");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const dataContent = part.substring(6);
              if (dataContent.startsWith('[STATS] - ')) {
                try {
                  const statsObj = JSON.parse(dataContent.substring(10));
                  setStats(statsObj);
                } catch (e) {
                  // Ignore JSON parsing issues
                }
              } else {
                setLogs(prev => [...prev, dataContent]);
              }
            }
          }
        }
      }
      setLogs(prev => [...prev, `[SUCCESS]: Synthetic core operational. Stream updates writing to GitHub completed successfully.`]);
    } catch (error: any) {
      setLogs(prev => [...prev, `[ERROR]: Pipeline initialization rejected. Check secrets: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const currentTopicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const displayFilePath = topic ? `training_data/${currentTopicSlug}.jsonl` : 'training_data/dataset.jsonl';

  // Calculate percentages for analytics visualization
  const targetRoundsCount = debateRoundsMode === "auto" ? (context.trim().split(/\s+/).length < 100 ? 2 : context.trim().split(/\s+/).length < 300 ? 3 : context.trim().split(/\s+/).length < 600 ? 4 : 5) : debateRounds;
  const anglePercent = Math.min(100, Math.round((stats.completedAngles / numAngles) * 100)) || 0;
  const debatePercent = Math.min(100, Math.round((stats.completedRounds / targetRoundsCount) * 100)) || 0;
  const overallPercent = Math.round((anglePercent + debatePercent) / 2);

  return (
    <div className="flex flex-col h-screen w-full bg-[#050608] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#080a0f] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase flex items-center gap-2">
              SyntheticCore <span className="text-cyan-400">v2.5</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800/50">PROMPT_ENGINEERING</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Autonomous Synthetic Data Architect & State Monitor</p>
          </div>
        </div>
        
        {/* API Choice Status Indicator & Memory Sync */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800/60 rounded-lg">
            <span className="text-[9px] font-mono text-slate-500 uppercase">ENV_API:</span>
            <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase">{apiProvider}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] font-mono text-slate-400">STATE_MONITOR: ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Knowledge Ingestion & Prompt Writing Segment */}
        <aside className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Knowledge Ingestion & Prompt Optimization Panel */}
          <div className="flex flex-col p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative group min-h-[460px]">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400"/> Context Ingestion
              </label>
              
              {/* Dynamic AI Optimise Button for Teacher Agent */}
              <button
                onClick={() => optimizePromptWithAI(false)}
                disabled={isOptimizingPrompt || isRunning}
                className="text-[10px] px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-200 transition-all flex items-center gap-1.5 font-mono disabled:opacity-40"
              >
                {isOptimizingPrompt ? (
                  <><RefreshCw className="w-3 h-3 animate-spin"/> REGENERATING...</>
                ) : (
                  <><Sparkles className="w-3 h-3 text-cyan-400"/> AI REGENERATE PROMPT</>
                )}
              </button>
            </div>

            {/* Prompt Writing Segment / Raw Draft Idea Area */}
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Prompt Writing Segment (Raw Idea)
                </label>
              </div>
              <textarea
                value={rawIdea}
                onChange={e => setRawIdea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded p-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/30 resize-none h-16 leading-relaxed"
                placeholder="Write a rough draft, prompt snippet, or idea (e.g. 'smart contracts secure logging protocol') and let the Teacher Agent generate everything..."
              ></textarea>
              <button
                type="button"
                onClick={() => optimizePromptWithAI(true)}
                disabled={isOptimizingPrompt || isRunning || !rawIdea.trim()}
                className="w-full py-1.5 px-3 bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-200 border border-cyan-800/60 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isOptimizingPrompt ? (
                  <><RefreshCw className="w-3 h-3 animate-spin"/> REGENERATING TITLE & CONTEXT...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 text-cyan-400"/> Build Title & Context via Teacher AI</>
                )}
              </button>
            </div>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Focus Topic (Title)</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Quantum ML Architecture"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            
            <div className="flex-1 flex flex-col relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Raw Reference Context</label>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const tmpl = PROMPT_TEMPLATES[parseInt(e.target.value)];
                      if (tmpl) {
                        setTopic(tmpl.topic);
                        setContext(tmpl.context);
                        setOptimizationJustification("");
                      }
                    }}
                    className="bg-slate-900 border border-slate-800 rounded px-6 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>Load Template...</option>
                    {PROMPT_TEMPLATES.map((t, i) => (
                      <option key={i} value={i}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                placeholder="Type or paste your training context here. Click 'AI REGENERATE PROMPT' to have the Teacher Agent enrich this documentation for optimal data synthesis."
              ></textarea>
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono pointer-events-none uppercase">
                {context.trim() ? context.trim().split(/\s+/).length : 0} Words | {context.length} Chars
              </div>
            </div>

            {/* Teacher Agent Justification Segment */}
            <AnimatePresence>
              {optimizationJustification && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-2.5 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-[10.5px] text-cyan-300 leading-normal flex items-start gap-1.5 font-mono"
                >
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">TEACHER_AGENT_EXPLANATION:</span> {optimizationJustification}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prompt History */}
          <div className="p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative flex flex-col max-h-[220px]">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center justify-between mb-2 shrink-0">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4"/> Input Log History
              </label>
              {promptHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[9px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 font-mono focus:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> CLEAR
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {promptHistory.length === 0 ? (
                <div className="text-center py-4 text-slate-600 text-xs italic">
                  No saved history yet
                </div>
              ) : (
                promptHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-slate-950/60 border border-slate-900 rounded-lg hover:border-cyan-500/30 transition-all group/item flex items-start justify-between gap-2 cursor-pointer"
                    onClick={() => {
                      setTopic(item.topic);
                      setContext(item.context);
                      setOptimizationJustification("");
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-300 truncate group-hover/item:text-cyan-300 transition-colors">
                        {item.topic}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                        {item.context}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="text-slate-600 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover/item:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
        
        {/* Center Column: Live Terminal Logging Feed */}
        <section className="lg:col-span-5 flex flex-col gap-4 h-full">
          <div className="flex-1 bg-[#020305] rounded-xl border border-white/5 overflow-hidden flex flex-col relative min-h-[400px]">
            <div className="bg-[#0a0c12] px-4 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5"/> LIVE_SYSTEM_MONITOR :: OUTPUT_STREAM
              </span>
              <div className="flex items-center gap-3">
                 {isRunning && <span className="text-[10px] font-mono text-emerald-400 animate-pulse">SYNTHESIZING...</span>}
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 font-mono text-[11px] space-y-1.5 overflow-y-auto opacity-90 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log, i) => (
                <p key={i} className={`${
                  log.includes('ERROR') ? 'text-red-400' : 
                  log.includes('SUCCESS') || log.includes('COMPLETE') ? 'text-emerald-400 font-bold' : 
                  log.includes('Phase 1') ? 'text-cyan-400' : 
                  log.includes('Phase 2') ? 'text-amber-400' :
                  log.includes('[TEACHER_AGENT]') ? 'text-purple-400 font-medium' :
                  log.includes('[AUTO-SELECT]') || log.includes('[DEBATE') ? 'text-emerald-400 border-l border-emerald-800 pl-1.5' :
                  'text-slate-300'
                }`}>
                  {log}
                </p>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Real-time Learning Completions Analytics Visualization (SVG Dashboard) */}
          <div className="p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl shrink-0">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-400"/> LEARNING COMPLETIONS MONITOR
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Radial Completion Indicator */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-slate-900 fill-none" strokeWidth="4" />
                    <circle 
                      cx="28" 
                      cy="28" 
                      r="24" 
                      className="stroke-cyan-500 fill-none transition-all duration-500" 
                      strokeWidth="4" 
                      strokeDasharray={`${2 * Math.PI * 24}`} 
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - overallPercent / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono text-cyan-400">
                    {overallPercent}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Overall Progress</div>
                  <div className="text-xs text-white font-semibold">{stats.totalCompletions} States Written</div>
                  <div className="text-[9px] text-emerald-400 uppercase font-mono tracking-wider">IMMUTABLE JSONL</div>
                </div>
              </div>

              {/* Progress Bar 1: 360-Degree Angle Synthesis */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-slate-500 uppercase font-bold">Angle Synthesis</span>
                  <span className="text-cyan-400 font-mono font-bold">{stats.completedAngles}/{numAngles}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${anglePercent}%` }}
                  ></div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono truncate">
                  {stats.completedAngles === numAngles ? "Phase 1 Complete" : "Synthesizing Perspectives"}
                </div>
              </div>

              {/* Progress Bar 2: Autonomous Debate Rounds */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-slate-500 uppercase font-bold">Debate Rounds</span>
                  <span className="text-amber-400 font-mono font-bold">{stats.completedRounds}/{targetRoundsCount}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${debatePercent}%` }}
                  ></div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono truncate">
                  {debateRoundsMode === "auto" ? "Auto-allocated rounds" : "Manually allocated"}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Right Column: Engine Configuration & Key Parameters */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400"/> Engine Control
            </label>
            
            <div className="space-y-4">
              
              {/* API Provider Switching Segment - Preserves to process.env.LAST_USED_API */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400"/> Select Target API
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleApiChange("gemini")}
                    className={`text-[10px] py-1.5 px-2 rounded font-bold transition-all uppercase ${
                      apiProvider === "gemini" 
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Gemini API
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApiChange("groq")}
                    className={`text-[10px] py-1.5 px-2 rounded font-bold transition-all uppercase ${
                      apiProvider === "groq" 
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Groq API
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-mono uppercase">
                  Saves state to server environment dynamically.
                </p>
              </div>

              {/* Debate Round Selection Controller */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400"/> Debate Round Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 mb-2">
                  <button
                    type="button"
                    onClick={() => setDebateRoundsMode("auto")}
                    className={`text-[10px] py-1.5 px-1.5 rounded font-bold transition-all uppercase ${
                      debateRoundsMode === "auto" 
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Auto Context
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebateRoundsMode("manual")}
                    className={`text-[10px] py-1.5 px-1.5 rounded font-bold transition-all uppercase ${
                      debateRoundsMode === "manual" 
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Manual Select
                  </button>
                </div>

                {debateRoundsMode === "manual" ? (
                  <div className="bg-slate-950/40 p-2 rounded border border-slate-900">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 font-mono">ROUND COUNT:</span>
                      <span className="text-xs font-bold text-cyan-400 font-mono">{debateRounds}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={debateRounds}
                      onChange={e => setDebateRounds(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 text-[10px] text-emerald-400/90 leading-relaxed font-mono flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Rounds dynamically adjust (2-5) based on ingestion word count and technical density.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Angles</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numAngles}
                  onChange={e => setNumAngles(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-cyan-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Mode</label>
                <div className="relative">
                  <select
                    value={synthesisMode}
                    onChange={e => setSynthesisMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-cyan-100 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="exploratory">Exploratory (high temperature)</option>
                    <option value="balanced">Balanced (medium temperature)</option>
                    <option value="rigorous">Rigorous (low temperature)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="h-px bg-white/5 my-2"></div>

              {/* Conditionally show/hide Groq key input depending on active API */}
              <AnimatePresence>
                {apiProvider === "groq" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                        <Key className="w-3 h-3"/> Groq API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showGroqKey ? "text" : "password"}
                          value={groqApiKey}
                          onChange={e => setGroqApiKey(e.target.value)}
                          placeholder="gsk_..."
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGroqKey(!showGroqKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                        >
                          {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-cyan-950/10 border border-cyan-900/40 rounded-lg text-[10px] text-slate-400 font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block mr-1.5 align-middle" />
                    <span>Gemini key is secure server-side. No input key required.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <Github className="w-3.5 h-3.5"/> GitHub PAT
                </label>
                <div className="relative">
                  <input
                    type={showGithubPat ? "text" : "password"}
                    value={githubPat}
                    onChange={e => setGithubPat(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubPat(!showGithubPat)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showGithubPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Repo</label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                  placeholder="user/repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              onClick={startSynthesis}
              disabled={isRunning || isOptimizingPrompt}
              className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRunning ? (
                <><Activity className="w-4 h-4 animate-spin"/> Synthesizing...</>
              ) : (
                 <><Play className="w-4 h-4"/> Ignite Synthesis</>
              )}
            </button>
          </div>

          {/* Core Telemetry Stats */}
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-3 flex flex-col justify-center items-center gap-1 shadow-2xl">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider text-center">API Steps Run</div>
              <div className="text-sm font-bold text-white flex items-center gap-1 font-mono">
                <Database className="w-3.5 h-3.5 text-cyan-400"/> {stats.apiCalls} Calls
              </div>
              <div className="text-[9px] text-emerald-400 font-mono">
                {(stats.promptTokens + stats.completionTokens).toLocaleString()} Toks
              </div>
            </div>
            <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-3 flex flex-col justify-center items-center gap-1 shadow-2xl">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Est. Run Cost</div>
              <div className="text-sm font-bold text-white font-mono">
                ${stats.cost > 0 ? stats.cost.toFixed(5) : "0.00000"}
              </div>
              <div className="text-[9px] text-cyan-400 font-mono uppercase">
                Est. API rates
              </div>
            </div>
          </div>
        </aside>

      </main>
      
      {/* Footer */}
      <footer className="h-10 bg-[#080a0f] border-t border-white/5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <span className="text-slate-400">SYSTEM STATUS: <span className="text-emerald-500 font-bold">OPTIMAL</span></span>
          <span className="hidden sm:inline">OUTPUT_PATH: {displayFilePath}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase hidden md:block">
          Autonomous Synthetic Dataset Foundry v2.5
        </div>
      </footer>
    </div>
  );
}

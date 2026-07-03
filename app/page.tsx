"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Database, Play, Github, Key, FileText, Cpu, BookOpen, Settings, Activity, ChevronDown, Eye, EyeOff, History, Trash2 } from "lucide-react";

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
  const [groqApiKey, setGroqApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [synthesisMode, setSynthesisMode] = useState("balanced");
  const [promptHistory, setPromptHistory] = useState<{id: string, topic: string, context: string, timestamp: string}[]>([]);

  const [logs, setLogs] = useState<string[]>(["System ready. Awaiting initialization..."]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGithubPat, setShowGithubPat] = useState(false);
  const [stats, setStats] = useState({
    apiCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    cost: 0
  });

  useEffect(() => {
    setTopic(localStorage.getItem("sdg_topic") || "");
    setNumAngles(Number(localStorage.getItem("sdg_numAngles")) || 3);
    setContext(localStorage.getItem("sdg_context") || "");
    setGroqApiKey(localStorage.getItem("synthetic_core_groq_key") || "");
    setGithubPat(localStorage.getItem("synthetic_core_github_pat") || "");
    setGithubRepo(localStorage.getItem("synthetic_core_repo") || "");
    setSynthesisMode(localStorage.getItem("sdg_synthesis_mode") || "balanced");
    try {
      const stored = localStorage.getItem("sdg_prompt_history");
      if (stored) {
        setPromptHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse prompt history", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("sdg_topic", topic);
    localStorage.setItem("sdg_numAngles", numAngles.toString());
    localStorage.setItem("sdg_context", context);
    localStorage.setItem("synthetic_core_groq_key", groqApiKey);
    localStorage.setItem("synthetic_core_github_pat", githubPat);
    localStorage.setItem("synthetic_core_repo", githubRepo);
    localStorage.setItem("sdg_synthesis_mode", synthesisMode);
    localStorage.setItem("sdg_prompt_history", JSON.stringify(promptHistory));
  }, [topic, numAngles, context, groqApiKey, githubPat, githubRepo, synthesisMode, promptHistory, isLoaded]);

  const deleteHistoryItem = (id: string) => {
    setPromptHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setPromptHistory([]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startSynthesis = async () => {
    if (!topic || !context || !groqApiKey || !githubPat || !githubRepo) {
      alert("Please fill in all configuration fields.");
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
    localStorage.setItem("sdg_prompt_history", JSON.stringify(updatedHistory));

    setIsRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}]: Validating context volume...`]);
    setStats({
      apiCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0
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
      synthesis_mode: synthesisMode
    };

    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}]: Handshaking API Gateway. Commencing automated loops...`]);

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
      setLogs(prev => [...prev, `[SUCCESS]: Synthetic core operational. Stream updates writing to GitHub.`]);
    } catch (error: any) {
      setLogs(prev => [...prev, `[ERROR]: Pipeline initialization rejected by server check. ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const currentTopicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const displayFilePath = topic ? `training_data/${currentTopicSlug}.jsonl` : 'training_data/dataset.jsonl';

  return (
    <div className="flex flex-col h-screen w-full bg-[#050608] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#080a0f] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">SyntheticCore <span className="text-cyan-400">v2.0</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Autonomous Synthetic Data Architect</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] font-mono text-slate-400">GROQ_API: {groqApiKey ? "READY" : "WAITING"}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] font-mono text-slate-400">GH_REPO: {githubRepo ? "READY" : "WAITING"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto lg:overflow-hidden">
        <aside className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Knowledge Ingestion */}
          <div className="flex-1 flex flex-col p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative group min-h-[400px]">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2"><BookOpen className="w-4 h-4"/> Knowledge Ingestion</label>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Focus Topic</label>
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
                className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                placeholder="Paste source documentation..."
              ></textarea>
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono pointer-events-none">
                {context.trim() ? context.trim().split(/\s+/).length : 0} WORDS
              </div>
            </div>
          </div>

          {/* Prompt History */}
          <div className="p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative flex flex-col max-h-[250px]">
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4"/> Prompt History</label>
              {promptHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 font-mono focus:outline-none"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" /> CLEAR
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {promptHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs italic">
                  No saved history yet
                </div>
              ) : (
                promptHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg hover:border-cyan-500/30 transition-all group/item flex items-start justify-between gap-2 cursor-pointer"
                    onClick={() => {
                      setTopic(item.topic);
                      setContext(item.context);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-300 truncate group-hover/item:text-cyan-300 transition-colors">
                        {item.topic}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                        {item.context}
                      </p>
                      <span className="text-[9px] text-slate-600 font-mono block mt-1">
                        {item.timestamp}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover/item:opacity-100 focus:outline-none"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
        
        <section className="lg:col-span-5 flex flex-col gap-4 h-full">
          {/* Terminal */}
          <div className="flex-1 bg-[#020305] rounded-xl border border-white/5 overflow-hidden flex flex-col relative min-h-[400px]">
            <div className="bg-[#0a0c12] px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-2"><Terminal className="w-3 h-3"/> LIVE_TERMINAL_FEED :: SESSION_ID_9821</span>
              <div className="flex items-center gap-3">
                 {isRunning && <span className="text-[10px] font-mono text-emerald-400 animate-pulse">PROCESSING...</span>}
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] space-y-1.5 overflow-y-auto opacity-90">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">System ready. Awaiting initialization...</p>
              ) : (
                <>
                  {logs.map((log, i) => (
                    <p key={i} className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('COMPLETE') ? 'text-emerald-400 font-bold' : log.includes('Phase 1') || log.includes('Phase 2') || log.includes('Phase 3') ? 'text-cyan-400' : log.includes('Student') ? 'text-amber-400 italic' : 'text-slate-300'}`}>
                      {log}
                    </p>
                  ))}
                  <div ref={terminalEndRef} />
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="p-4 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><Settings className="w-4 h-4"/> Engine Configuration</label>
            
            <div className="space-y-4">
               <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Angles</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numAngles}
                  onChange={e => setNumAngles(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Mode</label>
                <div className="relative">
                  <select
                    value={synthesisMode}
                    onChange={e => setSynthesisMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                  >
                    <option value="exploratory">Exploratory (high temperature)</option>
                    <option value="balanced">Balanced (medium temperature)</option>
                    <option value="rigorous">Rigorous (low temperature)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="h-px bg-white/5 my-2"></div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Key className="w-3 h-3"/> Groq API Key</label>
                <div className="relative">
                  <input
                    type={showGroqKey ? "text" : "password"}
                    value={groqApiKey}
                    onChange={e => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 font-mono"
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

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Github className="w-3 h-3"/> GitHub PAT</label>
                <div className="relative">
                  <input
                    type={showGithubPat ? "text" : "password"}
                    value={githubPat}
                    onChange={e => setGithubPat(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 font-mono"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
            </div>

            <button
              onClick={startSynthesis}
              disabled={isRunning}
              className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <><Activity className="w-4 h-4 animate-spin"/> Synthesizing...</>
              ) : (
                 <><Play className="w-4 h-4"/> Ignite Synthesis</>
              )}
            </button>
          </div>

           <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-1.5 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center">API Steps Run</div>
                <div className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400"/> {stats.apiCalls} Calls
                </div>
                <div className="text-[9px] text-emerald-400 uppercase tracking-wider font-mono">
                  {(stats.promptTokens + stats.completionTokens).toLocaleString()} Tokens
                </div>
              </div>
              <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-1.5 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Estimated Cost</div>
                <div className="text-lg font-bold text-white font-mono">
                  ${stats.cost > 0 ? stats.cost.toFixed(5) : "0.00000"}
                </div>
                <div className="text-[9px] text-cyan-400 uppercase tracking-wider font-mono">
                  Standard API Rates
                </div>
              </div>
            </div>
        </aside>

      </main>
      <footer className="h-10 bg-[#080a0f] border-t border-white/5 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <span className="text-slate-400">SYSTEM STATUS: <span className="text-emerald-500">OPTIMAL</span></span>
          <span>STORAGE: {displayFilePath}</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase hidden sm:block">
          Designed for Cloud-Native Edge Execution
        </div>
      </footer>
    </div>
  );
}

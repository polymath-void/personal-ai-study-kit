"use client";

import React from "react";
import { 
  BookOpen, 
  Sparkles, 
  ChevronDown, 
  History, 
  Trash2, 
  Terminal, 
  BarChart3, 
  Settings, 
  Zap, 
  Sliders, 
  Info, 
  Key, 
  Github, 
  Activity, 
  Play, 
  CheckCircle2, 
  Database,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ContextDashboardProps {
  topic: string;
  setTopic: (val: string) => void;
  numAngles: number;
  setNumAngles: (val: number) => void;
  context: string;
  setContext: (val: string) => void;
  rawIdea: string;
  setRawIdea: (val: string) => void;
  groqApiKey: string;
  setGroqApiKey: (val: string) => void;
  githubPat: string;
  setGithubPat: (val: string) => void;
  githubRepo: string;
  setGithubRepo: (val: string) => void;
  synthesisMode: string;
  setSynthesisMode: (val: string) => void;
  apiProvider: "gemini" | "groq";
  handleApiChange: (provider: "gemini" | "groq") => void;
  debateRoundsMode: "manual" | "auto";
  setDebateRoundsMode: (val: "manual" | "auto") => void;
  debateRounds: number;
  setDebateRounds: (val: number) => void;
  isOptimizingPrompt: boolean;
  optimizationJustification: string;
  setOptimizationJustification: (val: string) => void;
  optimizePromptWithAI: (useRaw: boolean) => Promise<void>;
  startSynthesis: () => Promise<void>;
  isRunning: boolean;
  logs: string[];
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
  stats: {
    apiCalls: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    completedAngles: number;
    completedRounds: number;
    totalCompletions: number;
  };
  promptHistory: { id: string; topic: string; context: string; timestamp: string }[];
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  guardState: {
    totalRequests: number;
    totalPushes: number;
    totalCommits: number;
    topicsCreated: number;
    topics: Record<string, any>;
  };
  showGroqKey: boolean;
  setShowGroqKey: (val: boolean) => void;
  showGithubPat: boolean;
  setShowGithubPat: (val: boolean) => void;
}

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

export default function ContextDashboard({
  topic,
  setTopic,
  numAngles,
  setNumAngles,
  context,
  setContext,
  rawIdea,
  setRawIdea,
  groqApiKey,
  setGroqApiKey,
  githubPat,
  setGithubPat,
  githubRepo,
  setGithubRepo,
  synthesisMode,
  setSynthesisMode,
  apiProvider,
  handleApiChange,
  debateRoundsMode,
  setDebateRoundsMode,
  debateRounds,
  setDebateRounds,
  isOptimizingPrompt,
  optimizationJustification,
  setOptimizationJustification,
  optimizePromptWithAI,
  startSynthesis,
  isRunning,
  logs,
  terminalEndRef,
  stats,
  promptHistory,
  clearHistory,
  deleteHistoryItem,
  guardState,
  showGroqKey,
  setShowGroqKey,
  showGithubPat,
  setShowGithubPat
}: ContextDashboardProps) {
  const targetRoundsCount = debateRoundsMode === "auto" ? (context.trim().split(/\s+/).length < 100 ? 2 : context.trim().split(/\s+/).length < 300 ? 3 : context.trim().split(/\s+/).length < 600 ? 4 : 5) : debateRounds;
  const anglePercent = Math.min(100, Math.round((stats.completedAngles / numAngles) * 100)) || 0;
  const debatePercent = Math.min(100, Math.round((stats.completedRounds / targetRoundsCount) * 100)) || 0;
  const overallPercent = Math.round((anglePercent + debatePercent) / 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1">
      {/* Left Column: Topic Ingestion and Parameters */}
      <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* PROMPT WRITING ENGINE */}
        <div id="prompt_writing_card" className="flex flex-col p-5 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative group hover:border-cyan-500/10 transition-all duration-300">
          <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
          
          <div className="flex items-center justify-between mb-4">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400 animate-pulse"/> PROMPT WRITING ENGINE
            </label>
            
            <button
              id="ai_regenerate_top_btn"
              onClick={() => optimizePromptWithAI(false)}
              disabled={isOptimizingPrompt || isRunning}
              className="text-[10px] px-3 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-200 transition-all flex items-center gap-1.5 font-mono disabled:opacity-40 cursor-pointer"
            >
              {isOptimizingPrompt ? (
                <><RefreshCwSpin /> REGENERATING...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 text-cyan-400"/> AI REGENERATE PROMPT</>
              )}
            </button>
          </div>

          {/* Prompt writing Segment / Raw Draft Area */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-5 flex flex-col gap-3 relative">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> 1. Write or Draft Raw Prompt Idea
              </label>
              <span className="text-[8px] text-slate-600 font-mono uppercase">Interactive Fabricator</span>
            </div>
            
            <textarea
              id="raw_idea_textarea"
              value={rawIdea}
              onChange={e => setRawIdea(e.target.value)}
              className="w-full bg-[#050608] border border-slate-900 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/30 resize-none h-20 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
              placeholder="Write a rough draft, prompt snippet, or idea (e.g. 'smart contracts secure logging protocol') and click modifiers below to enhance..."
            ></textarea>

            {/* Prompt modifiers */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Expert Prompt Modifiers (One-Click Append)</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  id="modifier_persona"
                  type="button"
                  onClick={() => {
                    const modifier = "\n\n[PERSONA] Act as a senior technical domain expert with 15+ years of production experience in this specific field, answering with extreme rigor.";
                    setRawIdea(prev => prev.trim() ? prev + modifier : "Act as a senior technical domain expert with 15+ years of production experience. Design a secure high-performance system for...");
                  }}
                  className="text-[9px] px-2.5 py-1 bg-slate-900/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800/60 hover:border-cyan-800/40 rounded-lg font-mono uppercase transition-all duration-200 cursor-pointer flex items-center gap-1"
                >
                  🎭 Persona
                </button>
                <button
                  id="modifier_constraints"
                  type="button"
                  onClick={() => {
                    const modifier = "\n\n[CONSTRAINTS] Define 3 core architectural constraints, safety bounds, performance limits, and strict implementation guidelines.";
                    setRawIdea((prev: string) => prev.trim() ? prev + modifier : = "Define the strict constraints, safety limits, and edge performance criteria for...");
                  }}
                  className="text-[9px] px-2.5 py-1 bg-slate-900/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800/60 hover:border-cyan-800/40 rounded-lg font-mono uppercase transition-all duration-200 cursor-pointer flex items-center gap-1"
                >
                  ⚠️ Constraints
                </button>
                <button
                  id="modifier_schema"
                  type="button"
                  onClick={() => {
                    const modifier = "\n\n[SCHEMA] Formulate a rigorous JSON or typed structural schema outlining expected formats, mandatory fields, and nesting hierarchies.";
                    setRawIdea((prev: string) => prev.trim() ? prev + modifier : "Specify the output schema and expected format rules (such as JSON, CSV, or strict schemas) for...");
                  }}
                  className="text-[9px] px-2.5 py-1 bg-slate-900/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800/60 hover:border-cyan-800/40 rounded-lg font-mono uppercase transition-all duration-200 cursor-pointer flex items-center gap-1"
                >
                  📋 Schema
                </button>
                <button
                  id="modifier_edge"
                  type="button"
                  onClick={() => {
                    const modifier = "\n\n[EDGE_CASES] Identify complex edge conditions, potential race conditions, boundary constraints, and extreme failure points.";
                    setRawIdea(prev => prev.trim() ? prev + modifier : "Detail the edge cases, network partition failures, concurrency races, and error recovery policies for...");
                  }}
                  className="text-[9px] px-2.5 py-1 bg-slate-900/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800/60 hover:border-cyan-800/40 rounded-lg font-mono uppercase transition-all duration-200 cursor-pointer flex items-center gap-1"
                >
                  🔍 Edge Cases
                </button>
              </div>
            </div>

            <button
              id="ai_regenerate_bottom_btn"
              type="button"
              onClick={() => optimizePromptWithAI(true)}
              disabled={isOptimizingPrompt || isRunning || !rawIdea.trim()}
              className="w-full mt-2 py-2.5 px-4 bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-200 border border-cyan-800/60 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.05)]"
            >
              {isOptimizingPrompt ? (
                <><RefreshCwSpin /> REGENERATING TITLE & CONTEXT...</>
              ) : (
                <><Sparkles className="w-4 h-4 text-cyan-400"/> Build Title & Context via Teacher AI</>
              )}
            </button>
          </div>
          
          {/* Active Generated Curriculum Setup */}
          <div className="flex-1 flex flex-col border-t border-white/5 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> 2. Topic & Reference Context Setup
              </label>
              <div className="relative">
                <select
                  id="template_select"
                  onChange={(e) => {
                    const tmpl = PROMPT_TEMPLATES[parseInt(e.target.value)];
                    if (tmpl) {
                      setTopic(tmpl.topic);
                      setContext(tmpl.context);
                      setRawIdea(tmpl.context);
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

            <div className="space-y-4">
              {/* Context Title (Topic) Input */}
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  Context Title / Target Topic (Editable)
                </span>
                <input
                  id="topic_input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the main topic of training (e.g., Deep Learning Architecture)"
                  className="w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-100 font-bold focus:outline-none focus:border-cyan-500/40 leading-relaxed"
                />
              </div>

              {/* Brief Summary (Context) Input */}
              <div className="flex flex-col p-4 bg-slate-950/40 border border-slate-900 rounded-xl min-h-[180px] relative gap-1.5 shadow-inner">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                  Brief Summary / Reference Context Prompt (Editable)
                </span>
                <textarea
                  id="context_textarea"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Write or edit the comprehensive details, key rules, and concept summaries you want the Student AI to master..."
                  className="flex-1 w-full bg-[#050608] border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/40 leading-relaxed resize-none h-28 scrollbar-thin scrollbar-thumb-slate-800"
                />
                <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-slate-500 shrink-0">
                  <span className="uppercase text-slate-600">Editable Context Prompt</span>
                  <span>
                    {context.trim() ? context.trim().split(/\s+/).length : 0} Words | {context.length} Chars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <AnimatePresence>
            {optimizationJustification && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3.5 bg-cyan-950/20 border border-cyan-900/40 rounded-xl text-[10.5px] text-cyan-300 leading-normal flex items-start gap-2.5 font-mono"
              >
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">TEACHER_AGENT_EXPLANATION:</span> {optimizationJustification}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ENGINE CONFIGURATION */}
        <div id="engine_control_card" className="p-5 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl">
          <label className="text-[11px] font-bold text-slate-300 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400"/> ENGINE CONFIGURATION
          </label>
          
          <div className="space-y-4">
            {/* Target API */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400"/> Select Target API
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  id="target_api_gemini_btn"
                  type="button"
                  onClick={() => handleApiChange("gemini")}
                  className={`text-[10px] py-1.5 px-2 rounded font-bold transition-all uppercase cursor-pointer ${
                    apiProvider === "gemini" 
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Gemini API
                </button>
                <button
                  id="target_api_groq_btn"
                  type="button"
                  onClick={() => handleApiChange("groq")}
                  className={`text-[10px] py-1.5 px-2 rounded font-bold transition-all uppercase cursor-pointer ${
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

            {/* Debate Round selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400"/> Debate Round Mode
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 mb-2">
                <button
                  id="debate_round_auto_btn"
                  type="button"
                  onClick={() => setDebateRoundsMode("auto")}
                  className={`text-[10px] py-1.5 px-1.5 rounded font-bold transition-all uppercase cursor-pointer ${
                    debateRoundsMode === "auto" 
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Auto Context
                </button>
                <button
                  id="debate_round_manual_btn"
                  type="button"
                  onClick={() => setDebateRoundsMode("manual")}
                  className={`text-[10px] py-1.5 px-1.5 rounded font-bold transition-all uppercase cursor-pointer ${
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
                    id="debate_rounds_range"
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

            {/* Synthesis Angles */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Angles</label>
              <input
                id="num_angles_input"
                type="number"
                min="1"
                max="5"
                value={numAngles}
                onChange={e => setNumAngles(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-cyan-100 focus:outline-none"
              />
            </div>

            {/* Synthesis Mode */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Synthesis Mode</label>
              <div className="relative">
                <select
                  id="synthesis_mode_select"
                  value={synthesisMode}
                  onChange={e => setSynthesisMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-cyan-100 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="exploratory">Exploratory (high temp)</option>
                  <option value="balanced">Balanced (medium temp)</option>
                  <option value="rigorous">Rigorous (low temp)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="h-px bg-white/5 my-2"></div>

            {/* API Credentials */}
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
                        id="groq_key_input"
                        type={showGroqKey ? "text" : "password"}
                        value={groqApiKey}
                        onChange={e => setGroqApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none font-mono"
                      />
                      <button
                        id="toggle_groq_key_btn"
                        type="button"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
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
                  <span>Gemini key is secure server-side.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                <Github className="w-3.5 h-3.5"/> GitHub PAT
              </label>
              <div className="relative">
                <input
                  id="github_pat_input"
                  type={showGithubPat ? "text" : "password"}
                  value={githubPat}
                  onChange={e => setGithubPat(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pr-10 text-xs text-cyan-100 focus:outline-none font-mono"
                />
                <button
                  id="toggle_github_pat_btn"
                  type="button"
                  onClick={() => setShowGithubPat(!showGithubPat)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showGithubPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Repo</label>
              <input
                id="target_repo_input"
                type="text"
                value={githubRepo}
                onChange={e => setGithubRepo(e.target.value)}
                placeholder="user/repo"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            id="ignite_synthesis_btn"
            onClick={startSynthesis}
            disabled={isRunning || isOptimizingPrompt}
            className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRunning ? (
              <><Activity className="w-4 h-4 animate-spin"/> Synthesizing...</>
            ) : (
               <><Play className="w-4 h-4"/> Ignite Synthesis</>
            )}
          </button>
        </div>

      </div>

      {/* Right Column: Monitors, Outputs, Logs */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* LIVE SYSTEM MONITOR */}
        <div id="terminal_card" className="flex-1 bg-[#020305] rounded-xl border border-white/5 overflow-hidden flex flex-col relative min-h-[350px]">
          <div className="bg-[#0a0c12] px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
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
          
          <div className="flex-1 p-4 font-mono text-[11px] space-y-2 overflow-y-auto opacity-95 scrollbar-thin scrollbar-thumb-slate-800">
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

        {/* LEARNING COMPLETIONS MONITOR */}
        <div id="learning_completions_card" className="p-5 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl shrink-0">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400"/> LEARNING COMPLETIONS MONITOR
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Radial progress */}
            <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
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

            {/* Angle progress */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] mb-1.5">
                <span className="text-slate-500 uppercase font-bold">Angle Synthesis</span>
                <span className="text-cyan-400 font-mono font-bold">{stats.completedAngles}/{numAngles}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${anglePercent}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5 uppercase font-mono truncate">
                {stats.completedAngles === numAngles ? "Phase 1 Complete" : "Synthesizing Perspectives"}
              </div>
            </div>

            {/* Debate rounds progress */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] mb-1.5">
                <span className="text-slate-500 uppercase font-bold">Debate Rounds</span>
                <span className="text-amber-400 font-mono font-bold">{stats.completedRounds}/{targetRoundsCount}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${debatePercent}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5 uppercase font-mono truncate">
                {debateRoundsMode === "auto" ? "Auto-allocated rounds" : "Manually allocated"}
              </div>
            </div>

          </div>
        </div>

        {/* CUMULATIVE CORE STATS */}
        <div id="cumulative_telemetry_grid" className="grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-1 shadow-2xl">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider text-center font-bold">API Steps Run</div>
            <div className="text-base font-bold text-white flex items-center gap-1 font-mono mt-1">
              <Database className="w-4 h-4 text-cyan-400"/> {stats.apiCalls} Calls
            </div>
            <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
              {(stats.promptTokens + stats.completionTokens).toLocaleString()} Toks
            </div>
          </div>
          <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-1 shadow-2xl">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Est. Run Cost</div>
            <div className="text-base font-bold text-white font-mono mt-1">
              ${stats.cost > 0 ? stats.cost.toFixed(5) : "0.00000"}
            </div>
            <div className="text-[9px] text-cyan-400 font-mono uppercase mt-0.5">
              Est. API Rates
            </div>
          </div>
        </div>

        {/* INPUT LOG HISTORY */}
        <div id="input_history_card" className="p-5 bg-[#0a0c12] rounded-xl border border-white/5 shadow-2xl relative flex flex-col max-h-[220px]">
          <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4"/> Input Log History
            </label>
            {promptHistory.length > 0 && (
              <button
                id="clear_history_btn"
                onClick={clearHistory}
                className="text-[9px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 font-mono focus:outline-none cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> CLEAR
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
                  id={`history_item_${item.id}`}
                  key={item.id}
                  className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg hover:border-cyan-500/30 transition-all group/item flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => {
                    setTopic(item.topic);
                    setContext(item.context);
                    setRawIdea(item.context);
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
                    id={`delete_history_${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistoryItem(item.id);
                    }}
                    className="text-slate-600 hover:text-red-400 transition-colors p-0.5 opacity-0 group-hover/item:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Auxiliary mini loading spin component to prevent lint or duplicate references
function RefreshCwSpin() {
  return <span className="animate-spin"><RefreshCwIcon /></span>;
}

function RefreshCwIcon() {
  return (
    <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
    </svg>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Database, Play, Github, Key, FileText, Cpu, BookOpen, Settings, Activity } from "lucide-react";

export default function SyntheticDataGenerator() {
  const [topic, setTopic] = useState("");
  const [numAngles, setNumAngles] = useState(3);
  const [context, setContext] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [githubPat, setGithubPat] = useState("");
  const [githubRepo, setGithubRepo] = useState("");

  const [logs, setLogs] = useState<string[]>(["System ready. Awaiting initialization..."]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTopic(localStorage.getItem("sdg_topic") || "");
    setNumAngles(Number(localStorage.getItem("sdg_numAngles")) || 3);
    setContext(localStorage.getItem("sdg_context") || "");
    setGroqApiKey(localStorage.getItem("synthetic_core_groq_key") || "");
    setGithubPat(localStorage.getItem("synthetic_core_github_pat") || "");
    setGithubRepo(localStorage.getItem("synthetic_core_repo") || "");
  }, []);

  useEffect(() => {
    localStorage.setItem("sdg_topic", topic);
    localStorage.setItem("sdg_numAngles", numAngles.toString());
    localStorage.setItem("sdg_context", context);
    localStorage.setItem("synthetic_core_groq_key", groqApiKey);
    localStorage.setItem("synthetic_core_github_pat", githubPat);
    localStorage.setItem("synthetic_core_repo", githubRepo);
  }, [topic, numAngles, context, groqApiKey, githubPat, githubRepo]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startSynthesis = async () => {
    if (!topic || !context || !groqApiKey || !githubPat || !githubRepo) {
      alert("Please fill in all configuration fields.");
      return;
    }
    
    setIsRunning(true);
    setLogs([`[${new Date().toLocaleTimeString()}]: Validating context volume...`]);
    
    const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const targetFile = `training_data/${topicSlug}.jsonl`;

    const payload = {
      massive_context: context,
      target_topic: topic,
      synthesis_angles: numAngles,
      groq_key: groqApiKey,
      github_token: githubPat,
      target_repo: githubRepo,
      file_path: targetFile
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
          const parts = buffer.split('\\n\\n');
          buffer = parts.pop() || '';
          
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              setLogs(prev => [...prev, part.substring(6)]);
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
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Raw Reference Context</label>
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

              <div className="h-px bg-white/5 my-2"></div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Key className="w-3 h-3"/> Groq API Key</label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={e => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Github className="w-3 h-3"/> GitHub PAT</label>
                <input
                  type="password"
                  value={githubPat}
                  onChange={e => setGithubPat(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-cyan-100 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
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
              <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-2 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Dataset Size</div>
                <div className="text-xl font-bold text-white flex items-center gap-1"><Database className="w-5 h-5 text-emerald-400"/> JSONL</div>
              </div>
              <div className="bg-[#0a0c12] rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center gap-2 shadow-2xl">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Groq Cost</div>
                <div className="text-xl font-bold text-white">$0.00</div>
                <div className="text-[8px] text-cyan-400 uppercase tracking-widest">Free Tier</div>
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

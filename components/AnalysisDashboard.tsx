"use client";

import React from "react";
import { 
  Activity, 
  Trash2, 
  BookOpen, 
  Database, 
  Cpu, 
  Zap, 
  CheckCircle2 
} from "lucide-react";

interface AnalysisDashboardProps {
  guardState: {
    totalRequests: number;
    totalPushes: number;
    totalCommits: number;
    topicsCreated: number;
    topics: Record<string, {
      topic: string;
      context: string;
      percentComplete: number;
      totalDataPoints: number;
      apiRequests: number;
      pushes: number;
      commits: number;
      learnedQAs: any[];
      anglesLearned: any[];
    }>;
  };
  onResetStatistics: () => void;
}

export default function AnalysisDashboard({
  guardState,
  onResetStatistics
}: AnalysisDashboardProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#040508] text-slate-300 h-full rounded-xl border border-white/5 shadow-2xl scrollbar-thin scrollbar-thumb-slate-800 pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> DATA MONITORING GUARD
          </h2>
          <p className="text-xs text-slate-400 font-mono uppercase mt-0.5">Secure Autonomous Process Log Tracker & Statistics Engine</p>
        </div>
        
        <button
          id="reset_stats_btn"
          onClick={onResetStatistics}
          className="text-[10px] py-2 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg font-mono uppercase transition-colors flex items-center gap-1.5 self-start md:self-center cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.05)]"
        >
          <Trash2 className="w-4 h-4" /> Reset Statistics
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Topics Tracked */}
        <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-purple-950/40 border border-purple-900/50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">Topics Tracked</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{guardState.topicsCreated}</div>
          <p className="text-[9px] text-slate-600 uppercase font-mono mt-1">Unique curriculums mapped</p>
        </div>

        {/* Data Points Mapped */}
        <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-cyan-950/40 border border-cyan-900/50 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">Data Points Mapped</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {Object.values(guardState.topics).reduce((sum, t) => sum + (t.totalDataPoints || 0), 0)}
          </div>
          <p className="text-[9px] text-slate-600 uppercase font-mono mt-1">Total synthesis outputs</p>
        </div>

        {/* API Transactions */}
        <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-blue-950/40 border border-blue-900/50 rounded-lg flex items-center justify-center">
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">API Transactions</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{guardState.totalRequests}</div>
          <p className="text-[9px] text-slate-600 uppercase font-mono mt-1">Regenerate & run steps</p>
        </div>

        {/* Pushes Initiated */}
        <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-amber-950/40 border border-amber-900/50 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">Pushes Initiated</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{guardState.totalPushes}</div>
          <p className="text-[9px] text-slate-600 uppercase font-mono mt-1">GitHub API write triggers</p>
        </div>

        {/* Pushes Committed */}
        <div className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
          <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-950/40 border border-emerald-900/50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">Pushes Committed</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{guardState.totalCommits}</div>
          <p className="text-[9px] text-slate-600 uppercase font-mono mt-1">
            Success rate: {guardState.totalPushes > 0 ? Math.round((guardState.totalCommits / guardState.totalPushes) * 100) : 100}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Box: Topic Completion Rates */}
        <div className="xl:col-span-7 p-5 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl flex flex-col min-h-[420px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
            <Database className="w-4 h-4 text-cyan-400" /> Curriculums & Completion Rates
          </h3>
          
          {Object.keys(guardState.topics).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <Database className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs text-slate-500 max-w-sm">
                No curriculum records mapped. Generate or optimize context prompts, and ignite the synthesizers to view live completion analytics.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {Object.values(guardState.topics).map((t, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/70 border border-slate-900/80 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-200">{t.topic}</span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2.5">({t.totalDataPoints} QAs)</span>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-cyan-400">{t.percentComplete}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden relative shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.percentComplete}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-slate-500">
                      <span>API REQS: {t.apiRequests}</span>
                      <span>COMMITS: {t.commits} / {t.pushes}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison bar chart */}
              <div className="mt-8 border-t border-slate-900 pt-6">
                <span className="text-[10px] text-slate-500 font-mono uppercase block mb-4">Comparison Grid (Relative Density)</span>
                <div className="h-28 flex items-end gap-3 px-2">
                  {Object.values(guardState.topics).map((t, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="w-full bg-slate-900 rounded-t-lg relative flex items-end h-24">
                        <div 
                          className="w-full bg-cyan-500/80 hover:bg-cyan-400/95 rounded-t-lg transition-all duration-300 relative shadow-lg shadow-cyan-500/10"
                          style={{ height: `${t.percentComplete}%` }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded font-mono border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {t.percentComplete}%
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 truncate max-w-[90px] text-center" title={t.topic}>
                        {t.topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Box: Guard Auditor Timeline */}
        <div className="xl:col-span-5 p-5 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl flex flex-col h-[420px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Guard Auditor Timeline
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 text-[10px] font-mono text-slate-400">
            <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
              <span className="text-emerald-500 font-bold mr-1.5">[MONITOR ACTIVE]</span>
              <span>System monitoring launched. Guard security rules fully initialized.</span>
            </div>
            {guardState.totalRequests > 0 && (
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-purple-400 font-bold mr-1.5">[OPTIMIZER]</span>
                <span>Audit trace detected {guardState.totalRequests} AI context prompt regeneration requests.</span>
              </div>
            )}
            {guardState.totalPushes > 0 && (
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-amber-500 font-bold mr-1.5">[PUSH TRACE]</span>
                <span>Guard logged {guardState.totalPushes} distinct Git commits sent to upstream GitHub branch.</span>
              </div>
            )}
            {guardState.totalCommits > 0 && (
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-cyan-500 font-bold mr-1.5">[COMMIT CONFIRMED]</span>
                <span>Guard confirmed {guardState.totalCommits} updates successfully deployed as JSONL chunks.</span>
              </div>
            )}
            {Object.values(guardState.topics).length > 0 && (
              <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900">
                <span className="text-blue-400 font-bold mr-1.5">[STATE TRACE]</span>
                <span>Mapping state databases for {Object.values(guardState.topics).length} unique student intelligence topics.</span>
              </div>
            )}
            
            {/* Dynamic List of Topics status */}
            {Object.values(guardState.topics).map((t, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/20 border border-slate-900/40 rounded-lg flex items-center justify-between">
                <span className="truncate max-w-[220px]">★ {t.topic}</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] ${
                  t.percentComplete === 100 
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40" 
                    : "bg-cyan-950/80 text-cyan-400 border border-cyan-800/40"
                }`}>
                  {t.percentComplete === 100 ? "COMMITTED" : "LEARNING"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

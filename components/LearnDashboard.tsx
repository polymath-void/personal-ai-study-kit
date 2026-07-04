"use client";

import React from "react";
import { Database } from "lucide-react";

interface LearnDashboardProps {
  guardState: {
    topics: Record<string, {
      topic: string;
      context: string;
      percentComplete: number;
      totalDataPoints: number;
      apiRequests: number;
      pushes: number;
      commits: number;
      learnedQAs: { round: number; question: string; answer: string }[];
      anglesLearned: { angle: string; content: string }[];
    }>;
  };
  selectedLearnTopicKey: string;
  setSelectedLearnTopicKey: (val: string) => void;
}

export default function LearnDashboard({
  guardState,
  selectedLearnTopicKey,
  setSelectedLearnTopicKey
}: LearnDashboardProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#040508] text-slate-300 h-full rounded-xl border border-white/5 shadow-2xl scrollbar-thin scrollbar-thumb-slate-800 pb-8">
      <div className="border-b border-white/5 pb-5 mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" /> LEARNED DATA ARCHIVE
        </h2>
        <p className="text-xs text-slate-400 font-mono uppercase mt-0.5">Explore High-Fidelity Synthesized Lessons and Autonomous Dialogues</p>
      </div>

      {Object.keys(guardState.topics).length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-14 border border-dashed border-slate-800 rounded-2xl bg-[#0a0c12]/50 max-w-xl mx-auto mt-12">
          <Database className="w-12 h-12 text-slate-700 mb-4 animate-bounce" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Lessons Found</h4>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            The Student AI has not logged any lessons from the Teacher AI yet. Start a synthetic run in the <span className="text-cyan-400 font-bold">ContextTab</span> to generate human-readable learned data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Topics Sidebar selector */}
          <div className="xl:col-span-4 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Select Active Intelligence</span>
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {Object.values(guardState.topics).map((t, idx) => {
                const isSelected = selectedLearnTopicKey === t.topic.toLowerCase().trim();
                return (
                  <div
                    id={`select_topic_${idx}`}
                    key={idx}
                    onClick={() => setSelectedLearnTopicKey(t.topic.toLowerCase().trim())}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-cyan-950/40 border-cyan-500/55 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                        : "bg-[#0a0c12] border-white/5 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <h4 className="text-xs font-bold font-mono truncate">{t.topic}</h4>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-2.5">
                      <span>Progress: {t.percentComplete}%</span>
                      <span>{t.learnedQAs.length} Dialogue Rounds</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Learned QA & Angle viewer */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {(() => {
              const activeTopicData = guardState.topics[selectedLearnTopicKey];
              if (!activeTopicData) {
                return (
                  <div className="p-14 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                    <Database className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                    <span className="text-xs text-slate-500 font-mono">Please select an intelligence topic from the list to examine its learned data.</span>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  
                  {/* Topic Metadata & Context Header */}
                  <div className="p-5 bg-[#0a0c12] border border-white/5 rounded-xl shadow-2xl relative">
                    <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                    <span className="text-[9px] font-bold text-cyan-400 font-mono uppercase tracking-widest block mb-1">Topic Curriculum</span>
                    <h3 className="text-base font-bold text-white font-mono">{activeTopicData.topic}</h3>
                    
                    <div className="mt-3.5 p-4 bg-slate-950/80 border border-slate-900 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reference Ingested Context</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono select-text">{activeTopicData.context}</p>
                    </div>
                  </div>

                  {/* Phase 1: 360-Degree Perspective Analysis */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Phase 1 :: 360° Angle Analysis Models</span>
                    
                    {activeTopicData.anglesLearned && activeTopicData.anglesLearned.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTopicData.anglesLearned.map((angleObj, idx) => (
                          <div key={idx} className="p-4 bg-[#0a0c12] border border-white/5 rounded-xl shadow-md">
                            <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-400 font-mono text-[9px] font-bold uppercase border border-cyan-800/40">
                              {angleObj.angle}
                            </span>
                            <div className="mt-3 text-[11px] font-mono text-slate-400 leading-relaxed max-h-[180px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-slate-800">
                              {angleObj.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#0a0c12]/50 border border-slate-900 rounded-lg text-center text-xs text-slate-600 font-mono">
                        No angle analysis models mapped yet for this topic. Run Phase 1 of synthesis to populate.
                      </div>
                    )}
                  </div>

                  {/* Phase 2: Autonomous Debate Rounds Dialogues */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Phase 2 :: Active Dialogue & Deep Interrogation</span>
                    
                    {activeTopicData.learnedQAs && activeTopicData.learnedQAs.length > 0 ? (
                      <div className="space-y-4">
                        {activeTopicData.learnedQAs.map((qa, idx) => (
                          <div key={idx} className="flex flex-col gap-3.5">
                            
                            {/* Round Banner */}
                            <div className="flex items-center gap-2">
                              <div className="h-px bg-white/5 flex-1"></div>
                              <span className="text-[9px] text-amber-500 font-mono uppercase font-bold px-2.5 py-0.5 rounded-md bg-amber-950/40 border border-amber-900/40">
                                Round {qa.round}
                              </span>
                              <div className="h-px bg-white/5 flex-1"></div>
                            </div>

                            {/* Student Question */}
                            <div className="flex items-start gap-3 max-w-[90%] self-start">
                              <div className="w-7 h-7 rounded-lg bg-amber-900/30 border border-amber-800/50 flex items-center justify-center text-amber-400 text-[10px] font-bold shrink-0">
                                S
                              </div>
                              <div className="bg-amber-950/10 border border-amber-900/30 p-3.5 rounded-2xl rounded-tl-none">
                                <span className="text-[9px] font-mono text-amber-500 uppercase font-bold block mb-1">Student AI (Interrogator)</span>
                                <p className="text-xs text-slate-300 leading-relaxed select-text">{qa.question}</p>
                              </div>
                            </div>

                            {/* Teacher Expert Answer */}
                            <div className="flex items-start gap-3 max-w-[90%] self-end flex-row-reverse">
                              <div className="w-7 h-7 rounded-lg bg-cyan-900/30 border border-cyan-800/50 flex items-center justify-center text-cyan-400 text-[10px] font-bold shrink-0">
                                T
                              </div>
                              <div className="bg-[#0a0c12] border border-white/5 p-4 rounded-2xl rounded-tr-none shadow-md">
                                <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold block mb-1.5">Teacher AI (Master Expert)</span>
                                <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-text">{qa.answer}</p>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#0a0c12]/50 border border-slate-900 rounded-lg text-center text-xs text-slate-600 font-mono">
                        No debate rounds logged yet for this topic. Run Phase 2 of synthesis to generate structured interrogation records.
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </div>

        </div>
      )}
    </div>
  );
}

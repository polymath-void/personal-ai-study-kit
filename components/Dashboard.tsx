"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import MindMap from "./MindMap";
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Sparkles, 
  History, 
  Layers, 
  CheckCircle2, 
  Compass, 
  GraduationCap, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  ChevronRight, 
  BrainCircuit, 
  HelpCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface KeyConcept {
  term: string;
  definition: string;
}

interface MindMapData {
  nodes: Array<{ id: string; label: string; group: "root" | "main" | "detail" }>;
  links: Array<{ source: string; target: string }>;
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface StudyMaterial {
  id: string;
  title: string;
  sourceText: string;
  createdAt: any;
  data: {
    summary: string;
    keyConcepts: KeyConcept[];
    mindMap: MindMapData;
    flashcards: Flashcard[];
    quiz: QuizItem[];
  };
}

const PRESET_EXAMPLES = [
  {
    title: "Quantum Physics Basics",
    desc: "Understand superposition, entanglement, and wave-particle duality.",
    text: `Quantum physics is the branch of physics that studies the behavior of matter and energy at the scale of atoms and subatomic particles. Unlike classical mechanics, quantum mechanics introduces several counterintuitive concepts.

First is Wave-Particle Duality, which states that every particle or quantum entity may be described as either a particle or a wave. Light can behave like discrete packets of energy (photons), while electrons can display diffraction and interference patterns typical of waves.

Second is Quantum Superposition. A quantum system can exist in multiple states or configurations simultaneously until it is measured. The classic thought experiment is Schrödinger's Cat, which is famously both alive and dead until the box is opened.

Third is Quantum Entanglement. This is a phenomenon where two or more particles become interconnected in such a way that the state of one instantly influences the state of another, regardless of the distance between them. Einstein famously referred to this as 'spooky action at a distance.'

Finally, Heisenberg's Uncertainty Principle declares that we cannot simultaneously know both the exact position and momentum of a particle with absolute precision. Measuring one property with high accuracy inherently decreases the accuracy of the other.`
  },
  {
    title: "The Silk Road & Global Trade",
    desc: "Explore the ancient networks that connected Eastern and Western empires.",
    text: `The Silk Road was an ancient network of trade routes established during the Han Dynasty of China, which linked the regions of the ancient world in commerce between 130 BCE and 1453 CE.

Rather than a single continuous highway, the Silk Road was a web of overlapping land and sea passages. Merchant caravans traveled through extreme terrains, from the Gobi Desert to the Pamir Mountains, to exchange goods.

Silk was the most prestigious Chinese export, but trade extended far beyond textiles. China exported porcelain, tea, and paper. Western empires traded horses, gold, glassware, and grapevines. Central Asia contributed jade and wool armor.

Crucially, the Silk Road served as a superhighway for cultural transmission. Buddhism traveled from India to East Asia, while Islam spread from Arabia into Central Asia and Western China. Scientific and medical treatises, papermaking technology, and gunpowder also found their way across continents along these networks.`
  },
  {
    title: "Photosynthesis Explained",
    desc: "The biochemical process converting light into life-sustaining energy.",
    text: `Photosynthesis is the fundamental biochemical process by which photoautotrophs, such as plants, algae, and cyanobacteria, convert light energy into chemical energy. This chemical energy is stored in carbohydrate molecules, like sugars, synthesized from carbon dioxide and water.

The process primarily takes place in organelles called chloroplasts, which house the green pigment chlorophyll. It occurs in two main phases:

1. Light-Dependent Reactions: This initial stage occurs within the thylakoid membranes of chloroplasts. Chlorophyll absorbs sunlight, energizing electrons which are used to split water molecules. This releases oxygen gas as a byproduct and produces energy-carrying molecules: ATP (adenosine triphosphate) and NADPH.

2. Light-Independent Reactions (The Calvin Cycle): Taking place in the stroma (the fluid-filled space of chloroplasts), this phase does not require direct sunlight. It utilizes the ATP and NADPH generated in the first phase to fix atmospheric carbon dioxide into high-energy three-carbon sugars, which are eventually converted into glucose.

Without photosynthesis, the Earth's atmosphere would lack oxygen, and the primary trophic levels of food webs would collapse, ending terrestrial life.`
  }
];

export default function Dashboard() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  
  // Creation States
  const [titleInput, setTitleInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Tabs & Controls
  const [activeTab, setActiveTab] = useState<"insights" | "mindmap" | "flashcards" | "quiz">("insights");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);

  // Load study materials from Firestore on mount
  useEffect(() => {
    async function fetchMaterials() {
      try {
        const q = query(collection(db, "study_materials"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as StudyMaterial[];
        
        setMaterials(fetched);
        if (fetched.length > 0) {
          setSelectedMaterial(fetched[0]);
        }
      } catch (err: any) {
        console.error("Error reading from Firestore:", err);
      }
    }
    fetchMaterials();
  }, []);

  // Handle preset clicks to populate input fields
  const handleSelectPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setTitleInput(preset.title);
    setTextInput(preset.text);
  };

  // Analyze text and create a study session
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      setErrorMsg("Please provide some study material text.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);

    const generatedTitle = titleInput.trim() || `Study Set (${new Date().toLocaleDateString()})`;

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textInput,
          customPrompt: customPrompt.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed.");
      }

      const companionData = await res.json();

      // Store in Firestore for persistent multi-device access
      const newDoc = {
        title: generatedTitle,
        sourceText: textInput,
        createdAt: Timestamp.now(),
        data: companionData
      };

      const docRef = await addDoc(collection(db, "study_materials"), newDoc);
      
      const createdMaterial: StudyMaterial = {
        id: docRef.id,
        ...newDoc
      };

      setMaterials((prev) => [createdMaterial, ...prev]);
      setSelectedMaterial(createdMaterial);
      
      // Reset inputs & close modal
      setTitleInput("");
      setTextInput("");
      setCustomPrompt("");
      setShowDocUploadModal(false);
      setActiveTab("insights");
      resetStudyToolsState();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during study compilation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this study set?")) return;

    try {
      await deleteDoc(doc(db, "study_materials", id));
      const remaining = materials.filter((m) => m.id !== id);
      setMaterials(remaining);
      
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(remaining.length > 0 ? remaining[0] : null);
        resetStudyToolsState();
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
    }
  };

  const resetStudyToolsState = () => {
    setFlashcardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const selectStudySet = (set: StudyMaterial) => {
    setSelectedMaterial(set);
    resetStudyToolsState();
  };

  // Quiz evaluation helper
  const getQuizScore = () => {
    if (!selectedMaterial) return { score: 0, total: 0 };
    const quizList = selectedMaterial.data.quiz;
    let correct = 0;
    quizList.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return { score: correct, total: quizList.length };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-lg">Context Companion</h1>
            <p className="text-xs text-slate-500 font-mono">DURABLE CLOUD-BACKED LEARNING ENGINE</p>
          </div>
        </div>

        <button
          onClick={() => setShowDocUploadModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 transition duration-150"
        >
          <Plus size={16} />
          <span>New Study Set</span>
        </button>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Navigation & History Column */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <History size={14} className="text-slate-400" />
              Saved Study Material
            </h3>

            {materials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  No materials loaded yet. Paste textbook notes or try a sample to start!
                </p>
                <button
                  onClick={() => setShowDocUploadModal(true)}
                  className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Create first set &rarr;
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
                {materials.map((m) => {
                  const isSelected = selectedMaterial?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => selectStudySet(m)}
                      className={`group relative p-3.5 rounded-xl cursor-pointer transition flex flex-col gap-1 border ${
                        isSelected
                          ? "bg-indigo-50/75 border-indigo-200"
                          : "bg-white border-slate-100 hover:bg-slate-50/75"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-semibold text-sm line-clamp-2 leading-snug ${
                          isSelected ? "text-indigo-900" : "text-slate-700"
                        }`}>
                          {m.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(m.id, e)}
                          className="text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition shrink-0"
                          title="Delete study set"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                        <Clock size={10} />
                        <span>
                          {m.createdAt?.seconds 
                            ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() 
                            : "Recent"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Learning Stats HUD */}
          {selectedMaterial && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-xl">
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-300">Companion Statistics</span>
              <h3 className="font-bold text-base mt-0.5 mb-3">Study Coverage</h3>
              
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2">
                  <span className="text-indigo-200">Key Concepts</span>
                  <span className="font-semibold">{selectedMaterial.data.keyConcepts.length} items</span>
                </div>
                <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2">
                  <span className="text-indigo-200">Interactive Mind Nodes</span>
                  <span className="font-semibold">{selectedMaterial.data.mindMap.nodes.length} nodes</span>
                </div>
                <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2">
                  <span className="text-indigo-200">Active Recall Cards</span>
                  <span className="font-semibold">{selectedMaterial.data.flashcards.length} cards</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200">Quiz Assessment</span>
                  <span className="font-semibold">{selectedMaterial.data.quiz.length} Qs</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Side Main Workstation */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {selectedMaterial ? (
            <div className="flex flex-col gap-6">
              {/* Material Overview Banner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                      ACTIVE WORKSPACE
                    </span>
                  </div>
                  <h2 className="font-bold text-2xl text-slate-800 mt-1">{selectedMaterial.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    Compiled directly via Gemini AI on-demand. Persistent in your Secure Cloud Store.
                  </p>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start md:self-auto">
                  {(["insights", "mindmap", "flashcards", "quiz"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs font-semibold px-3 py-2 rounded-lg capitalize transition ${
                        activeTab === tab
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/50"
                      }`}
                    >
                      {tab === "mindmap" ? "Mind Map" : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="min-h-[450px]">
                <AnimatePresence mode="wait">
                  {activeTab === "insights" && (
                    <motion.div
                      key="insights"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6"
                    >
                      {/* Rich Summary & Material Content */}
                      <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <FileText className="text-indigo-500" size={18} />
                          <h3 className="font-bold text-slate-800 text-sm">Deep Companion Summary</h3>
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {selectedMaterial.data.summary}
                        </div>
                      </div>

                      {/* Side list of key definitions */}
                      <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Layers className="text-indigo-500" size={18} />
                          <h3 className="font-bold text-slate-800 text-sm">Key Vocabulary</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                          {selectedMaterial.data.keyConcepts.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 last:border-b-0 pb-3 last:pb-0">
                              <span className="font-bold text-indigo-900 text-xs tracking-tight">{item.term}</span>
                              <span className="text-slate-500 text-xs leading-relaxed">{item.definition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "mindmap" && (
                    <motion.div
                      key="mindmap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Compass className="text-indigo-500" size={18} />
                          <h3 className="font-bold text-slate-800 text-sm">Visual Mind Map Representation</h3>
                        </div>
                      </div>

                      <MindMap 
                        nodes={selectedMaterial.data.mindMap.nodes} 
                        links={selectedMaterial.data.mindMap.links} 
                      />
                    </motion.div>
                  )}

                  {activeTab === "flashcards" && (
                    <motion.div
                      key="flashcards"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-6"
                    >
                      {/* Active Recall Card Box */}
                      <div className="w-full max-w-lg">
                        <div className="h-[280px] w-full [perspective:1000px]">
                          <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className={`relative h-full w-full rounded-2xl border cursor-pointer duration-500 [transform-style:preserve-3d] transition-transform ${
                              isFlipped ? "[transform:rotateY(180deg)]" : ""
                            } ${
                              isFlipped 
                                ? "bg-gradient-to-tr from-indigo-50 to-indigo-100/30 border-indigo-200" 
                                : "bg-white border-slate-100 shadow-md"
                            }`}
                          >
                            {/* Front of card */}
                            <div className="absolute inset-0 h-full w-full rounded-2xl p-6 flex flex-col justify-between [backface-visibility:hidden]">
                              <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                                <span>ACTIVE RECALL DECK</span>
                                <span>{flashcardIndex + 1} OF {selectedMaterial.data.flashcards.length}</span>
                              </div>
                              <div className="text-center py-4">
                                <h3 className="text-lg font-bold text-slate-800 px-4 leading-normal">
                                  {selectedMaterial.data.flashcards[flashcardIndex]?.front}
                                </h3>
                              </div>
                              <div className="text-center text-xs text-indigo-500 font-semibold flex items-center justify-center gap-1">
                                <span>Click to flip card</span>
                              </div>
                            </div>

                            {/* Back of card */}
                            <div className="absolute inset-0 h-full w-full rounded-2xl p-6 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                              <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                                <span>CONCEPT DEFINED</span>
                                <span>ANSWER PATH</span>
                              </div>
                              <div className="text-center py-4">
                                <p className="text-sm text-slate-600 font-medium leading-relaxed px-4">
                                  {selectedMaterial.data.flashcards[flashcardIndex]?.back}
                                </p>
                              </div>
                              <div className="text-center text-xs text-indigo-500 font-semibold">
                                Click to flip back
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flashcard navigation controls */}
                      <div className="flex items-center gap-4 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                        <button
                          disabled={flashcardIndex === 0}
                          onClick={() => {
                            setIsFlipped(false);
                            setTimeout(() => setFlashcardIndex((prev) => Math.max(0, prev - 1)), 150);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition"
                        >
                          &larr; Prev
                        </button>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {flashcardIndex + 1} / {selectedMaterial.data.flashcards.length}
                        </span>
                        <button
                          disabled={flashcardIndex === selectedMaterial.data.flashcards.length - 1}
                          onClick={() => {
                            setIsFlipped(false);
                            setTimeout(() => setFlashcardIndex((prev) => Math.min(selectedMaterial.data.flashcards.length - 1, prev + 1)), 150);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "quiz" && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="text-indigo-500" size={18} />
                          <h3 className="font-bold text-slate-800 text-sm">Assessment Quiz</h3>
                        </div>
                        
                        {quizSubmitted && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                            <span className="text-xs font-mono font-bold text-indigo-700">
                              Score: {getQuizScore().score} / {getQuizScore().total}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quiz questions block */}
                      <div className="flex flex-col gap-6">
                        {selectedMaterial.data.quiz.map((item, qIdx) => {
                          const hasAnswered = quizAnswers[qIdx] !== undefined;
                          const selectedAnswer = quizAnswers[qIdx];
                          const isCorrect = selectedAnswer === item.correctAnswer;
                          
                          return (
                            <div key={qIdx} className="border-b border-slate-50 last:border-b-0 pb-6 last:pb-0">
                              <h4 className="font-semibold text-sm text-slate-800 mb-3 flex gap-2">
                                <span className="text-indigo-500 font-mono">Q{qIdx + 1}.</span>
                                <span>{item.question}</span>
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                {item.options.map((opt, oIdx) => {
                                  const isOptionSelected = selectedAnswer === opt;
                                  const isOptionCorrect = opt === item.correctAnswer;
                                  
                                  let optionStyle = "bg-white border-slate-200 hover:border-slate-300 text-slate-700";
                                  if (quizSubmitted) {
                                    if (isOptionCorrect) {
                                      optionStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium";
                                    } else if (isOptionSelected && !isCorrect) {
                                      optionStyle = "bg-rose-50 border-rose-300 text-rose-800";
                                    } else {
                                      optionStyle = "bg-white border-slate-100 text-slate-400";
                                    }
                                  } else if (isOptionSelected) {
                                    optionStyle = "bg-indigo-50/75 border-indigo-300 text-indigo-950 font-medium";
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={quizSubmitted}
                                      onClick={() => {
                                        setQuizAnswers((prev) => ({
                                          ...prev,
                                          [qIdx]: opt
                                        }));
                                      }}
                                      className={`text-left text-xs p-3 rounded-xl border transition-all ${optionStyle}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation expansion */}
                              {quizSubmitted && (
                                <div className="mt-3 ml-6 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
                                  {isCorrect ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <h5 className="font-bold text-[11px] text-slate-700 tracking-tight uppercase">
                                      {isCorrect ? "Correct answer!" : "Answer key explanation"}
                                    </h5>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                      {item.explanation}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Quiz actions footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                        {!quizSubmitted ? (
                          <button
                            onClick={() => setQuizSubmitted(true)}
                            disabled={Object.keys(quizAnswers).length < selectedMaterial.data.quiz.length}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            Submit Assessment
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 px-3 py-2 rounded-xl transition"
                          >
                            <RotateCcw size={14} />
                            <span>Retake Quiz</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-500 mb-4">
                <BookOpen size={40} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Your Knowledge Hub is Empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                Unlock instant mindmaps, custom summary flashcards, and step-by-step quiz questions. Upload notes or try a curated preset right now.
              </p>
              <button
                onClick={() => setShowDocUploadModal(true)}
                className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md transition"
              >
                <Plus size={14} />
                <span>Upload Study Content</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Creation Modal / Document Upload Overlay */}
      <AnimatePresence>
        {showDocUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setShowDocUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={18} />
                    Compile New Companion Study Set
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Let Gemini extract structured learning aids instantly.</p>
                </div>
                {!isLoading && (
                  <button
                    onClick={() => setShowDocUploadModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-semibold text-lg"
                  >
                    &times;
                  </button>
                )}
              </div>

              <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                {/* Title Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Study Set Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Mitochondria and Cellular Respiration"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    disabled={isLoading}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Preload Presets Row */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-600">Or Select a Sample to Instantly Populate:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_EXAMPLES.map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(ex)}
                        disabled={isLoading}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 text-left rounded-xl transition flex flex-col gap-1"
                      >
                        <span className="font-bold text-slate-700 text-xs tracking-tight">{ex.title}</span>
                        <span className="text-slate-400 text-[10px] leading-snug line-clamp-2">{ex.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Study Notes Text Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Material text, notes, transcripts, or definitions</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Paste or write anything here (at least 20 words). You can supply a textbook excerpt, online course notes, or full lecture transcriptions..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isLoading}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans"
                  />
                </div>

                {/* Optional customized guidance prompt */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <HelpCircle size={14} className="text-slate-400" />
                    Custom Instruction (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Focus intensely on dates, make the terminology easy for beginners, etc."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={isLoading}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium leading-relaxed flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="border-t border-slate-100 pt-5 mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => !isLoading && setShowDocUploadModal(false)}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-80"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Extracting & Compiling...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Build Companion Set</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

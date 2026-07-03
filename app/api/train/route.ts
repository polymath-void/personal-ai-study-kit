import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc } from "firebase/firestore";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqPayload {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  top_p?: number;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqChoice {
  message: {
    content: string;
  };
}

interface GroqResponse {
  choices: GroqChoice[];
  usage?: TokenUsage;
}

// Cost estimation per million tokens
const TEACHER_MODEL = "llama-3.3-70b-versatile";
const STUDENT_MODEL = "llama-3.1-8b-instant";

const PRICING = {
  [TEACHER_MODEL]: { input: 0.59, output: 0.79 },
  [STUDENT_MODEL]: { input: 0.05, output: 0.08 },
};

async function fetchGroq(body: GroqPayload, apiKey: string, log?: (msg: string) => void): Promise<GroqResponse> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error: ${res.status} - ${errText}`);
  }

  return res.json();
}

async function commitToGithub(
  contentLine: string,
  message: string,
  phaseDesc: string,
  target_repo: string,
  file_path: string,
  github_token: string,
  log: (msg: string) => void
) {
  const url = `https://api.github.com/repos/${target_repo}/contents/${file_path}`;
  
  let existingContent = "";
  let sha = "";
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Synthetic-Data-Generator'
      }
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
      existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (e: any) {
    log(`Warning: Could not fetch SHA from GitHub: ${e.message}`);
  }

  const finalContent = existingContent + (existingContent.endsWith('\n') || existingContent === '' ? '' : '\n') + contentLine + '\n';
  const base64Content = Buffer.from(finalContent).toString('base64');

  const commitRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${github_token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Synthetic-Data-Generator'
    },
    body: JSON.stringify({
      message: message,
      content: base64Content,
      sha: sha || undefined
    })
  });

  if (!commitRes.ok) {
    const errorText = await commitRes.text();
    throw new Error(`GitHub commit failed for ${phaseDesc}: ${errorText}`);
  }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const body = await req.json();

  const {
    massive_context,
    synthesis_angles,
    target_topic,
    groq_key,
    github_token,
    target_repo,
    file_path,
    synthesis_mode,
    synthesisMode,
    synthesis_rounds,
    runId
  } = body;

  const resolvedRunId = runId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const stream = new ReadableStream({
    async start(controller) {
      let runLogs: string[] = [];
      let totalRequests = 0;
      let totalTokens = 0;
      let promptTokensCount = 0;
      let completionTokensCount = 0;
      let estimatedCost = 0;

      function log(msg: string) {
        const timestampedMsg = `[${new Date().toLocaleTimeString()}]: ${msg}`;
        runLogs.push(timestampedMsg);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: timestampedMsg })}\n\n`));
        } catch (e) {
          // Stream might be closed
        }
      }

      function logStats() {
        const stats = {
          totalRequests,
          totalTokens,
          promptTokens: promptTokensCount,
          completionTokens: completionTokensCount,
          estimatedCost: parseFloat(estimatedCost.toFixed(5)),
        };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stats })}\n\n`));
        } catch (e) {
          // Stream might be closed
        }
      }

      async function updateFirestore(status: "running" | "completed" | "failed", extraData: any = {}) {
        try {
          const runRef = doc(db, "runs", resolvedRunId);
          await setDoc(runRef, {
            runId: resolvedRunId,
            topic: target_topic,
            context: massive_context,
            synthesis_mode: synthesis_mode || synthesisMode || "balanced",
            status,
            logs: runLogs,
            stats: {
              totalRequests,
              totalTokens,
              promptTokens: promptTokensCount,
              completionTokens: completionTokensCount,
              estimatedCost: parseFloat(estimatedCost.toFixed(5)),
            },
            updatedAt: new Date().toISOString(),
            ...extraData
          }, { merge: true });

          // Update Global Analytics
          const globalRef = doc(db, "analytics", "global");
          await setDoc(globalRef, {
            totalRequests: increment(totalRequests),
            totalTokens: increment(totalTokens),
            totalCost: increment(estimatedCost),
            runsCount: increment(status === "running" ? 1 : 0),
            lastActive: new Date().toISOString()
          }, { merge: true });

        } catch (e: any) {
          console.error("Failed to update Firestore state:", e);
        }
      }

      function trackUsage(model: typeof TEACHER_MODEL | typeof STUDENT_MODEL, usage?: TokenUsage) {
        if (!usage) return;
        totalRequests += 1;
        promptTokensCount += usage.prompt_tokens;
        completionTokensCount += usage.completion_tokens;
        totalTokens += usage.total_tokens;

        const rates = PRICING[model] || { input: 0, output: 0 };
        const cost = (usage.prompt_tokens * rates.input + usage.completion_tokens * rates.output) / 1_000_000;
        estimatedCost += cost;
      }

      try {
        if (!massive_context || !groq_key || !github_token || !target_repo || !file_path) {
          throw new Error("Missing required configuration fields.");
        }

        log(`Initializing Dataset Synthesis run ${resolvedRunId}...`);
        await updateFirestore("running");

        const mode = synthesis_mode || synthesisMode || "balanced";
        let temperature = 0.6;
        let top_p = 0.9;
        if (mode === "exploratory") {
          temperature = 0.9;
          top_p = 0.95;
        } else if (mode === "rigorous") {
          temperature = 0.2;
          top_p = 0.8;
        }
        log(`Using Synthesis Mode: ${mode.toUpperCase()} (Temp: ${temperature}, Top_P: ${top_p})`);

        let existingAngles: string[] = [];
        let completedDebateRounds = 0;
        const debateHistory: GroqMessage[] = [];

        log("Checking remote storage on GitHub for existing state...");
        const githubApiUrl = `https://api.github.com/repos/${target_repo}/contents/${file_path}`;
        
        try {
          const getFileRes = await fetch(githubApiUrl, {
            headers: {
              'Authorization': `token ${github_token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Synthetic-Data-Generator'
            }
          });

          if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            const existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const lines = existingContent.split('\n').filter(Boolean);
            
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed && Array.isArray(parsed.messages)) {
                  if (parsed.metadata) {
                    if (parsed.metadata.phase === 1 && parsed.metadata.angle) {
                      existingAngles.push(parsed.metadata.angle);
                    } else if (parsed.metadata.phase === 2) {
                      completedDebateRounds++;
                      const msgs = parsed.messages;
                      const questionMsg = msgs[msgs.length - 2];
                      const answerMsg = msgs[msgs.length - 1];
                      if (questionMsg && answerMsg) {
                        debateHistory.push({ role: "user", content: questionMsg.content });
                        debateHistory.push({ role: "assistant", content: answerMsg.content });
                      }
                    }
                  } else {
                    const userMsg = parsed.messages.find((m: any) => m.role === 'user' && typeof m.content === 'string' && m.content.includes("perspective of:"));
                    if (userMsg) {
                      const match = userMsg.content.match(/perspective of:\s*([^.]+)/);
                      if (match && match[1]) {
                        existingAngles.push(match[1].trim());
                      }
                    } else {
                      const isDebate = parsed.messages.some((m: any) => m.role === 'system' && typeof m.content === 'string' && m.content.includes("interrogating a master model"));
                      if (isDebate) {
                        completedDebateRounds++;
                        const msgs = parsed.messages;
                        const questionMsg = msgs[msgs.length - 2];
                        const answerMsg = msgs[msgs.length - 1];
                        if (questionMsg && answerMsg) {
                          debateHistory.push({ role: "user", content: questionMsg.content });
                          debateHistory.push({ role: "assistant", content: answerMsg.content });
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                // Ignore parsing errors of specific lines
              }
            }
            log(`Detected existing progress: ${existingAngles.length} angles synthesized, ${completedDebateRounds} debate rounds completed.`);
          } else if (getFileRes.status === 404) {
            log("No existing dataset file found on GitHub. Starting a fresh run.");
          } else {
            log(`Could not verify existing state (GitHub status ${getFileRes.status}). Proceeding fresh.`);
          }
        } catch (error: any) {
          log(`Error querying remote state: ${error.message}. Proceeding fresh.`);
        }

        const angles = ["Technical Constraints", "Operational Logic", "Edge Cases", "Structural Limitations", "Failures"];
        const selectedAngles = angles.slice(0, Math.min(synthesis_angles || 5, angles.length));
        
        // PHASE 1: Angles Synthesis
        for (let i = 0; i < selectedAngles.length; i++) {
          const angle = selectedAngles[i];
          if (existingAngles.includes(angle)) {
            log(`Phase 1 - Angle ${i + 1}: ${angle} already exists on GitHub. Skipping.`);
            continue;
          }
          log(`Phase 1 - Injecting Angle ${i + 1}: ${angle}...`);
          
          const teacherSystemPrompt = `You are an elite research professor specializing in ${target_topic}. You are examining text materials from a 360-degree viewpoint. Your answers must be incredibly comprehensive, technically deep, and strictly grounded in the following provided reference text context: ${massive_context}. Do not invent outside facts. Keep the logic fully on-topic.`;
          
          const messages: GroqMessage[] = [
            { role: "system", content: teacherSystemPrompt },
            { role: "user", content: `Please provide a highly rigorous, full explanation of the topic from the perspective of: ${angle}. Make sure to include operational parameters, pitfalls, and structured solutions.` }
          ];
          
          const response = await fetchGroq({
            model: TEACHER_MODEL,
            messages,
            temperature,
            top_p
          }, groq_key, log);
        
          const teacherAnswer = response.choices[0].message.content;
          trackUsage(TEACHER_MODEL, response.usage);
          logStats();
          
          const dataStr = JSON.stringify({ 
            messages: [...messages, { role: "assistant", content: teacherAnswer }], 
            metadata: { phase: 1, angle } 
          });
          
          await commitToGithub(dataStr, `Append synthesis for angle: ${angle}`, `angle ${angle}`, target_repo, file_path, github_token, log);
          log(`Phase 1 - Angle ${i + 1} completed.`);
          
          await updateFirestore("running", { completedAngles: selectedAngles.slice(0, i + 1) });
        }
        
        // PHASE 2: Student-Teacher Debate
        const teacherDebateSystemPrompt = `You are an elite research professor specializing in ${target_topic}. Your answers must be incredibly comprehensive, technically deep, and strictly grounded in the context provided earlier: ${massive_context}. Keep answers strictly aligned with the document context.`;
        
        const debateRounds = parseInt(synthesis_rounds || "3");
        log(`Commencing Phase 2: Interrogative Debate for ${debateRounds} rounds...`);

        for (let r = 0; r < debateRounds; r++) {
          if (r < completedDebateRounds) {
            log(`Phase 2 - Debate Round ${r + 1} already exists on GitHub. Skipping.`);
            continue;
          }
          log(`Phase 2 - Debate Round ${r + 1}: Student model is formulating interrogation...`);
          
          const studentMessages: GroqMessage[] = [
            { 
              role: "system", 
              content: `You are an adversarial student researcher trying to find logical flaws, unaddressed constraints, or extreme operational edge cases in a master model's claims about ${target_topic}. Keep questions highly precise, rigorous, and relevant to the context: ${massive_context}.` 
            },
            ...debateHistory,
            { 
              role: "user", 
              content: `Formulate a highly challenging, technically demanding question that scrutinizes the master model's previous assertions or delves deeper into unaddressed complexities in ${target_topic}.` 
            }
          ];
          
          const studentResponse = await fetchGroq({
            model: STUDENT_MODEL,
            messages: studentMessages,
            temperature: 0.8,
            top_p: 0.9
          }, groq_key, log);
          
          const question = studentResponse.choices[0].message.content;
          trackUsage(STUDENT_MODEL, studentResponse.usage);
          logStats();
          
          log(`Phase 2 - Debate Round ${r + 1}: Question formulated! Master model is synthesizing defense...`);
          
          const teacherMessages: GroqMessage[] = [
            { role: "system", content: teacherDebateSystemPrompt },
            ...debateHistory,
            { role: "user", content: question }
          ];
          
          const teacherResponse = await fetchGroq({
            model: TEACHER_MODEL,
            messages: teacherMessages,
            temperature,
            top_p
          }, groq_key, log);
          
          const answer = teacherResponse.choices[0].message.content;
          trackUsage(TEACHER_MODEL, teacherResponse.usage);
          logStats();
          
          debateHistory.push({ role: "user", content: question });
          debateHistory.push({ role: "assistant", content: answer });
          
          const dataStr = JSON.stringify({ 
            messages: [...teacherMessages, { role: "assistant", content: answer }], 
            metadata: { phase: 2, round: r + 1 } 
          });
          
          await commitToGithub(dataStr, `Append debate round ${r + 1}`, `debate round ${r + 1}`, target_repo, file_path, github_token, log);
          log(`Phase 2 - Debate Round ${r + 1} completed.`);
          
          await updateFirestore("running", { completedRounds: r + 1, totalRounds: debateRounds });
        }
        
        log("Automated Loop complete. Synthetic dataset fully committed to GitHub.");
        await updateFirestore("completed", { completedRounds: debateRounds, totalRounds: debateRounds });
        
        controller.close();
      } catch (error: any) {
        log(`CRITICAL ERROR: ${error.message}`);
        await updateFirestore("failed", { lastError: error.message });
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    }
  });
}

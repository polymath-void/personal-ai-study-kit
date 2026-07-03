import { NextRequest } from 'next/server';

interface GroqMessage {
  role: string;
  content: string;
}

interface GroqPayload {
  model: string;
  messages: GroqMessage[];
}

async function fetchGroq(body: GroqPayload, apiKey: string, log?: (msg: string) => void) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const delays = [2000, 4000, 8000];
  
  for (let attempt = 0; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (res.status === 429) {
      if (attempt < 3) {
        log?.(`Groq API rate limit hit (HTTP 429). Retrying in ${delays[attempt]/1000}s (Attempt ${attempt + 1}/3)...`);
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      } else {
        log?.(`Groq API failed after 3 retries.`);
      }
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      log?.(`Groq API Error: ${res.status} - ${errorText}`);
      throw new Error(`Groq API Error: ${res.status} - ${errorText}`);
    }
    
    log?.(`Groq API call successful.`);
    return res.json();
  }
}

async function commitToGithub(trainingDataStr: string, commitMessage: string, contextMsg: string, githubRepo: string, githubPath: string, githubPat: string, log: (msg: string) => void) {
  log(`Committing data for ${contextMsg}...`);
  const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubPath}`;
  
  try {
    const getFileRes = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `token ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Synthetic-Data-Generator'
      }
    });
    
    let existingContent = "";
    let sha: string | undefined = undefined;
    
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      sha = fileData.sha;
      existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    } else if (getFileRes.status !== 404) {
      throw new Error(`GitHub API Error during GET: ${getFileRes.status} - ${await getFileRes.text()}`);
    }
    
    const newContent = existingContent + (existingContent && !existingContent.endsWith('\n') ? '\n' : '') + trainingDataStr + '\n';
    const newContentBase64 = Buffer.from(newContent, 'utf-8').toString('base64');
    
    const putFileRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Synthetic-Data-Generator'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: newContentBase64,
        sha: sha
      })
    });
    
    if (!putFileRes.ok) {
      throw new Error(`GitHub PUT Error: ${putFileRes.status} - ${await putFileRes.text()}`);
    }
    log(`Commit successful.`);
  } catch (error: any) {
    log(`Commit failed: ${error.message}`);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { 
    target_topic, 
    massive_context, 
    synthesis_angles, 
    groq_key, 
    github_token, 
    target_repo, 
    file_path 
  } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function log(message: string) {
        const time = new Date().toLocaleTimeString();
        controller.enqueue(encoder.encode(`data: [${time}] - ${message}\n\n`));
      }

      const runStats = {
        apiCalls: 0,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0
      };

      function logStats() {
        controller.enqueue(encoder.encode(`data: [STATS] - ${JSON.stringify(runStats)}\n\n`));
      }

      try {
        log("Initialization started... Orchestrating environment.");
        
        if (!target_topic || !massive_context || !groq_key || !github_token || !target_repo || !file_path) {
          throw new Error("Missing required configuration fields.");
        }

        const angles = ["Technical Constraints", "Operational Logic", "Edge Cases", "Structural Limitations", "Failures"];
        const selectedAngles = angles.slice(0, Math.min(synthesis_angles, angles.length));
        
        // Phase 1: 360-Degree Synthesis
        for (let i = 0; i < selectedAngles.length; i++) {
          const angle = selectedAngles[i];
          log(`Phase 1 - Injecting Angle ${i + 1}: ${angle}...`);
          
          const teacherSystemPrompt = `You are an elite research professor specializing in ${target_topic}. You are examining text materials from a 360-degree viewpoint. Your answers must be incredibly comprehensive, technically deep, and strictly grounded in the following provided reference text context: ${massive_context}. Do not invent outside facts.`;
          
          const anglePrompt = `Analyze the topic from the perspective of: ${angle}. Provide a detailed analysis based solely on the reference text.`;
        
          const messages = [
            { role: "system", content: teacherSystemPrompt },
            { role: "user", content: anglePrompt }
          ];
        
          const response = await fetchGroq({
            model: "llama-3.3-70b-versatile",
            messages,
          }, groq_key, log);
        
          const teacherAnswer = response.choices[0].message.content;
          
          // Update Stats
          if (response?.usage) {
            const pTokens = response.usage.prompt_tokens || 0;
            const cTokens = response.usage.completion_tokens || 0;
            runStats.apiCalls += 1;
            runStats.promptTokens += pTokens;
            runStats.completionTokens += cTokens;
            runStats.cost += (pTokens * 0.59 + cTokens * 0.79) / 1000000;
            logStats();
          }
          
          const dataStr = JSON.stringify({ messages: [...messages, { role: "assistant", content: teacherAnswer }] });
          await commitToGithub(dataStr, `Append synthesis for angle: ${angle}`, `angle ${angle}`, target_repo, file_path, github_token, log);
          
          log(`Phase 1 - Angle ${i + 1} completed.`);
        }
        
        // Phase 2: Autonomous Debate
        log(`Phase 2 - Initiating Autonomous Debate (Student vs Teacher)...`);
        const studentSystemPrompt = `You are an inquisitive junior AI agent tasked with rigorously interrogating a master model about ${target_topic}. Review the prior explanation provided by the teacher, locate any abstract concepts, gaps in operational logic, or complex implementations, and generate the next sharp, analytical question to dig deeper.`;
        
        const teacherDebateSystemPrompt = `You are an elite research professor specializing in ${target_topic}. Your answers must be incredibly comprehensive, technically deep, and strictly grounded in the context provided earlier.`;
        
        const debateHistory: GroqMessage[] = [];
        const debateRounds = 3;
        
        for (let r = 0; r < debateRounds; r++) {
            log(`Phase 2 - Debate Round ${r + 1}: Student is processing...`);
            
            const studentMessages = [
                { role: "system", content: studentSystemPrompt },
                { role: "user", content: `Context: ${massive_context}\nGenerate a sharp, analytical question based on the context.` }
            ];
            
            if (debateHistory.length > 0) {
                studentMessages.push({ role: "assistant", content: "I have asked previously: " + debateHistory.filter((m: GroqMessage) => m.role === 'user').map((m: GroqMessage) => m.content).join("\n") });
                studentMessages.push({ role: "user", content: "Based on the teacher's last answer, what is your next analytical question?" });
            }
        
            const studentResponse = await fetchGroq({
                model: "llama-3.1-8b-instant",
                messages: studentMessages
            }, groq_key, log);
        
            const question = studentResponse.choices[0].message.content;
            
            // Update Stats for Student
            if (studentResponse?.usage) {
              const pTokens = studentResponse.usage.prompt_tokens || 0;
              const cTokens = studentResponse.usage.completion_tokens || 0;
              runStats.apiCalls += 1;
              runStats.promptTokens += pTokens;
              runStats.completionTokens += cTokens;
              runStats.cost += (pTokens * 0.05 + cTokens * 0.08) / 1000000;
              logStats();
            }

            log(`Phase 2 - Student asks: "${question.substring(0, 70).replace(/\n/g, ' ')}..."`);
            
            log(`Phase 2 - Teacher is synthesizing response...`);
            const teacherMessages = [
                { role: "system", content: teacherDebateSystemPrompt },
                { role: "user", content: `Here is the reference context: ${massive_context}` },
                ...debateHistory,
                { role: "user", content: question }
            ];
        
            const teacherResponse = await fetchGroq({
                model: "llama-3.3-70b-versatile",
                messages: teacherMessages
            }, groq_key, log);
        
            const answer = teacherResponse.choices[0].message.content;
            
            // Update Stats for Teacher
            if (teacherResponse?.usage) {
              const pTokens = teacherResponse.usage.prompt_tokens || 0;
              const cTokens = teacherResponse.usage.completion_tokens || 0;
              runStats.apiCalls += 1;
              runStats.promptTokens += pTokens;
              runStats.completionTokens += cTokens;
              runStats.cost += (pTokens * 0.59 + cTokens * 0.79) / 1000000;
              logStats();
            }

            debateHistory.push({ role: "user", content: question });
            debateHistory.push({ role: "assistant", content: answer });
            
            const dataStr = JSON.stringify({ messages: [...teacherMessages, { role: "assistant", content: answer }] });
            await commitToGithub(dataStr, `Append debate round ${r + 1}`, `debate round ${r + 1}`, target_repo, file_path, github_token, log);
            
            log(`Phase 2 - Debate Round ${r + 1} completed.`);
        }
        
        log(`PROCESS COMPLETE! Dataset successfully appended to GitHub.`);
        controller.close();
      } catch (error: any) {
        log(`SYSTEM ERROR: ${error.message}`);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

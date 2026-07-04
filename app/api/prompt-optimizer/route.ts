import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getLastUsedApi } from "@/lib/config-store";

// Use the standard environment variable
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, context, rawIdea } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in secrets." }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are an elite AI Teacher Agent specializing in prompt engineering and synthetic data curriculum design. 
Your goal is to optimize, enrich, and regenerate the user's input into a pristine, highly instruction-dense target focus topic and detailed reference context.
This optimized combination will be used to instruct a student agent and a master teacher model in rigorous debate rounds to produce high-quality synthetic training datasets.

You must handle the input context flexibly:
1. If only a brief "Raw Idea" or a partial prompt suggestion is provided (and the title/topic or reference context are empty), design a highly professional technical title ("topic") and build extremely deep, high-fidelity reference documentation ("context") from scratch based on that idea.
2. If both "topic" and "context" are already provided, optimize them, make them more technical, structured, and cover key edge cases, operational constraints, and hidden limitations.
3. If everything is blank or minimal, formulate a highly innovative, advanced computer science or engineering topic and generate a complete starter scenario.

In your response, return a clean JSON object containing:
   - "topic": An optimized, highly descriptive title.
   - "context": The rich, expanded technical reference documentation.
   - "justification": A brief explanation of what improvements the Teacher Agent introduced to maximize synthetic training quality.

Return ONLY valid JSON. Do not include markdown code block formatting like \`\`\`json.`;

    let userPrompt = "";
    if (rawIdea) {
      userPrompt = `Raw Prompt Idea / Thought: ${rawIdea}
Please generate a fully structured Target Focus Topic ("topic") and a detailed Raw Reference Context ("context") based on this idea.`;
    } else {
      userPrompt = `Original Topic: ${topic || "No topic specified"}
Original Reference Context: ${context || "No context specified"}
Please optimize, expand, and regenerate this into a complete high-density synthetic dataset training prompt.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedResult = JSON.parse(text.trim());
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Prompt Optimizer Error:", error);
    return NextResponse.json(
      { error: `Teacher Agent failed to optimize prompt: ${error.message}` },
      { status: 500 }
    );
  }
}

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI Brain.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const { topic, context } = await req.json();

    if (!topic || !context) {
      return NextResponse.json({ error: "Topic and context are required." }, { status: 400 });
    }

    const ai = getAI();
    
    const prompt = `You are the AI Brain helper of the Autonomous Dataset Foundry.
Your task is to analyze the user's provided target Topic and documentation Context, and optimize them to produce extremely efficient, highly aligned, and technically deep instruction/synthesis datasets.

Make sure to:
1. Keep the synthesis strictly focused on the provided context, preventing any hallucinations or outside knowledge drift.
2. Structure the context to bring out edge cases, operational limits, technical parameters, and failures.
3. Clean up any redundant phrasing, boilerplate text, or formatting noise while maximizing information density.
4. Enhance the topic name to be technically accurate and descriptive.

Respond in strict JSON format matching this schema:
{
  "optimizedTopic": "...",
  "optimizedContext": "...",
  "explanation": "..."
}

User Topic:
"${topic}"

User Context:
"${context}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const result = JSON.parse(responseText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Brain Optimization error:", error);
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred during AI Brain optimization." 
    }, { status: 500 });
  }
}

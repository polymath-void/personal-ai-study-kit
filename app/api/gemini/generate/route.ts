import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Fallback to empty key so next.js compile doesn't fail if the env var is not set yet
const apiKey = process.env.GEMINI_API_KEY || "";

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set on the server side." },
        { status: 500 }
      );
    }

    const { content, type, customPrompt } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required for processing." },
        { status: 400 }
      );
    }

    let systemInstruction = `You are an expert AI study assistant and learning companion. Your task is to analyze the provided study text/document and generate a comprehensive, highly-structured learning companion set in raw JSON format.

The JSON output MUST exactly match the following TypeScript schema:
{
  "summary": string, // A beautifully detailed, rich markdown summary of the document, explaining main ideas clearly.
  "keyConcepts": Array<{
    "term": string,
    "definition": string
  }>, // At least 5 key terms and definitions extracted from the content.
  "mindMap": {
    "nodes": Array<{
      "id": string, // Unique alphanumeric ID
      "label": string, // Short descriptive title/phrase (1-3 words)
      "group": "root" | "main" | "detail" // Hierarchy level
    }>,
    "links": Array<{
      "source": string, // Source node ID
      "target": string  // Target node ID
    }>
  }, // An interactive node-link graph representing the hierarchy of ideas. Include a root node representing the central topic, linked to 4-6 main concepts, which in turn link to detail/subconcept nodes.
  "flashcards": Array<{
    "front": string, // Question or term
    "back": string   // Answer or explanation
  }>, // A deck of 6-10 high-quality flashcards for active recall.
  "quiz": Array<{
    "question": string,
    "options": Array<string>, // Exactly 4 plausible multiple choice options
    "correctAnswer": string, // Must exactly match one of the string options
    "explanation": string // Step-by-step educational explanation of why the answer is correct
  }> // A set of 5-8 challenging multiple choice questions.
}

Do not include any wrapping markdown like \`\`\`json. Output ONLY the raw JSON string. Ensure the JSON is valid and can be parsed directly.`;

    let prompt = `Study Material to analyze:\n\n${content}`;
    if (customPrompt) {
      prompt += `\n\nUser custom instruction: ${customPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response content received from Gemini model.");
    }

    // Attempt to parse JSON to verify it's valid
    const parsed = JSON.parse(responseText.trim());
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Gemini processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process text with Gemini AI." },
      { status: 500 }
    );
  }
}

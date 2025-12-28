
import { GoogleGenAI, Type } from "@google/genai";
import { FormattedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parsePYQText(rawText: string): Promise<FormattedData> {
  const prompt = `
    Extract questions from the following text and format them into a structured JSON format.
    
    Rules:
    1. Identify semester headings like 'S25', 'W24', etc.
    2. Group questions under these semesters.
    3. Each question has a main number (e.g., 5, 6).
    4. Each question contains sub-questions labeled (a), (b), etc.
    5. Capture the marks in brackets at the end of sub-questions.
    6. Ignore any summary sections, notes, or unrelated introductory text.
    7. Generate a unique ID for each semester, question, and sub-question.

    Input text:
    ${rawText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          semesters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      number: { type: Type.STRING },
                      subQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            text: { type: Type.STRING },
                            marks: { type: Type.STRING },
                          },
                          required: ["id", "label", "text", "marks"],
                        },
                      },
                    },
                    required: ["id", "number", "subQuestions"],
                  },
                },
              },
              required: ["id", "title", "questions"],
            },
          },
        },
        required: ["semesters"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text || "{}") as FormattedData;
    // Initialize isDone state locally for each sub-question
    result.semesters.forEach(s => {
      s.questions.forEach(q => {
        q.subQuestions.forEach(sq => {
          sq.isDone = false;
        });
      });
    });
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Formatting failed. Please try again with cleaner text.");
  }
}

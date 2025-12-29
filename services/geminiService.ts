
import Groq from "groq-sdk";
import { FormattedData } from "../types";

function getGroqClient() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // Debug logging
  console.log('Environment check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    envKeys: Object.keys(import.meta.env)
  });

  if (!apiKey) {
    throw new Error("Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.");
  }

  return new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allow browser usage
  });
}

export async function parsePYQText(rawText: string): Promise<FormattedData> {
  const groq = getGroqClient();

  const prompt = `Extract questions from the following text and format them into a structured JSON format.

Rules:
1. Identify semester headings like 'S25', 'W24', etc.
2. Group questions under these semesters.
3. Each question has a main number (e.g., 5, 6).
4. Each question contains sub-questions labeled (a), (b), etc.
5. Capture the marks in brackets at the end of sub-questions.
6. Ignore any summary sections, notes, or unrelated introductory text.
7. Generate a unique ID for each semester, question, and sub-question.

Return ONLY valid JSON in this exact format:
{
  "semesters": [
    {
      "id": "unique-id",
      "title": "S25",
      "questions": [
        {
          "id": "unique-id",
          "number": "5",
          "subQuestions": [
            {
              "id": "unique-id",
              "label": "(a)",
              "text": "Question text here",
              "marks": "(7)"
            }
          ]
        }
      ]
    }
  ]
}

Input text:
${rawText}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts and structures exam questions from text. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(responseText) as FormattedData;

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
    console.error("Failed to parse with Groq:", error);
    throw new Error("Formatting failed. Please try again with cleaner text.");
  }
}

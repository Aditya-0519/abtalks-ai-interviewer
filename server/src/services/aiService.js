import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env.js";

const createClient = () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });
};

export const generateStructuredResponse = async ({
  systemInstruction,
  prompt,
  responseSchema,
}) => {
  const client = createClient();

  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!response.text) {
    throw new Error("AI provider returned an empty response");
  }

  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error("AI provider returned invalid JSON");
  }
};
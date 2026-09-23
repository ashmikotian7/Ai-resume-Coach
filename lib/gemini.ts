import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  "";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: apiKey || "dummy-key-for-init" });
  }
  return aiClient;
}

export const GEMINI_MODEL = "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey && apiKey.length > 10 && !apiKey.startsWith("dummy"));
}

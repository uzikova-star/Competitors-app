
import { GoogleGenAI } from "@google/genai";
import { ZodError } from "zod";
import { AnalysisResult } from '../types';
import { getPrompt, getResearchPrompt, getFormattingPrompt } from './prompts';
import { AnalysisResultSchema } from './validation';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// The requested model ID - Switching to Gemini 3 Flash as requested
const modelId = "gemini-3-flash-preview";

/**
 * Main function to analyze local competitors using Gemini.
 */
export const analyzeCompetitors = async (
  clientUrl: string,
  country: string,
  industry: string
): Promise<AnalysisResult> => {
  const prompt = getPrompt(clientUrl, country, industry);

  let attempt = 0;
  const maxAttempts = 5; // Increased attempts for free tier stability

  while (attempt < maxAttempts) {
    try {
      const result = await ai.models.generateContent({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],

        // TOTO JE KĽÚČ: tools nesmú byť v žiadnom inom objekte!
        tools: [{ googleSearch: {} }] as any,

        // Ak potrebuješ JSON, toto ide do generationConfig
        generationConfig: {
          responseMimeType: "application/json"
        }
      } as any);

      const text = result.text || "";
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      // Extract sources from Google Search grounding
      const sources = groundingChunks
        .map((chunk) => (chunk.web?.uri && chunk.web?.title ? { uri: chunk.web.uri, title: chunk.web.title } : null))
        .filter((s): s is { uri: string; title: string } => s !== null);

      // Robust JSON extraction using balanced brace counting
      const firstBrace = text.indexOf('{');
      if (firstBrace === -1) {
        throw new Error("Invalid format: No JSON object found in response");
      }

      let braceCount = 0;
      let endIndex = -1;
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        else if (text[i] === '}') braceCount--;

        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }

      if (endIndex === -1) {
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace !== -1) endIndex = lastBrace;
        else throw new Error("Invalid format: No closing brace found");
      }

      const jsonString = text.substring(firstBrace, endIndex + 1);
      const rawData = JSON.parse(jsonString);
      const parsedData = AnalysisResultSchema.parse(rawData);

      return {
        ...parsedData,
        sources: sources
      };

    } catch (error: any) {
      console.warn(`Analysis Attempt ${attempt + 1} failed:`, error.message);

      // Handle 429 specifically with longer backoff
      if (error.message?.includes('429') || error.message?.includes('Quota')) {
        if (attempt < maxAttempts - 1) {
          attempt++;
          const delay = 5000 * attempt; // More aggressive wait for quota reset
          console.log(`Quota hit, waiting ${delay}ms before retry...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error("Prekročený limit API (429). Počkajte minútu a skúste to znova.");
      }

      if (attempt < maxAttempts - 1) {
        attempt++;
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(`Analýza zlyhala: ${error.message || 'Neznáma chyba'}`);
    }
  }
  throw new Error("Neočakávaná chyba v cykle analýzy");
};

/**
 * Performs raw research about a business.
 */
export const performResearch = async (
  clientUrl: string,
  country: string,
  industry: string
): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }> => {
  const prompt = getResearchPrompt(clientUrl, country, industry);

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }]
    } as any);

    const text = result.text || "";
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks
      .map((chunk) => (chunk.web?.uri && chunk.web?.title ? { uri: chunk.web.uri, title: chunk.web.title } : null))
      .filter((s): s is { uri: string; title: string } => s !== null);

    return { text, sources };

  } catch (error: any) {
    console.error("Gemini Research Error:", error);
    throw new Error(`Prieskum zlyhal: ${error.message}`);
  }
};

/**
 * Verification step for the client DNA.
 */
export const verifyClient = async (
  clientUrl: string,
  industry: string
): Promise<{ summary: string; correctIndustry: string; keyProducts: string[]; usp: string }> => {
  const prompt = `
    Analyze ${clientUrl}. 
    Goal: Research their website to find their actual product/service offerings.

    1. Use Google Search to find "${clientUrl}" and its main website categories.
    2. Identify the core products/services. Look for specific labels in their menu/navigation.
       - IF SLOVAK (.sk), list products in Slovak (e.g. "Hliníkové okná", "Screenové rolety", "Drevohliníkové okná").
       - Be specific. Avoid generic terms like "okná" if they have specific types.
    3. Summarize the business in 1-2 Slovak sentences.
    4. Provide the main USP.

    Output format: STRICT JSON (only the object)
    {
      "summary": "...",
      "correctIndustry": "...",
      "keyProducts": ["...", "...", "..."],
      "usp": "..."
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    } as any);

    const text = result.text || "";

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonString = (start !== -1 && end !== -1) ? text.substring(start, end + 1) : "{}";

    const data = JSON.parse(jsonString);

    return {
      summary: data.summary || "Zhrnutie nie je k dispozícii.",
      correctIndustry: data.correctIndustry || industry,
      keyProducts: data.keyProducts || [],
      usp: data.usp || "N/A"
    };

  } catch (error: any) {
    console.error("Gemini Verification Error:", error);
    return {
      summary: "",
      correctIndustry: industry,
      keyProducts: [],
      usp: ""
    };
  }
};

/**
 * Fallback formatter for Hybrid Analysis when Claude fails.
 */
export const formatResearchGemini = async (researchText: string): Promise<AnalysisResult> => {
  const prompt = `
    ${getFormattingPrompt()}
    
    Here is the RESEARCH REPORT:
    
    ${researchText}
  `;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    } as any);

    const text = result.text || "";

    // Robust JSON extraction
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("Invalid format: No JSON object found in Gemini fallback response");
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    const rawData = JSON.parse(jsonString);
    const parsedData = AnalysisResultSchema.parse(rawData);

    return {
      ...parsedData,
      sources: [] // Sources are already handled in the hybrid orchestrator
    };

  } catch (error: any) {
    console.error("Gemini Fallback Formatting Error:", error);
    throw new Error(`Fallback formatting failed: ${error.message}`);
  }
};
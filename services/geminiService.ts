
import { GoogleGenAI } from "@google/genai";
import { ZodError } from "zod";
import { AnalysisResult } from '../types';
import { getPrompt, getResearchPrompt, getFormattingPrompt, getIndustryGuidance } from './prompts';
import { AnalysisResultSchema } from './validation';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// Define the fallback hierarchy
const GEMINI_MODELS = [
  "gemini-2.5-flash",      // Primary
  "gemini-3.1-flash-lite", // Fallback #1
  "gemini-3-flash"  // Fallback #2 (High headroom)
];

/**
 * Maps country names to their respective language codes and central coordinates.
 */
const COUNTRY_MAP: Record<string, { languageCode: string; latitude: number; longitude: number }> = {
  "Slovensko": { languageCode: "sk", latitude: 48.6690, longitude: 19.6990 },
  "Slovakia": { languageCode: "sk", latitude: 48.6690, longitude: 19.6990 },
  "Česko": { languageCode: "cs", latitude: 49.8175, longitude: 15.4730 },
  "Czechia": { languageCode: "cs", latitude: 49.8175, longitude: 15.4730 },
  "Czech Republic": { languageCode: "cs", latitude: 49.8175, longitude: 15.4730 },
  "Nemecko": { languageCode: "de", latitude: 51.1657, longitude: 10.4515 },
  "Germany": { languageCode: "de", latitude: 51.1657, longitude: 10.4515 },
  "Rakúsko": { languageCode: "de", latitude: 47.5162, longitude: 14.5501 },
  "Austria": { languageCode: "de", latitude: 47.5162, longitude: 14.5501 },
  "Poľsko": { languageCode: "pl", latitude: 51.9194, longitude: 19.1451 },
  "Poland": { languageCode: "pl", latitude: 51.9194, longitude: 19.1451 },
  "Maďarsko": { languageCode: "hu", latitude: 47.1625, longitude: 19.5033 },
  "Hungary": { languageCode: "hu", latitude: 47.1625, longitude: 19.5033 },
  "United Kingdom": { languageCode: "en", latitude: 55.3781, longitude: -3.4360 },
  "UK": { languageCode: "en", latitude: 55.3781, longitude: -3.4360 },
  "Veľká Británia": { languageCode: "en", latitude: 55.3781, longitude: -3.4360 },
  "USA": { languageCode: "en", latitude: 37.0902, longitude: -95.7129 },
  "United States": { languageCode: "en", latitude: 37.0902, longitude: -95.7129 },
  "Spojené štáty": { languageCode: "en", latitude: 37.0902, longitude: -95.7129 },
};

/**
 * Gets the retrieval configuration (location/language) for a given country.
 */
function getToolConfig(country: string) {
  const normalized = country.trim();
  const entry = COUNTRY_MAP[normalized];

  if (!entry) return undefined;

  return {
    retrievalConfig: {
      languageCode: entry.languageCode,
      latLng: {
        latitude: entry.latitude,
        longitude: entry.longitude
      }
    }
  };
}

/**
 * Generic helper to call Gemini with model fallback and retries.
 */
async function callWithFallback<T>(
  operation: (modelId: string) => Promise<T>,
  context: string
): Promise<T> {
  let lastError: any = null;

  for (const modelId of GEMINI_MODELS) {
    let attempt = 0;
    const maxAttempts = modelId === GEMINI_MODELS[0] ? 3 : 2; // More retries for primary

    while (attempt < maxAttempts) {
      try {
        return await operation(modelId);
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || "";
        const isQuotaError = errorMessage.includes('429') || errorMessage.includes('Quota');
        const isOverloaded = errorMessage.includes('503') || errorMessage.includes('Overloaded');

        if (isQuotaError || isOverloaded) {
          console.warn(`[${context}] Model ${modelId} failed (Quota/Overload). Attempt ${attempt + 1}/${maxAttempts}.`);

          if (attempt < maxAttempts - 1) {
            attempt++;
            const delay = 2000 * attempt;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }

          // Switch to next model in hierarchy
          console.log(`[${context}] Switching from ${modelId} to next fallback model...`);
          break; // Break the while loop to try next modelId in for loop
        }

        // For other errors, still try next attempt or throw
        if (attempt < maxAttempts - 1) {
          attempt++;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw error;
      }
    }
  }

  throw new Error(`${context} failed after trying all models. Last error: ${lastError?.message}`);
}

/**
 * Main function to analyze local competitors using Gemini.
 */
export const analyzeCompetitors = async (
  clientUrl: string,
  country: string,
  industry: string
): Promise<AnalysisResult> => {
  const prompt = getPrompt(clientUrl, country, industry);

  return callWithFallback(async (modelId) => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }] as any,
      toolConfig: getToolConfig(country) as any,
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
    if (firstBrace === -1) throw new Error("No JSON found");

    let braceCount = 0;
    let endIndex = -1;
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') braceCount++;
      else if (text[i] === '}') braceCount--;
      if (braceCount === 0) { endIndex = i; break; }
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
  }, "analyzeCompetitors");
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

  return callWithFallback(async (modelId) => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      toolConfig: getToolConfig(country) as any
    } as any);

    const text = result.text || "";
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks
      .map((chunk) => (chunk.web?.uri && chunk.web?.title ? { uri: chunk.web.uri, title: chunk.web.title } : null))
      .filter((s): s is { uri: string; title: string } => s !== null);

    return { text, sources };
  }, "performResearch");
};

/**
 * Verification step for the client DNA.
 */
export const verifyClient = async (
  clientUrl: string,
  country: string,
  industry: string
)
  : Promise<{ summary: string; correctIndustry: string; keyProducts: string[]; usp: string }> => {
  const prompt = `
    You are a business intelligence expert analyzing a client's website for the ${country} market.
    Client: ${clientUrl}
    Input Industry: ${industry || "Not specified (detect from website)"}
    Target Market: ${country}
    
    ${getIndustryGuidance(clientUrl, country, industry)}
    
    TASK:
    1. Analyze the client's website to understand what they do IN ${country}.
    2. Identify their primary industry/niche specifically for the ${country} market.
    3. Return STRICT JSON only:
    {
      "summary": "1-2 sentence summary in Slovak, focusing on their presence and offering in ${country}",
      "correctIndustry": "most accurate industry label for their ${country} operations",
      "keyProducts": ["product/service 1 available in ${country}", "product/service 2 available in ${country}"],
      "topSellers": ["best selling product 1", "best selling product 2"],
      "usp": "main unique selling point in the ${country} market"
    }
`;
  return callWithFallback(async (modelId) => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      toolConfig: getToolConfig(country) as any,
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
      topSellers: data.topSellers || [],
      usp: data.usp || "N/A"
    };
  }, "verifyClient").catch(error => {
    console.warn("Gemini Verification eventually failed, returning empty dataset:", error.message);
    return {
      summary: "",
      correctIndustry: industry,
      keyProducts: [],
      usp: ""
    }
  });
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

  return callWithFallback(async (modelId) => {
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
  }, "formatResearchGemini");
};
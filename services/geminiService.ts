
import { GoogleGenAI } from "@google/genai";
import { ZodError } from "zod";
import { AnalysisResult } from '../types';
import { getPrompt, getResearchPrompt, getFormattingPrompt, getIndustryGuidance } from './prompts';
import { AnalysisResultSchema } from './validation';
import { fetchAhrefsForCompetitors } from './ahrefsService';
import { buildCountryScopedQuery, getCountrySearchConfig } from './countryConfig';

/**
 * Builds a concise SEO position string from Ahrefs metrics.
 * Falls back to the AI-estimated value if Ahrefs returned null.
 */
function buildSeoPositionString(
  aiEstimate: string | undefined,
  dr: number | null,
  traffic: number | null,
  keywords: number | null,
  label: string,
  topKeywords: number | null,
  referringDomains: number | null,
  paidKeywords: number | null
): string {
  if (dr === null && traffic === null) {
    return aiEstimate || "N/A";
  }
  const parts: string[] = [label];
  if (dr !== null) parts.push(`DR: ${dr}`);
  if (traffic !== null) parts.push(`~${traffic.toLocaleString()} návštev/mes.`);
  if (keywords !== null) parts.push(`${keywords.toLocaleString()} kľúčových slov`);
  if (referringDomains !== null) parts.push(`${referringDomains.toLocaleString()} ref. domén`);
  if (topKeywords !== null) parts.push(`Top 3: ${topKeywords.toLocaleString()} kľ. slov`);
  if (paidKeywords !== null && paidKeywords > 0) parts.push(`Google Ads: áno`);
  return parts.join(" · ");
}

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
  industry: string,
  topProducts?: string
): Promise<AnalysisResult> => {
  const searchQuery = buildCountryScopedQuery(clientUrl, country);
  const { lang, cr } = getCountrySearchConfig(country);
  const prompt = getPrompt(clientUrl, country, industry, topProducts) +
    `\n\n    SEARCH INSTRUCTION: Start your research with this country-scoped query: "${searchQuery}". Focus exclusively on ${country} operations and ignore results from other countries.`;

  return callWithFallback(async (modelId) => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }] as any,
      toolConfig: getToolConfig(country) as any,
      generationConfig: {
        responseMimeType: "application/json"
      },
      searchConfig: { searchLanguage: lang, searchCountry: cr }
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

    // Enrich with real Ahrefs SEO data
    const allComps = [...parsedData.topCompetitors, ...parsedData.realCompetitors];
    const websites = allComps.map((c) => c.website || "");
    const ahrefsData = await fetchAhrefsForCompetitors(websites);

    const enrich = (list: typeof allComps, offset: number) =>
      list.map((comp, i) => {
        const seo = ahrefsData[offset + i];
        if (!seo) return comp;
        return {
          ...comp,
          seoDR: seo.domainRating,
          seoTraffic: seo.organicTraffic,
          seoKeywords: seo.organicKeywords,
          seoReferringDomains: seo.referringDomains,
          seoTopKeywords: seo.topKeywords,
          seoPosition: buildSeoPositionString(
            comp.seoPosition,
            seo.domainRating,
            seo.organicTraffic,
            seo.organicKeywords,
            seo.seoPositionLabel,
            seo.topKeywords,
            seo.referringDomains,
            seo.paidKeywords
          ),
        };
      });

    const topCount = parsedData.topCompetitors.length;
    return {
      ...parsedData,
      topCompetitors: enrich(parsedData.topCompetitors, 0),
      realCompetitors: enrich(parsedData.realCompetitors, topCount),
      sources,
    };
  }, "analyzeCompetitors");
};

/**
 * Performs raw research about a business.
 */
export const performResearch = async (
  clientUrl: string,
  country: string,
  industry: string,
  topProducts?: string
): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }> => {
  const prompt = getResearchPrompt(clientUrl, country, industry, topProducts);

  const { lang, cr } = getCountrySearchConfig(country);

  return callWithFallback(async (modelId) => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      toolConfig: getToolConfig(country) as any,
      searchConfig: { searchLanguage: lang, searchCountry: cr }
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
  : Promise<{ summary: string; correctIndustry: string; keyProducts: string[]; topSellers: string[]; usp: string }> => {
  const searchQuery = buildCountryScopedQuery(clientUrl, country);
  const { lang, cr } = getCountrySearchConfig(country);
  const prompt = `
    IMPORTANT: You MUST visit this EXACT URL first: ${clientUrl}
    This is a ${country} website. Do NOT search for the company name on Google first.
    Do NOT use any other source until you have visited the URL directly.

    CONTEXT: The user suggests this business belongs to the "${industry}" industry.
    
    TASK: After visiting ${clientUrl}, identify what this business sells in the ${country} market. 
    1. Look at the Homepage Hero section and Main Menu. What products get the MOST attention/prominence?
    2. Define the exact industry focus. Verify if "${industry}" is accurate or needs refinement.

    Return STRICT JSON only:
    {
      "summary": "1-2 vety v slovenčine popisujúce čo firma predáva a kde pôsobí",
      "correctIndustry": "Krátky názov odvetvia v slovenčine (napr. 'Plastové okná a dvere', 'Tepelné čerpadlá'). Ak je pôvodné zadanie '${industry}' správne, použite ho.",
      "keyProducts": ["produkt/služba 1 (najprominentnejší)", "produkt/služba 2", "produkt/služba 3"],
      "topSellers": ["najpredávanejší produkt 1", "najpredávanejší produkt 2"],
      "usp": "Hlavná konkurenčná výhoda firmy na trhu ${country}"
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
      searchConfig: { searchLanguage: lang, searchCountry: cr }
    } as any);

    const text = result.text || "";

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonString = (start !== -1 && end !== -1) ? text.substring(start, end + 1) : "{}";

    const data = JSON.parse(jsonString);

    return {
      summary: data.summary || "Zhrnutie nie je k dispozícii.",
      correctIndustry: data.correctIndustry || industry || "Neznáme odvetvie",
      keyProducts: data.keyProducts || [],
      topSellers: data.topSellers || [],
      usp: data.usp || "N/A"
    };
  }, "verifyClient").catch(error => {
    const msg = error.message || "";
    if (msg.includes('429') || msg.includes('Quota') || msg.includes('RPD')) {
      throw error;
    }
    console.warn("Gemini Verification eventually failed, returning empty dataset:", msg);
    return {
      summary: "",
      correctIndustry: industry || "Neznáme odvetvie",
      keyProducts: [],
      topSellers: [],
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
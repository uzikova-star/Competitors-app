
import { performResearch, formatResearchGemini } from './geminiService';
import { formatResearch } from './claude/claudeService';
import { AnalysisResult } from '../types';

export const analyzeCompetitorsHybrid = async (
    clientUrl: string,
    country: string,
    industry: string
): Promise<AnalysisResult> => {
    console.log("Starting Hybrid Analysis...");

    // Step 1: Gemini Research (Planning)
    console.log("Phase 1: Gemini Research START");
    const { text: researchReport, sources } = await performResearch(clientUrl, country, industry);
    console.log("Phase 1: Gemini Research END. Report length:", researchReport?.length);
    console.log("Sources found:", sources.length);

    if (!researchReport) {
        throw new Error("Gemini failed to generate a research report.");
    }

    // Step 2: Claude Formatting (Coding)
    console.log("Phase 2: Claude Formatting START");
    try {
        const formattedResult = await formatResearch(researchReport);
        console.log("Phase 2: Claude Formatting END. Competitors found:", formattedResult.topCompetitors.length);

        // Combine: Use structured data from Claude + Sources from Gemini
        return {
            ...formattedResult,
            sources: sources
        };
    } catch (error: any) {
        console.warn("Phase 2 Claude Error, attempting Gemini Fallback:", error.message);
        
        try {
            const fallbackResult = await formatResearchGemini(researchReport);
            console.log("Phase 2: Gemini Fallback Formatting SUCCESS.");
            
            return {
                ...fallbackResult,
                sources: sources
            };
        } catch (fallbackError: any) {
            console.error("Phase 2: All formatting attempts failed.", fallbackError);
            throw new Error(`Analýza zlyhala: ${fallbackError.message}`);
        }
    }
};

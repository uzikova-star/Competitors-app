
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from '../../types';
import { getPrompt, getFormattingPrompt } from '../prompts';
import { AnalysisResultSchema } from '../validation';
import { ZodError } from 'zod';

// Initialize Anthropic client
// process.env.ANTHROPIC_API_KEY is made available via vite.config.ts define
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true // Valid for local/internal tool use as per user request
});

export const analyzeCompetitorsClaude = async (
    clientUrl: string,
    country: string,
    industry: string
): Promise<AnalysisResult> => {
    // Using Claude 3.5 Sonnet for balanced speed/intelligence
    // Using Claude 3.5 Sonnet (latest stable)
    const modelId = "claude-3-5-sonnet-20240620";
    const prompt = getPrompt(clientUrl, country, industry);

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
        try {
            const response = await anthropic.messages.create({
                model: modelId,
                max_tokens: 4000,
                messages: [{ role: "user", content: prompt }]
            });

            const textBlock = response.content.find(block => block.type === 'text');
            const text = textBlock && 'text' in textBlock ? textBlock.text : "";

            // JSON Extraction
            let jsonString = text.replace(/```json/g, '').replace(/```/g, '');
            const firstBrace = jsonString.indexOf('{');

            if (firstBrace === -1) {
                throw new Error("Invalid JSON format: No start brace found");
            }

            // Robust JSON extraction by counting braces
            let braceCount = 0;
            let endIndex = -1;

            for (let i = firstBrace; i < jsonString.length; i++) {
                if (jsonString[i] === '{') {
                    braceCount++;
                } else if (jsonString[i] === '}') {
                    braceCount--;
                }

                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }

            if (endIndex !== -1) {
                jsonString = jsonString.substring(firstBrace, endIndex + 1);
            } else {
                // Fallback if no matching brace found
                const lastBrace = jsonString.lastIndexOf('}');
                if (lastBrace !== -1) {
                    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
                } else {
                    throw new Error("Invalid JSON format: No end brace found");
                }
            }

            const rawData = JSON.parse(jsonString);

            // Validate with Zod
            const parsedData = AnalysisResultSchema.parse(rawData);

            // Return result (Claude doesn't return source citations in the message object by default 
            // in the same way Gemini grounding does, so sending empty sources for now or 
            // we could parse them from text if Claude provides them)
            const finalResult: AnalysisResult = {
                ...parsedData,
                sources: []
            };

            return finalResult;

        } catch (error: any) {
            console.warn(`Claude Attempt ${attempt + 1} failed:`, error.message);

            if (error instanceof ZodError) {
                console.error("Zod Validation Error:", JSON.stringify(error.issues, null, 2));
            }

            if (attempt < maxAttempts - 1) {
                attempt++;
                await new Promise(r => setTimeout(r, 2000 * attempt));
                continue;
            }
            console.error("Claude API Error:", error);
            throw new Error(`Analýza zlyhala (Claude): ${error.message || 'Neznáma chyba'}`);
        }
    }
    throw new Error("Unexpected error in analysis loop");
};

export const formatResearch = async (researchText: string): Promise<AnalysisResult> => {
    const modelId = "claude-3-5-sonnet-20240620";
    const systemPrompt = getFormattingPrompt();

    try {
        const response = await anthropic.messages.create({
            model: modelId,
            max_tokens: 4000,
            messages: [
                { role: "user", content: systemPrompt },
                { role: "user", content: `Here is the RESEARCH REPORT:\n\n${researchText}` }
            ]
        });

        const textBlock = response.content.find(block => block.type === 'text');
        const text = textBlock && 'text' in textBlock ? textBlock.text : "";
        console.log("Claude Raw Response Text (First 100 chars):", text.substring(0, 100));

        // JSON Extraction (Reuse the same strict logic)
        let jsonString = text.replace(/```json/g, '').replace(/```/g, '');
        const firstBrace = jsonString.indexOf('{');

        if (firstBrace === -1) {
            throw new Error("Invalid JSON format: No start brace found");
        }

        let braceCount = 0;
        let endIndex = -1;

        for (let i = firstBrace; i < jsonString.length; i++) {
            if (jsonString[i] === '{') {
                braceCount++;
            } else if (jsonString[i] === '}') {
                braceCount--;
            }
            if (braceCount === 0) {
                endIndex = i;
                break;
            }
        }

        if (endIndex !== -1) {
            jsonString = jsonString.substring(firstBrace, endIndex + 1);
        } else {
            const lastBrace = jsonString.lastIndexOf('}');
            if (lastBrace !== -1) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);
            } else {
                throw new Error("Invalid JSON format");
            }
        }

        const rawData = JSON.parse(jsonString);
        const parsedData = AnalysisResultSchema.parse(rawData);

        // Sources are not in formatting step, passed separately
        return { ...parsedData, sources: [] };

    } catch (error: any) {
        console.error("Claude Formatting Error:", error);
        throw new Error(`Formatting failed: ${error.message}`);
    }
};

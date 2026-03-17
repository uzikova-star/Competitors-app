
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.VITE_GEMINI_API_KEY });

async function list() {
    try {
        const models = await ai.models.list();
        console.log("Available Models:");
        models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

list();

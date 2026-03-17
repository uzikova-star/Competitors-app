
import * as genai from '@google/genai';
console.log('Exports:', Object.keys(genai));

if (genai.GoogleGenAI) {
    const ai = new genai.GoogleGenAI('dummy_key');
    console.log('ai instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ai)));
} else {
    console.log('GoogleGenAI class not found in exports');
}

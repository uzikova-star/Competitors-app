
import * as genai from '@google/genai';
console.log('Exports:', Object.keys(genai));
try {
    const client = new genai.GoogleGenAI('test');
    console.log('Methods of GoogleGenAI instance:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
} catch (e) {
    console.log('Error instantiating GoogleGenAI:', e.message);
}

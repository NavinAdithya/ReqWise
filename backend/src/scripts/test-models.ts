import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const rawData = fs.readFileSync('models.json', 'utf8');
  const models = JSON.parse(rawData).models;
  
  const flashModels = models
    .map((m: any) => m.name.replace('models/', ''))
    .filter((name: string) => name.includes('flash') || name.includes('pro'));

  console.log(`Testing ${flashModels.length} models...`);

  for (const model of flashModels) {
    try {
      const result = await ai.models.generateContent({
        model: model,
        contents: 'reply with exactly one word: hello'
      });
      console.log(`✅ ${model} OK:`, result.text?.trim());
      // Found a working model! Just exit and use this one.
      process.exit(0);
    } catch(e: any) {
      console.log(`❌ ${model} ERROR:`, e.message);
    }
  }
}
run();

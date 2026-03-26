// src/lib/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyA00UTEgpfHHBh2tcwtj9p5xtBjf600z4g';

const genAI = new GoogleGenerativeAI(API_KEY);

const FASHION_SYSTEM_PROMPT = `You are NOVA, a 24/7 personal fashion AI assistant built into the MY outfit app. You are warm, enthusiastic, and deeply knowledgeable about all things fashion. You help users with:

• Outfit pairing and styling advice
• Color theory and what colors suit different skin tones/seasons
• Body type dressing tips and flattering silhouettes
• Current trends (runway, street style, seasonal)
• Fashion for any occasion (date night, office, festival, travel, etc.)
• Capsule wardrobes and minimalism
• Sustainable and budget fashion tips
• Brand recommendations and shopping advice
• Fabric care and wardrobe maintenance
• Hair and accessory styling to complement outfits
• Personal style development

Keep responses concise but rich — use emojis sparingly to add personality. Always be encouraging and inclusive. If asked about something completely unrelated to fashion or lifestyle, gently redirect: "I'm best at fashion topics, but I'll try to help! 💫"`;

export function getFashionModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: FASHION_SYSTEM_PROMPT,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
}

// Vision-capable model for multimodal (closet image analysis)
export function getVisionModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: FASHION_SYSTEM_PROMPT,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
}


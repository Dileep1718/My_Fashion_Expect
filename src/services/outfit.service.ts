// src/services/outfit.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function suggestOutfit(wardrobeItems: any[], eventContext: string) {
  // Graceful fallback for demo if API key is missing
  if (!GEMINI_API_KEY) {
    await new Promise(r => setTimeout(r, 1500));
    const tops = wardrobeItems.filter(i => i.category === 'TOP');
    const bottoms = wardrobeItems.filter(i => i.category === 'BOTTOM');
    const footwear = wardrobeItems.filter(i => i.category === 'FOOTWEAR');
    return {
      top: tops[0]?.id || null,
      bottom: bottoms[0]?.id || null,
      footwear: footwear[0]?.id || null,
      reasoning: "This is a mocked fallback response because no Gemini API key was provided. I've randomly selected the first available items in your Wardrobe.",
    };
  }

  // Strip down payload to save tokens
  const payload = wardrobeItems.map(item => ({
    id: item.id,
    category: item.category,
    // Note: We don't send the full image buffer, just the URL and ID, trusting Gemini to analyze the URL if it's a vision model mapped, or at least process the categories blindly/randomly for text model if vision is not passed. 
    // Gemini 1.5 Flash actually supports vision, but sending 50 image URLs in text prompt might be ignored. We will just pass the JSON.
    url: item.image_url
  }));

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
  
  const prompt = `You are a world-class elite fashion stylist.
  Here is the user's literal digital wardrobe data in JSON:
  ${JSON.stringify(payload)}

  The user is preparing for this specific event: "${eventContext}".
  Your job is to look at the list, deduce what combination works best for this event, and return the exact IDs of the items you choose.

  CRITICAL INSTRUCTION: You MUST return a valid JSON object matching this schema exactly, and nothing else:
  {
    "top": "<UUID string of the chosen TOP item>",
    "bottom": "<UUID string of the chosen BOTTOM item>",
    "footwear": "<UUID string of the chosen FOOTWEAR item>",
    "reasoning": "<A 2-sentence hype-man explanation of why this outfit will look incredible for the event>"
  }
  If no item exists for a category, pass null.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini AI] JSON parse failed', text);
    throw new Error('AI returned malformed data.');
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CommentModerationResult {
  allow: boolean;
  score: number; // 0..1 (higher = more likely positive/allowed)
  reason: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Cheap client-side guardrail so “no key configured” still behaves safely.
// This is not a replacement for server-side moderation in production.
const BASIC_BLOCKLIST = [
  'idiot',
  'stupid',
  'moron',
  'hate',
  'kill',
  'trash',
  'worse than',
  'fuck',
  'shit',
  'bitch',
  'asshole',
];

function basicHeuristicReject(text: string): boolean {
  const t = text.toLowerCase();
  return BASIC_BLOCKLIST.some((w) => t.includes(w));
}

function extractJsonObject(text: string): string | null {
  // Handles common Gemini outputs like ```json { ... } ```
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

export async function moderateComment(text: string): Promise<CommentModerationResult> {
  const content = (text || '').trim();

  if (!content) {
    return { allow: false, score: 0, reason: 'Comment cannot be empty.' };
  }

  if (basicHeuristicReject(content)) {
    return { allow: false, score: 0.01, reason: 'Comment contains disallowed language.' };
  }

  // If no Gemini key is configured, we allow (but keep the heuristic guardrail above).
  if (!genAI) {
    return {
      allow: true,
      score: 0.5,
      reason: 'Demo mode: Gemini key missing, using basic safety rules only.',
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
You are a strict content moderation classifier for a fashion social app.

Task: Decide whether the user's comment should be ACCEPTED.

ACCEPTED comments:
- Compliments (e.g., "Love this fit!", "Great choices", "So stylish")
- Constructive, respectful feedback (e.g., "Maybe try a different color", "Consider pairing with sneakers")
- Neutral questions about style (e.g., "Where is this from?") if respectful

REJECTED comments:
- Insults, harassment, hate speech, bullying
- Profanity used to demean others
- Sexual harassment or explicit content

Return ONLY valid JSON matching this exact schema:
{
  "allow": boolean,
  "score": number,
  "reason": string
}

score must be a number from 0 to 1.
If allow=false, score should be < 0.3.

Comment to classify:
${JSON.stringify(content)}
`.trim();

  const result = await model.generateContent(prompt);
  const textOut = result.response.text();
  const jsonText = extractJsonObject(textOut);
  if (!jsonText) {
    return { allow: false, score: 0, reason: 'Could not classify comment. Please try again.' };
  }

  try {
    const parsed = JSON.parse(jsonText) as CommentModerationResult;
    return {
      allow: !!parsed.allow,
      score: typeof parsed.score === 'number' ? parsed.score : 0.5,
      reason: parsed.reason || (parsed.allow ? 'Accepted.' : 'Rejected.'),
    };
  } catch {
    return { allow: false, score: 0, reason: 'Could not read moderation result. Please try again.' };
  }
}


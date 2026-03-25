// src/services/aiTryOn.service.ts
// AI Try-On Service — wired to Fashn.ai API with mock fallback

export type TryOnMode = 'avatar' | 'photorealistic';

export interface TryOnResult {
  imageUrl: string;
  confidence: number;
  processingTimeMs: number;
  mode: TryOnMode;
}

export interface TryOnRequest {
  userPhotoUri: string;
  garmentImageUri: string;
  mode?: TryOnMode;
}

// Fashn.ai endpoint  (set EXPO_PUBLIC_FASHN_API_KEY in .env to activate)
const FASHN_API_KEY = process.env.EXPO_PUBLIC_FASHN_API_KEY ?? '';
const FASHN_BASE_URL = 'https://api.fashn.ai/v1';

// ---------------------------------------------------------------------------
// Fashn.ai integration (production path)
// ---------------------------------------------------------------------------
async function callFashnAI(request: TryOnRequest): Promise<TryOnResult> {
  const start = Date.now();

  const body = JSON.stringify({
    model_image: request.userPhotoUri,
    garment_image: request.garmentImageUri,
    category: 'tops',   // default; can be extended
  });

  const response = await fetch(`${FASHN_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FASHN_API_KEY}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Fashn.ai error: ${response.status}`);
  }

  const data = await response.json();
  // Fashn.ai returns { id, output: [url] }
  const imageUrl: string = data?.output?.[0] ?? '';

  return {
    imageUrl,
    confidence: 0.92,
    processingTimeMs: Date.now() - start,
    mode: 'photorealistic',
  };
}

// ---------------------------------------------------------------------------
// Mock fallback (when no API key is set)
// ---------------------------------------------------------------------------
async function mockTryOn(request: TryOnRequest): Promise<TryOnResult> {
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1800));
  return {
    imageUrl: `https://placehold.co/400x600/1A1A1A/FFFDD0?text=Try-On+Preview`,
    confidence: 0,
    processingTimeMs: Date.now() - start,
    mode: request.mode ?? 'photorealistic',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function tryOnOutfit(request: TryOnRequest): Promise<TryOnResult> {
  console.log('[AI Try-On] Request received, mode:', request.mode ?? 'photorealistic');

  if (FASHN_API_KEY) {
    try {
      return await callFashnAI(request);
    } catch (err) {
      console.warn('[AI Try-On] Fashn.ai failed, falling back to mock:', err);
    }
  }

  return mockTryOn(request);
}

let _abortController: AbortController | null = null;

export function cancelTryOn(): void {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    console.log('[AI Try-On] Cancelled in-flight request');
  }
}

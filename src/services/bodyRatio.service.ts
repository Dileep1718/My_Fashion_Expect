// src/services/bodyRatio.service.ts
// Body Ratio Service — maps slider measurements to avatar model params + body type classification

export type BodyType = 'Hourglass' | 'Pear' | 'Apple' | 'Rectangle' | 'Inverted Triangle';

/** Normalised 0–1 scale params that drive the AvatarCanvas SVG silhouette */
export interface BodyModelParams {
  shoulderScale: number; // 0=narrowest, 1=widest
  waistScale: number;
  hipScale: number;
  heightScale: number; // drives overall canvas height
}

export interface BodyMeasurements {
  shoulders: number; // cm  30–60
  waist: number;     // cm  50–100
  hips: number;      // cm  60–130
  height: number;    // cm  140–220
}

export interface BodyRatioResult {
  bodyType: BodyType;
  confidence: number;
  measurements: BodyMeasurements;
  modelParams: BodyModelParams;
  stylingTips: string[];
}

export interface BodyRatioRequest {
  measurements: BodyMeasurements;
}

// ---------------------------------------------------------------------------
// Measurement → SVG Scale conversion
// ---------------------------------------------------------------------------
const RANGES = {
  shoulders: { min: 30, max: 60 },
  waist:     { min: 50, max: 100 },
  hips:      { min: 60, max: 130 },
  height:    { min: 140, max: 220 },
};

function normalise(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function measurementsToModelParams(m: BodyMeasurements): BodyModelParams {
  return {
    shoulderScale: normalise(m.shoulders, RANGES.shoulders.min, RANGES.shoulders.max),
    waistScale:    normalise(m.waist,     RANGES.waist.min,     RANGES.waist.max),
    hipScale:      normalise(m.hips,      RANGES.hips.min,      RANGES.hips.max),
    heightScale:   normalise(m.height,    RANGES.height.min,    RANGES.height.max),
  };
}

// ---------------------------------------------------------------------------
// Body type classifier — pure function, no network needed
// ---------------------------------------------------------------------------
export function classifyBodyType(m: BodyMeasurements): BodyType {
  const shoulderHipDiff = m.shoulders - m.hips;
  const hipShoulderDiff = m.hips - m.shoulders;
  const waistShoulder   = m.waist / m.shoulders;
  const waistHip        = m.waist / m.hips;

  // Hourglass: shoulders ≈ hips, waist notably smaller
  if (Math.abs(shoulderHipDiff) <= 3 && waistShoulder < 0.75) return 'Hourglass';
  // Pear: hips noticeably wider than shoulders
  if (hipShoulderDiff > 5) return 'Pear';
  // Inverted Triangle: shoulders noticeably wider than hips
  if (shoulderHipDiff > 5) return 'Inverted Triangle';
  // Apple: large waist relative to hips
  if (waistHip > 0.85) return 'Apple';
  return 'Rectangle';
}

// ---------------------------------------------------------------------------
// Styling tips lookup
// ---------------------------------------------------------------------------
const STYLING_TIPS: Record<BodyType, string[]> = {
  Hourglass: [
    'Define your waist with belted outfits.',
    'Wrap dresses accentuate your natural shape.',
    'Fitted blazers and pencil skirts are your best friends.',
  ],
  Pear: [
    'Bright or patterned tops draw attention upward.',
    'Dark-coloured bottoms create a balanced silhouette.',
    'A-line skirts flatter your hips beautifully.',
  ],
  'Inverted Triangle': [
    'Wide-leg trousers balance your broader shoulders.',
    'Minimise shoulder seams — avoid cap sleeves.',
    'Peplum tops and flared trousers add hip volume.',
  ],
  Apple: [
    'Empire-waist tops elongate your torso.',
    'V-necks and wrap tops create a flattering neckline.',
    'Straight-leg or bootcut jeans provide balance.',
  ],
  Rectangle: [
    'Create curves with peplum, ruffles, and layering.',
    'Belted coats and dresses add waist definition.',
    'Textured or patterned fabrics add visual interest.',
  ],
};

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------
export async function analyzeBodyRatio(
  request: BodyRatioRequest,
): Promise<BodyRatioResult> {
  const { measurements } = request;
  // Simulate brief processing time
  await new Promise((resolve) => setTimeout(resolve, 400));

  const bodyType   = classifyBodyType(measurements);
  const modelParams = measurementsToModelParams(measurements);

  return {
    bodyType,
    confidence: 0.87,
    measurements,
    modelParams,
    stylingTips: STYLING_TIPS[bodyType],
  };
}

export async function getStyleRecommendations(bodyType: BodyType): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return STYLING_TIPS[bodyType];
}

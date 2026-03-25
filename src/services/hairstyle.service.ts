// src/services/hairstyle.service.ts
// Hairstyle suggestion service — face shape classifier + gallery filter
// Placeholder: replace detectFaceShape with ML Kit / Gemini Vision in future iteration.

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Oblong';

export interface HairstyleAsset {
  id: string;
  name: string;
  emoji: string;          // visual placeholder before real image assets
  suitableFor: FaceShape[];
  description: string;
}

// ---------------------------------------------------------------------------
// Face shape library (10 hairstyles × 5 shapes)
// ---------------------------------------------------------------------------
export const HAIRSTYLE_GALLERY: HairstyleAsset[] = [
  {
    id: 'hs-001', name: 'Classic Bob',    emoji: '💇‍♀️',
    suitableFor: ['Oval', 'Square', 'Heart'],
    description: 'A timeless chin-length cut that flatters most face shapes.',
  },
  {
    id: 'hs-002', name: 'Layered Waves',  emoji: '🌊',
    suitableFor: ['Oval', 'Oblong', 'Heart'],
    description: 'Soft waves add width and volume for narrow face shapes.',
  },
  {
    id: 'hs-003', name: 'Pixie Cut',      emoji: '✂️',
    suitableFor: ['Oval', 'Heart'],
    description: 'Bold and low-maintenance, works beautifully on petite features.',
  },
  {
    id: 'hs-004', name: 'Side-Swept Bangs', emoji: '🌸',
    suitableFor: ['Square', 'Round', 'Heart'],
    description: 'Softens angular jawlines and rounds cheekbones.',
  },
  {
    id: 'hs-005', name: 'Beach Waves',    emoji: '🏖️',
    suitableFor: ['Square', 'Oblong', 'Oval'],
    description: 'Effortless texture that adds horizontal volume.',
  },
  {
    id: 'hs-006', name: 'Sleek High Pony', emoji: '🎀',
    suitableFor: ['Oval', 'Square'],
    description: 'Clean and polished — elongates the face beautifully.',
  },
  {
    id: 'hs-007', name: 'Curtain Bangs',  emoji: '🎬',
    suitableFor: ['Oblong', 'Round', 'Oval'],
    description: 'Parted fringe that frames the face and shortens a long forehead.',
  },
  {
    id: 'hs-008', name: 'Braided Crown',  emoji: '👑',
    suitableFor: ['Round', 'Heart', 'Oval'],
    description: 'Adds height and draws attention upward — elegant for any occasion.',
  },
  {
    id: 'hs-009', name: 'Textured Lob',   emoji: '✨',
    suitableFor: ['Round', 'Square', 'Oval'],
    description: 'Long bob with movement — universally flattering.',
  },
  {
    id: 'hs-010', name: 'Deep Side Part', emoji: '💫',
    suitableFor: ['Round', 'Square', 'Oblong', 'Heart'],
    description: 'Creates asymmetry that slims and balances the face.',
  },
];

// ---------------------------------------------------------------------------
// Face shape detector (placeholder — aspect ratio heuristic)
// Replace with ML Kit face detection or Gemini Vision API
// ---------------------------------------------------------------------------
export function detectFaceShape(widthCm: number, heightCm: number): FaceShape {
  if (widthCm <= 0 || heightCm <= 0) return 'Oval'; // default
  const ratio = heightCm / widthCm;

  if (ratio < 1.1)  return 'Round';
  if (ratio < 1.25) return 'Square';
  if (ratio < 1.45) return 'Oval';
  if (ratio < 1.65) return 'Heart';
  return 'Oblong';
}

// ---------------------------------------------------------------------------
// Gallery filter
// ---------------------------------------------------------------------------
export function getHairstylesForShape(shape: FaceShape): HairstyleAsset[] {
  return HAIRSTYLE_GALLERY.filter((h) => h.suitableFor.includes(shape));
}

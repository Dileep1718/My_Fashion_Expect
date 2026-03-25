// src/constants/colors.ts — MY Outfit (Mo) Design Tokens
export const Colors = {
  obsidian: '#0B0B0B',
  cream: '#FFFDD0',
  silver: '#E2E2E2',
  mist: '#F5F5F0',
  charcoal: '#1A1A1A',
  accent: '#C4A882',
  blush: '#E03E3E',
  sage: '#4CAF78',
  // Opacity variants
  silverFaint: 'rgba(226,226,226,0.15)',
  accentFaint: 'rgba(196,168,130,0.15)',
  white5: 'rgba(255,255,255,0.05)',
  white10: 'rgba(255,255,255,0.10)',
} as const;

export type ColorKey = keyof typeof Colors;

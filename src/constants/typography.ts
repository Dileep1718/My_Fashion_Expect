// src/constants/typography.ts — MY Outfit (Mo) Type Scale
import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const FontFamily = {
  inter: 'Inter',            // Primary: body, captions
  cabinet: 'CabinetGrotesk', // Secondary: labels, nav, buttons
} as const;

export const Typography = StyleSheet.create({
  display: {
    fontFamily: FontFamily.cabinet,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    color: Colors.cream,
  },
  h1: {
    fontFamily: FontFamily.cabinet,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.cream,
  },
  h2: {
    fontFamily: FontFamily.cabinet,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '600',
    color: Colors.cream,
  },
  h3: {
    fontFamily: FontFamily.inter,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.cream,
  },
  body: {
    fontFamily: FontFamily.inter,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.cream,
  },
  caption: {
    fontFamily: FontFamily.inter,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    color: Colors.silver,
  },
  label: {
    fontFamily: FontFamily.cabinet,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.88, // +0.08em at 11px
    color: Colors.cream,
  },
});

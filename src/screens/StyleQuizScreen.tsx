// src/screens/StyleQuizScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';

type Props = { navigation: NativeStackNavigationProp<any> };

const STYLE_OPTIONS = [
  { id: 'minimal', emoji: '◻️', label: 'Minimal' },
  { id: 'streetwear', emoji: '🧢', label: 'Streetwear' },
  { id: 'classic', emoji: '👔', label: 'Classic' },
  { id: 'boho', emoji: '🌿', label: 'Boho' },
  { id: 'glam', emoji: '✨', label: 'Glam' },
  { id: 'athleisure', emoji: '🏃', label: 'Athleisure' },
  { id: 'edgy', emoji: '🖤', label: 'Edgy' },
  { id: 'romantic', emoji: '🌸', label: 'Romantic' },
];

const PALETTE_OPTIONS = [
  { id: 'neutrals', label: 'Neutrals', colors: ['#E2E2E2', '#C4BDB5', '#0B0B0B'] },
  { id: 'earth', label: 'Earth Tones', colors: ['#8B6355', '#C4A882', '#D4B99A'] },
  { id: 'bold', label: 'Bold & Bright', colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'] },
  { id: 'monochrome', label: 'Monochrome', colors: ['#FFFFFF', '#888888', '#111111'] },
];

export default function StyleQuizScreen({ navigation }: Props) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const updatePreferences = useAuthStore((s) => s.updatePreferences);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id].slice(0, 3)
    );
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(2);
    } else {
      updatePreferences(selectedStyles, selectedPalette);
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>Step {step} of 2</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={styles.headline}>What's your{'\n'}style vibe?</Text>
            <Text style={styles.subheadline}>Pick up to 3 styles that feel like you.</Text>

            <View style={styles.grid}>
              {STYLE_OPTIONS.map((opt) => {
                const isSelected = selectedStyles.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                    onPress={() => toggleStyle(opt.id)}
                  >
                    <Text style={styles.styleEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.styleLabel, isSelected && { color: Colors.obsidian }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headline}>Your colour{'\n'}language?</Text>
            <Text style={styles.subheadline}>Choose the palette that speaks to you.</Text>

            <View style={styles.paletteList}>
              {PALETTE_OPTIONS.map((opt) => {
                const isSelected = selectedPalette === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.paletteCard, isSelected && styles.paletteCardSelected]}
                    onPress={() => setSelectedPalette(opt.id)}
                  >
                    <View style={styles.colorSwatches}>
                      {opt.colors.map((c) => (
                        <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <Text style={styles.paletteLabel}>{opt.label}</Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.ctaArea}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (step === 1 ? selectedStyles.length === 0 : !selectedPalette) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={step === 1 ? selectedStyles.length === 0 : !selectedPalette}
        >
          <Text style={styles.primaryButtonText}>{step === 2 ? 'Enter My Wardrobe →' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, gap: 8 },
  progressBar: {
    height: 4, backgroundColor: Colors.charcoal, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  stepText: { ...Typography.caption, color: Colors.silver },
  content: { paddingHorizontal: 24, paddingBottom: 120, gap: 24 },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  styleCard: {
    width: '46%', aspectRatio: 1, backgroundColor: Colors.charcoal,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: 'transparent',
  },
  styleCardSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  styleEmoji: { fontSize: 32 },
  styleLabel: { ...Typography.label, color: Colors.cream, fontSize: 13 },
  paletteList: { gap: 14 },
  paletteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.charcoal, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  paletteCardSelected: { borderColor: Colors.accent },
  colorSwatches: { flexDirection: 'row', gap: 6 },
  swatch: { width: 24, height: 24, borderRadius: 12 },
  paletteLabel: { ...Typography.body, color: Colors.cream, flex: 1 },
  checkmark: { color: Colors.accent, fontSize: 18, fontWeight: '700' },
  ctaArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16,
    backgroundColor: Colors.obsidian,
  },
  primaryButton: {
    height: 56, backgroundColor: Colors.accent, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: { ...Typography.label, fontSize: 16, fontWeight: '700', color: Colors.obsidian },
});

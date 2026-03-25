// src/screens/BodyRatioScreen.tsx
// FUNCTIONAL — Body Ratio Input with real-time SVG Avatar
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, PanResponder, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useBodyStore } from '../stores/bodyStore';
import AvatarCanvas from '../components/AvatarCanvas';
import { BodyMeasurements } from '../services/bodyRatio.service';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Custom Slider (no native module required)
// ---------------------------------------------------------------------------
interface SliderProps {
  min: number;
  max: number;
  value: number;
  unit: string;
  label: string;
  color?: string;
  onChange: (v: number) => void;
}

const TRACK_W = 280;

function RatioSlider({ min, max, value, unit, label, color = Colors.accent, onChange }: SliderProps) {
  const pct = (value - min) / (max - min);
  const thumbX = useRef(new Animated.Value(pct * TRACK_W)).current;
  const lastX  = useRef(pct * TRACK_W);

  useEffect(() => {
    const target = ((value - min) / (max - min)) * TRACK_W;
    lastX.current = target;
    thumbX.setValue(target);
  }, []); // only on mount

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        (thumbX as any)._startingValue = lastX.current;
      },
      onPanResponderMove: (_, gs) => {
        const next = Math.min(TRACK_W, Math.max(0, (thumbX as any)._startingValue + gs.dx));
        lastX.current = next;
        thumbX.setValue(next);
        const newVal = Math.round(min + (next / TRACK_W) * (max - min));
        onChange(newVal);
      },
    }),
  ).current;

  const fillW = thumbX.interpolate({ inputRange: [0, TRACK_W], outputRange: [0, TRACK_W] });

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color }]}>
          {value}<Text style={sliderStyles.unit}> {unit}</Text>
        </Text>
      </View>
      <View style={[sliderStyles.track, { width: TRACK_W }]}>
        <Animated.View style={[sliderStyles.fill, { width: fillW, backgroundColor: color }]} />
        <Animated.View
          style={[sliderStyles.thumb, { backgroundColor: color, transform: [{ translateX: thumbX }] }]}
          {...pan.panHandlers}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...Typography.label, color: Colors.silver, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { ...Typography.h3, fontSize: 20 },
  unit: { ...Typography.caption, color: Colors.silver, fontSize: 12 },
  track: {
    height: 6, backgroundColor: Colors.charcoal,
    borderRadius: 3, overflow: 'visible',
    borderWidth: 1, borderColor: Colors.silver + '15',
  },
  fill: { position: 'absolute', height: 6, borderRadius: 3, left: 0, opacity: 0.7 },
  thumb: {
    position: 'absolute', top: -7,
    width: 20, height: 20, borderRadius: 10,
    marginLeft: -10,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
    elevation: 4,
  },
});

// ---------------------------------------------------------------------------
// Body type badge colours
// ---------------------------------------------------------------------------
const TYPE_COLORS: Record<string, string> = {
  Hourglass: '#C4A882',
  Pear: '#4CAF78',
  Apple: '#E03E3E',
  Rectangle: '#6C9EFF',
  'Inverted Triangle': '#C47FE0',
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function BodyRatioScreen() {
  const { measurements, modelParams, bodyType, setMeasurement, saveToStorage, loadFromStorage, hydrated } = useBodyStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const handleSave = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await saveToStorage();
  };

  const typeColor = TYPE_COLORS[bodyType] ?? Colors.accent;

  const sliders: Array<{ key: keyof BodyMeasurements; label: string; min: number; max: number; unit: string }> = [
    { key: 'height',    label: 'Height',         min: 140, max: 220, unit: 'cm' },
    { key: 'shoulders', label: 'Shoulder Width',  min: 30,  max: 60,  unit: 'cm' },
    { key: 'waist',     label: 'Waist',           min: 50,  max: 100, unit: 'cm' },
    { key: 'hips',      label: 'Hips',            min: 60,  max: 130, unit: 'cm' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.headline}>Body Ratio{'\n'}Profile</Text>
      <Text style={styles.subheadline}>
        Adjust the sliders to match your measurements. The avatar updates in real-time.
      </Text>

      {/* Avatar + Body Type */}
      <View style={styles.avatarCard}>
        <AvatarCanvas params={modelParams} size={120} />
        <View style={styles.avatarInfo}>
          <Text style={styles.avatarLabel}>BODY TYPE</Text>
          <View style={[styles.typePill, { borderColor: typeColor + '60', backgroundColor: typeColor + '15' }]}>
            <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.typeText, { color: typeColor }]}>{bodyType}</Text>
          </View>
          <Text style={styles.typeHint}>Updates as you move the sliders</Text>
        </View>
      </View>

      {/* Sliders */}
      <View style={styles.slidersCard}>
        {sliders.map((s) => (
          <RatioSlider
            key={s.key}
            label={s.label}
            min={s.min}
            max={s.max}
            value={measurements[s.key]}
            unit={s.unit}
            onChange={(v) => setMeasurement(s.key, v)}
          />
        ))}
      </View>

      {/* Styling tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Styling Tips for {bodyType}</Text>
        {(bodyType === 'Hourglass'
          ? ['Define your waist with belted outfits.', 'Wrap dresses accentuate your natural shape.', 'Fitted blazers and pencil skirts are your best friends.']
          : bodyType === 'Pear'
          ? ['Bright or patterned tops draw attention upward.', 'Dark-coloured bottoms create a balanced silhouette.', 'A-line skirts flatter your hips beautifully.']
          : bodyType === 'Inverted Triangle'
          ? ['Wide-leg trousers balance your broader shoulders.', 'Minimise shoulder seams — avoid cap sleeves.', 'Peplum tops and flared trousers add hip volume.']
          : bodyType === 'Apple'
          ? ['Empire-waist tops elongate your torso.', 'V-necks and wrap tops create a flattering neckline.', 'Straight-leg or bootcut jeans provide balance.']
          : ['Create curves with peplum, ruffles, and layering.', 'Belted coats and dresses add waist definition.', 'Textured or patterned fabrics add visual interest.']
        ).map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <Text style={styles.tipDot}>✦</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Save CTA */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save Measurements ✓</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your measurements are stored locally and used only to personalise your try-on experience.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48, gap: 20 },
  headline: { ...Typography.h1, color: Colors.cream, lineHeight: 36 },
  subheadline: { ...Typography.body, color: Colors.silver, lineHeight: 22 },

  avatarCard: {
    backgroundColor: Colors.charcoal, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.silver + '15',
    flexDirection: 'row', alignItems: 'center', gap: 24,
  },
  avatarInfo: { flex: 1, gap: 10 },
  avatarLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 100, borderWidth: 1,
  },
  typeDot: { width: 7, height: 7, borderRadius: 4 },
  typeText: { ...Typography.label, fontSize: 14, fontWeight: '700' },
  typeHint: { ...Typography.caption, color: Colors.silver + '60', lineHeight: 16 },

  slidersCard: {
    backgroundColor: Colors.charcoal, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.silver + '15', gap: 24,
  },

  tipsCard: {
    backgroundColor: Colors.charcoal, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.accent + '30', gap: 12,
  },
  tipsTitle: { ...Typography.h3, color: Colors.cream, marginBottom: 4 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipDot: { color: Colors.accent, fontSize: 10, marginTop: 4 },
  tipText: { ...Typography.body, color: Colors.silver, flex: 1, lineHeight: 22 },

  primaryButton: {
    height: 56, backgroundColor: Colors.accent, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  primaryButtonText: { ...Typography.label, fontSize: 16, fontWeight: '700', color: Colors.obsidian },
  disclaimer: { ...Typography.caption, color: Colors.silver + '50', textAlign: 'center', lineHeight: 18 },
});

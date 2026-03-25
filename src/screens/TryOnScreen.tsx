// src/screens/TryOnScreen.tsx
// FUNCTIONAL — AI Try-On with Toggle View (3D Stylized ↔ AI Photorealistic)
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { tryOnOutfit, TryOnResult } from '../services/aiTryOn.service';
import { useBodyStore } from '../stores/bodyStore';
import AvatarCanvas from '../components/AvatarCanvas';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { decode } from 'base64-arraybuffer';

type ViewMode = '3d' | 'ai';

// Garment colour palette (stand-in until real garment images are used)
const GARMENT_COLORS = ['#C4A882', '#4F7EFF', '#E03E3E', '#4CAF78', '#C47FE0', '#E8A838'];

export default function TryOnScreen() {
  const { modelParams, loadFromStorage, hydrated } = useBodyStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  const [viewMode, setViewMode]   = useState<ViewMode>('3d');
  const [userPhoto, setUserPhoto] = useState<{ uri: string, base64: string } | null>(null);
  const [garment, setGarment] = useState<{ uri: string, base64: string } | null>(null);
  const [garmentColor, setGarmentColor] = useState(GARMENT_COLORS[0]);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<TryOnResult | null>(null);

  useEffect(() => {
    if (!hydrated) loadFromStorage();
  }, []);

  // ── Photo pickers ──────────────────────────────────────────────────────────
  const pickUserPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0].base64) {
      setUserPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64 });
      setResult(null);
    }
  };

  const pickGarment = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0].base64) {
      setGarment({ uri: res.assets[0].uri, base64: res.assets[0].base64 });
      setGarmentColor(GARMENT_COLORS[Math.floor(Math.random() * GARMENT_COLORS.length)]);
      setResult(null);
    }
  };

  // ── Try-On trigger ─────────────────────────────────────────────────────────
  const handleTryOn = async () => {
    if (!userPhoto || !garment || !user) {
      Alert.alert('Required', 'Please select both your photo and a garment.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // 1. Upload User Photo Buffer to Supabase
      const modelPath = `tryon/${user.id}/${Date.now()}_model.jpg`;
      await supabase.storage.from('app_images').upload(modelPath, decode(userPhoto.base64), { contentType: 'image/jpeg' });
      const { data: modelData } = supabase.storage.from('app_images').getPublicUrl(modelPath);

      // 2. Upload Garment Photo Buffer to Supabase
      const garmentPath = `tryon/${user.id}/${Date.now()}_garment.jpg`;
      await supabase.storage.from('app_images').upload(garmentPath, decode(garment.base64), { contentType: 'image/jpeg' });
      const { data: garmentData } = supabase.storage.from('app_images').getPublicUrl(garmentPath);

      // 3. Dispatch to AI Engine
      const res = await tryOnOutfit({
        userPhotoUri: modelData.publicUrl,
        garmentImageUri: garmentData.publicUrl,
        mode: 'photorealistic',
      });
      setResult(res);
      setViewMode('ai');
    } catch (err) {
      Alert.alert('Try-On failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sub-components ─────────────────────────────────────────────────────────
  const renderPhotoSlot = (
    label: string,
    uri: string | null,
    onPress: () => void,
    accent?: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.photoSlot, accent && styles.photoSlotAccent]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>{accent ? '📸' : '👗'}</Text>
          <Text style={styles.photoLabel}>{label}</Text>
          <View style={styles.photoButton}>
            <Text style={styles.photoButtonText}>Choose</Text>
          </View>
        </View>
      )}
      {uri && (
        <View style={styles.photoOverlayLabel}>
          <Text style={styles.photoOverlayText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ── Toggle pill ────────────────────────────────────────────────────────────
  const renderToggle = () => (
    <View style={styles.toggleContainer}>
      {(['3d', 'ai'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[styles.togglePill, viewMode === mode && styles.togglePillActive]}
          onPress={() => setViewMode(mode)}
        >
          <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
            {mode === '3d' ? '✦ 3D Stylized' : '🪄 AI Photorealistic'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Result panel ───────────────────────────────────────────────────────────
  const renderResultPanel = () => {
    if (viewMode === '3d') {
      return (
        <View style={styles.resultPanel}>
          <AvatarCanvas params={modelParams} size={140} garmentColor={garmentColor} />
          <Text style={styles.resultHint}>
            Avatar sized to your measurements.{'\n'}Pick a garment to dress it.
          </Text>
        </View>
      );
    }
    // AI mode
    if (loading) {
      return (
        <View style={styles.resultPanel}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.resultHint}>Generating your look…</Text>
        </View>
      );
    }
    if (result) {
      return (
        <View style={styles.resultPanel}>
          <Image source={{ uri: result.imageUrl }} style={styles.resultImage} resizeMode="cover" />
          <Text style={styles.resultMeta}>
            Generated in {result.processingTimeMs}ms
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.resultPanel}>
        <Text style={{ fontSize: 48 }}>🧍</Text>
        <Text style={styles.resultHint}>Tap "Generate Try-On" to see yourself in this outfit.</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={styles.headline}>Virtual{'\n'}Try-On</Text>
          <Text style={styles.subheadline}>
            See yourself in any outfit — stylised avatar or AI-generated photorealistic preview.
          </Text>
        </View>
        <TouchableOpacity style={styles.hairButton} onPress={() => navigation.navigate('HairstyleStudio')}>
          <Text style={styles.hairIcon}>✂️</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle */}
      {renderToggle()}

      {/* Result panel */}
      <View style={styles.resultCard}>
        {renderResultPanel()}
      </View>

      {/* Photo pickers */}
      <View style={styles.pickerRow}>
        {renderPhotoSlot('Your Photo', userPhoto?.uri || null, pickUserPhoto, true)}
        {renderPhotoSlot('Garment', garment?.uri || null, pickGarment, false)}
      </View>

      {/* How it works */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>How It Works</Text>
        {[
          { n: '01', text: 'Upload a front-facing photo of yourself' },
          { n: '02', text: 'Select a garment image from your gallery' },
          { n: '03', text: 'AI generates a photorealistic try-on in seconds' },
        ].map(({ n, text }) => (
          <View key={n} style={styles.stepRow}>
            <Text style={styles.stepNum}>{n}</Text>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleTryOn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.obsidian} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {result ? 'Regenerate Try-On 🪄' : 'Generate Try-On 🪄'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        AI Try-On powered by Fashn.ai. Add your EXPO_PUBLIC_FASHN_API_KEY to enable photorealistic results.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48, gap: 20 },
  headline: { ...Typography.h1, color: Colors.cream, lineHeight: 36 },
  subheadline: { ...Typography.body, color: Colors.silver, lineHeight: 22, maxWidth: '85%' },
  
  hairButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.silver + '20',
  },
  hairIcon: { fontSize: 20 },

  // Toggle
  toggleContainer: {
    flexDirection: 'row', backgroundColor: Colors.charcoal,
    borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: Colors.silver + '15',
  },
  togglePill: {
    flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
  },
  togglePillActive: { backgroundColor: Colors.accent },
  toggleText: { ...Typography.label, color: Colors.silver, fontSize: 12 },
  toggleTextActive: { color: Colors.obsidian, fontWeight: '700' },

  // Result preview card
  resultCard: {
    backgroundColor: Colors.charcoal, borderRadius: 24,
    borderWidth: 1, borderColor: Colors.silver + '15',
    minHeight: 320, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  resultPanel: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  resultImage: { width: 240, height: 320, borderRadius: 16 },
  resultHint: {
    ...Typography.caption, color: Colors.silver, textAlign: 'center',
    lineHeight: 18, paddingHorizontal: 24,
  },
  resultMeta: { ...Typography.caption, color: Colors.accent },

  // Photo pickers
  pickerRow: { flexDirection: 'row', gap: 12 },
  photoSlot: {
    flex: 1, aspectRatio: 0.75, backgroundColor: Colors.charcoal,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.silver + '20',
    overflow: 'hidden',
  },
  photoSlotAccent: { borderColor: Colors.accent + '40' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  photoIcon: { fontSize: 32 },
  photoLabel: { ...Typography.caption, color: Colors.silver, textAlign: 'center' },
  photoButton: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.obsidian, borderWidth: 1, borderColor: Colors.silver + '30',
  },
  photoButtonText: { ...Typography.label, color: Colors.cream, fontSize: 11 },
  photoImage: { width: '100%', height: '100%' },
  photoOverlayLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.obsidian + 'CC', padding: 8, alignItems: 'center',
  },
  photoOverlayText: { ...Typography.caption, color: Colors.cream },

  // Steps
  stepsCard: {
    backgroundColor: Colors.charcoal, borderRadius: 20, padding: 20,
    gap: 14, borderWidth: 1, borderColor: Colors.silver + '15',
  },
  stepsTitle: { ...Typography.h3, color: Colors.cream, marginBottom: 4 },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNum: { ...Typography.label, color: Colors.accent, fontSize: 12, width: 24 },
  stepText: { ...Typography.body, color: Colors.silver, flex: 1, lineHeight: 22 },

  // CTA
  primaryButton: {
    height: 56, backgroundColor: Colors.accent, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...Typography.label, fontSize: 16, fontWeight: '700', color: Colors.obsidian },
  disclaimer: { ...Typography.caption, color: Colors.silver + '50', textAlign: 'center', lineHeight: 18 },
});

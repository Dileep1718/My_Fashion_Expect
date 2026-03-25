// src/screens/OutfitSuggestionScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width } = Dimensions.get('window');

const SUGGESTIONS = [
  {
    id: '1', emoji: '✦', title: 'Your Perfect Monday',
    items: ['White Tee', 'Black Jeans', 'Off-White Kicks'],
    match: '97%', mood: 'Minimal',
  },
  {
    id: '2', emoji: '🌿', title: 'Weekend Boho Fit',
    items: ['Wrap Dress', 'Leather Sandals', 'Woven Bag'],
    match: '93%', mood: 'Boho',
  },
  {
    id: '3', emoji: '🧢', title: 'Street Core Drop',
    items: ['Graphic Hoodie', 'Cargo Pants', 'Chunky Sneakers'],
    match: '89%', mood: 'Street',
  },
];

export default function OutfitSuggestionScreen() {
  const [saved, setSaved] = useState<string[]>([]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>AI Suggestions</Text>
      <Text style={styles.subheadline}>Curated for your style DNA — updated daily.</Text>

      {/* Context banner */}
      <View style={styles.contextBanner}>
        <Text style={styles.contextEmoji}>🌤</Text>
        <View>
          <Text style={styles.contextTitle}>Today: Mild, 22°C</Text>
          <Text style={styles.contextSub}>Style matches optimised for weather</Text>
        </View>
      </View>

      {/* Suggestion cards */}
      {SUGGESTIONS.map((s) => (
        <View key={s.id} style={styles.suggestionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{s.match} match</Text>
            </View>
          </View>

          <Text style={styles.suggestionTitle}>{s.title}</Text>
          <View style={styles.moodChip}>
            <Text style={styles.moodText}>{s.mood}</Text>
          </View>

          <View style={styles.itemsList}>
            {s.items.map((item) => (
              <View key={item} style={styles.itemRow}>
                <View style={styles.itemDot} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.saveButton, saved.includes(s.id) && styles.saveButtonActive]}
              onPress={() => setSaved((prev) =>
                prev.includes(s.id) ? prev.filter((i) => i !== s.id) : [...prev, s.id]
              )}
            >
              <Text style={[styles.saveButtonText, saved.includes(s.id) && styles.saveButtonTextActive]}>
                {saved.includes(s.id) ? '✓ Saved' : '♡ Save Look'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tryButton}>
              <Text style={styles.tryButtonText}>Try →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 100, gap: 20 },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  contextBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: Colors.charcoal, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.silver + '20',
  },
  contextEmoji: { fontSize: 28 },
  contextTitle: { ...Typography.body, color: Colors.cream, fontWeight: '600' },
  contextSub: { ...Typography.caption, color: Colors.silver },
  suggestionCard: {
    backgroundColor: Colors.charcoal, borderRadius: 24, padding: 20,
    gap: 12, borderWidth: 1, borderColor: Colors.silver + '15',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  suggestionEmoji: { fontSize: 36 },
  matchBadge: {
    backgroundColor: Colors.accent + '20', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.accent + '40',
  },
  matchText: { ...Typography.label, color: Colors.accent },
  suggestionTitle: { ...Typography.h3, color: Colors.cream },
  moodChip: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100, backgroundColor: Colors.white10,
    borderWidth: 0.5, borderColor: Colors.silver + '30',
  },
  moodText: { ...Typography.label, color: Colors.silver, fontSize: 10 },
  itemsList: { gap: 8 },
  itemRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
  itemText: { ...Typography.body, color: Colors.silver },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  saveButton: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.silver + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  saveButtonActive: { backgroundColor: Colors.accent + '20', borderColor: Colors.accent },
  saveButtonText: { ...Typography.label, color: Colors.silver, fontSize: 13 },
  saveButtonTextActive: { color: Colors.accent },
  tryButton: {
    flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  tryButtonText: { ...Typography.label, color: Colors.obsidian, fontSize: 13 },
});

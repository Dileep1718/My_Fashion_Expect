// src/screens/SearchScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const TRENDING_TAGS = ['#MinimalChic', '#StreetCore', '#CozyFit', '#GlamNight', '#BohoEdit', '#EdgyLook'];
const RESULTS = [
  { id: '1', emoji: '◻️', label: 'Minimal White Set', views: '12K' },
  { id: '2', emoji: '🧢', label: 'Street Core Drip', views: '8.3K' },
  { id: '3', emoji: '🌿', label: 'Boho Summer Look', views: '6.1K' },
  { id: '4', emoji: '✨', label: 'Glam Evening Fit', views: '4.9K' },
];

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 12) / 2;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchArea}>
        <Text style={styles.headline}>Explore</Text>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search styles, outfits, tags…"
            placeholderTextColor={Colors.silver + '60'}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trending tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRENDING NOW</Text>
          <View style={styles.tagWrap}>
            {TRENDING_TAGS.map((tag) => (
              <TouchableOpacity key={tag} style={styles.trendTag} onPress={() => setQuery(tag)}>
                <Text style={styles.trendTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{query ? `RESULTS FOR "${query}"` : 'POPULAR THIS WEEK'}</Text>
          <View style={styles.resultsGrid}>
            {RESULTS.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultCard, i === 0 && { width: '100%', height: 160 }]}
              >
                <Text style={styles.resultEmoji}>{item.emoji}</Text>
                <View style={styles.resultFooter}>
                  <Text style={styles.resultLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.resultViews}>{item.views} views</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  searchArea: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12, gap: 12 },
  headline: { ...Typography.h1, color: Colors.cream },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.charcoal, borderRadius: 14, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: Colors.silver + '25',
  },
  searchBarFocused: { borderColor: Colors.accent + '80' },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.cream, fontSize: 15 },
  clearIcon: { color: Colors.silver, fontSize: 14 },
  content: { paddingHorizontal: 24, paddingBottom: 100, gap: 24 },
  section: { gap: 12 },
  sectionLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendTag: {
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.charcoal,
    borderRadius: 100, borderWidth: 1, borderColor: Colors.silver + '25',
  },
  trendTagText: { ...Typography.label, color: Colors.cream, fontSize: 12 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultCard: {
    width: CARD_W, height: 140, backgroundColor: Colors.charcoal, borderRadius: 18,
    padding: 14, justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.silver + '15',
  },
  resultEmoji: { fontSize: 36 },
  resultFooter: { gap: 3 },
  resultLabel: { ...Typography.body, color: Colors.cream, fontWeight: '600', fontSize: 13 },
  resultViews: { ...Typography.caption, color: Colors.silver },
});

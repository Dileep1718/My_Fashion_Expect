// src/screens/HomeFeedScreen.tsx — Bento 2.0 grid layout
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');
const MARGIN = 24;
const GUTTER = 16;
const CARD_UNIT = (width - MARGIN * 2 - GUTTER) / 2;

const BENTO_ITEMS = [
  { id: '1', size: '2x1', label: 'Trending Today', tag: 'TRENDING', color: Colors.charcoal, emoji: '🔥', height: CARD_UNIT },
  { id: '2', size: '1x1', label: 'Minimal Look', tag: 'FOR YOU', color: '#1C1712', emoji: '◻️', height: CARD_UNIT },
  { id: '3', size: '1x1', label: 'Street Style', tag: 'POPULAR', color: '#111823', emoji: '🧢', height: CARD_UNIT },
  { id: '4', size: '1x2', label: 'Editorial Pick', tag: 'CURATED', color: '#18120E', emoji: '✦', height: CARD_UNIT * 2 + GUTTER },
  { id: '5', size: '1x1', label: 'Boho Vibes', tag: 'TRENDING', color: '#1A1510', emoji: '🌿', height: CARD_UNIT },
  { id: '6', size: '2x1', label: 'Your AI Suggestion', tag: 'AI PICK', color: '#130A1A', emoji: '🪄', height: CARD_UNIT },
];

const BentoCard = ({ item, style }: any) => (
  <TouchableOpacity style={[styles.bentoCard, { backgroundColor: item.color }, style]}>
    {item.image && (
      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    )}
    {!item.image ? <Text style={styles.cardEmoji}>{item.emoji}</Text> : <View style={{ flex: 1 }} />}
    <View style={[styles.cardFooter, item.image && { backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 8 }]}>
      <View style={[styles.tagChip, item.id === '6' && { backgroundColor: Colors.accent + '20', borderColor: Colors.accent + '60' }]}>
        <Text style={[styles.tagText, item.id === '6' && { color: Colors.accent }]}>{item.tag}</Text>
      </View>
      <Text style={[styles.cardLabel, item.image && { textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
        {item.label}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function HomeFeedScreen() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setPosts(data);
    };
    fetchLatest();
  }, []);

  const dataItems = BENTO_ITEMS.map((item, index) => {
    const post = posts[index];
    if (post) {
      return { 
        ...item, 
        image: post.image_url, 
        label: post.profiles?.name ? `@${post.profiles.name.replace(/\s+/g, '').toLowerCase()}` : item.label,
        tag: 'NEW OOTD' 
      };
    }
    return item;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening ✦</Text>
          <Text style={styles.headerTitle}>Your Feed</Text>
        </View>
        <TouchableOpacity style={styles.avatarButton}>
          <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'MO'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
      >
        {['For You', 'Trending', 'Minimal', 'Street', 'Boho', 'Glam', 'Edgy'].map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[styles.pill, i === 0 && styles.pillActive]}
          >
            <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bento Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {/* Row 1: 2x1 full-width */}
        <BentoCard item={dataItems[0]} style={{ height: dataItems[0].height }} />

        {/* Row 2: two 1x1 + one 1x2 */}
        <View style={styles.bentoRow}>
          <View style={{ flex: 1, gap: GUTTER }}>
            {dataItems.slice(1, 3).map((item) => (
              <BentoCard key={item.id} item={item} style={{ height: item.height }} />
            ))}
          </View>
          <BentoCard item={dataItems[3]} style={{ width: CARD_UNIT, height: dataItems[3].height }} />
        </View>

        {/* Row 3 */}
        <View style={styles.bentoRow}>
          <BentoCard item={dataItems[4]} style={{ flex: 1, height: dataItems[4].height }} />
        </View>

        {/* Row 4: 2x1 full-width */}
        <BentoCard item={dataItems[5]} style={{ height: dataItems[5].height, borderColor: Colors.accent + '40', borderWidth: 1 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: MARGIN, paddingTop: 60, paddingBottom: 16,
  },
  greeting: { ...Typography.caption, color: Colors.silver, marginBottom: 2 },
  headerTitle: { ...Typography.h1, color: Colors.cream },
  avatarButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.label, color: Colors.obsidian },
  pillsContainer: { paddingHorizontal: MARGIN, gap: 8, paddingBottom: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 100,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.silver + '20',
  },
  pillActive: { backgroundColor: Colors.accent },
  pillText: { ...Typography.label, color: Colors.silver },
  pillTextActive: { color: Colors.obsidian },
  grid: { paddingHorizontal: MARGIN, paddingBottom: 100, gap: GUTTER },
  bentoRow: { flexDirection: 'row', gap: GUTTER },
  bentoCard: {
    flex: 1, borderRadius: 20, padding: 16,
    justifyContent: 'space-between', overflow: 'hidden',
  },
  cardEmoji: { fontSize: 36 },
  cardFooter: { gap: 6 },
  tagChip: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 100, backgroundColor: Colors.white10,
    borderWidth: 0.5, borderColor: Colors.silver + '40',
  },
  tagText: { ...Typography.label, color: Colors.cream, fontSize: 9 },
  cardLabel: { ...Typography.h3, color: Colors.cream, fontSize: 14 },
});

// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Image
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48 - 8) / 3;

const OUTFIT_PLACEHOLDERS = ['◻️', '🧢', '🌿', '✦', '🖤', '🌸', '🔥', '🪄', '👔'];

export default function ProfileScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Outfits');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfileData = async () => {
      setLoading(true);
      // Fetch user's posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (postsData) setOutfits(postsData);

      // Fetch user's wishlist
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (wishlistData) setSaved(wishlistData);

      setLoading(false);
    };
    fetchProfileData();
  }, [user]);

  const displayItems = activeTab === 'Saved' ? saved : outfits;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.coverArt} />
        <View style={styles.topRightActions}>
          <TouchableOpacity onPress={() => navigation?.navigate('PremiumCart')} style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛍️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'MO'}</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.username}>@{user?.name?.replace(/\s+/g, '').toLowerCase() || 'myoutfit'}</Text>
        <Text style={styles.bio}>Fashion is a language. Dress like you mean it. ✦</Text>
         <View style={styles.statsRow}>
          {[
            { label: 'Outfits', value: outfits.length.toString(), route: 'History' },
            { label: 'Saved', value: saved.length.toString(), route: 'Main' }, // Route to closet/saved
            { label: 'Followers', value: '2.4K', route: 'FollowerFeed' },
          ].map(({ label, value, route }) => (
            <TouchableOpacity key={label} style={styles.stat} onPress={() => navigation?.navigate(route as never)}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation?.navigate('Settings')}
          >
            <Text style={styles.iconButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab filter */}
      <View style={styles.tabRow}>
        {['Outfits', 'Saved', 'History'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              if (tab === 'History') navigation?.navigate('History');
              else if (tab === 'Saved' || tab === 'Outfits') setActiveTab(tab);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
        ) : displayItems.length > 0 ? (
          displayItems.map((item, i) => (
            <TouchableOpacity key={item.id || i} style={[styles.gridItem, { overflow: 'hidden' }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.gridEmoji}>📸</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          OUTFIT_PLACEHOLDERS.map((emoji, i) => (
            <TouchableOpacity key={i} style={styles.gridItem}>
              <Text style={styles.gridEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { height: 180 },
  coverArt: {
    height: 140, backgroundColor: Colors.charcoal,
    borderBottomWidth: 0, borderColor: Colors.silver + '20',
  },
  topRightActions: { position: 'absolute', top: 56, right: 24, flexDirection: 'row', gap: 12 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  cartIcon: { fontSize: 20 },
  avatarWrapper: {
    position: 'absolute', bottom: 0, left: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.obsidian,
  },
  avatarText: { ...Typography.h2, color: Colors.obsidian },
  bioSection: { paddingHorizontal: 24, paddingTop: 12, gap: 12, paddingBottom: 16 },
  username: { ...Typography.h3, color: Colors.cream },
  bio: { ...Typography.body, color: Colors.silver, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 32 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h3, color: Colors.cream },
  statLabel: { ...Typography.caption, color: Colors.silver },
  actionRow: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    flex: 1, height: 44, backgroundColor: Colors.charcoal, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.silver + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { ...Typography.label, color: Colors.cream, fontSize: 14 },
  iconButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.silver + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  iconButtonText: { fontSize: 18 },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: Colors.silver + '20', marginHorizontal: 24,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { ...Typography.label, color: Colors.silver },
  tabTextActive: { color: Colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 24, gap: 8, paddingBottom: 120 },
  gridItem: {
    width: GRID_SIZE, height: GRID_SIZE, backgroundColor: Colors.charcoal,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  gridEmoji: { fontSize: 32 },
});

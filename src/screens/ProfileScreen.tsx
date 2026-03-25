// src/screens/ProfileScreen.tsx — Premium redesigned profile with Stories tab
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, Image, FlatList, StatusBar, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48 - 8) / 3;

const TABS = ['Posts', 'Saved', 'Stories'];

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function ProfileScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Posts');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [myStories, setMyStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Profile
    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('name, nickname, bio, avatar_url, ootd_streak, ootd_last_post_date, is_public')
        .eq('id', user.id)
        .single();
      if (profileRow) setProfile(profileRow);
    } catch {}

    // Posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (postsData) setOutfits(postsData);

    // Saved posts
    const { data: savedData } = await supabase
      .from('saved_posts')
      .select('post_id, created_at, posts(*, profiles(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (savedData) setSaved(savedData.map((row: any) => row.posts).filter(Boolean));

    // My active stories
    const { data: storiesData } = await supabase
      .from('stories')
      .select('*, story_views(viewer_id)')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (storiesData) {
      setMyStories(storiesData.map((s: any) => ({
        ...s,
        viewCount: (s.story_views || []).length,
      })));
    }

    // Followers / Following counts
    const { count: fwrCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);
    setFollowersCount(fwrCount || 0);

    const { count: fwingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);
    setFollowingCount(fwingCount || 0);

    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const displayName = profile?.nickname || profile?.name || user?.name || 'myoutfit';
  const username = (profile?.name || user?.name || 'myoutfit').replace(/\s+/g, '').toLowerCase();
  const avatarLetter = displayName.substring(0, 2).toUpperCase();

  const displayItems = activeTab === 'Saved' ? saved : activeTab === 'Stories' ? myStories : outfits;

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    if (activeTab === 'Stories') {
      // Story tile: show view count
      const expiresAt = new Date(item.expires_at).getTime();
      const now = Date.now();
      const hoursLeft = Math.max(0, Math.round((expiresAt - now) / 3600000));
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation?.navigate('StoryViewer', { stories: [item], startIndex: 0 })}
          onLongPress={() => {
            Alert.alert('Delete Story', 'Remove this story?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                await supabase.from('stories').delete().eq('id', item.id);
                fetchAll();
              }}
            ]);
          }}
        >
          {item.media_url ? (
            <Image source={{ uri: item.media_url }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={styles.storyPlaceholder}>
              <Text style={{ fontSize: 28 }}>✦</Text>
            </View>
          )}
          {/* Overlay */}
          <View style={styles.storyOverlay}>
            <Text style={styles.storyViewText}>👁 {item.viewCount}</Text>
            <Text style={styles.storyTimeLeft}>{hoursLeft}h</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.gridItem, { overflow: 'hidden' }]}
        onPress={() => navigation?.navigate('PostViewer', { post: item })}
        onLongPress={() => {
          Alert.alert('Delete Post', 'Delete this outfit?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              await supabase.from('posts').delete().eq('id', item.id);
              fetchAll();
            }}
          ]);
        }}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={styles.gridItemEmpty}>
            <Text style={{ fontSize: 28 }}>📸</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={displayItems}
        keyExtractor={(item, i) => item.id || String(i)}
        numColumns={3}
        key={activeTab} /* force re-render when tab changes with different numColumns */
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridList}
        columnWrapperStyle={styles.gridRow}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <>
            {/* ── Cover + Avatar ── */}
            <View style={styles.headerHero}>
              {/* Gradient cover */}
              <View style={styles.coverGradientBg} />
              <View style={styles.coverOverlay} />

              {/* Top action row */}
              <View style={styles.topActions}>
                <TouchableOpacity onPress={() => navigation?.navigate('PremiumCart')} style={styles.heroIconBtn}>
                  <Text style={{ fontSize: 22 }}>🛍️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation?.navigate('Settings')} style={styles.heroIconBtn}>
                  <Text style={{ fontSize: 22 }}>⚙️</Text>
                </TouchableOpacity>
              </View>

              {/* Avatar circle */}
              <View style={styles.avatarArea}>
                {/* Story ring if user has active stories */}
                <View style={[styles.avatarRing, myStories.length > 0 && styles.avatarRingActive]}>
                  <TouchableOpacity
                    onPress={myStories.length > 0 ? () => navigation?.navigate('StoryViewer', { stories: myStories, startIndex: 0 }) : undefined}
                  >
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>{avatarLetter}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Bio + Stats ── */}
            <View style={styles.bioCard}>
              {/* Name + Edit */}
              <View style={styles.bioPrimary}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <Text style={styles.usernameText}>@{username}</Text>
                </View>
                <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation?.navigate('EditProfile')}>
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>

              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : (
                <Text style={styles.bioEmpty}>Fashion is a language. Dress like you mean it. ✦</Text>
              )}

              {/* OOTD Streak badge */}
              {(profile?.ootd_streak ?? 0) > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <Text style={styles.streakText}>{profile.ootd_streak} day streak</Text>
                </View>
              )}

              {/* Stats row */}
              <View style={styles.statsRow}>
                {[
                  { label: 'Posts', value: formatCount(outfits.length) },
                  { label: 'Followers', value: formatCount(followersCount) },
                  { label: 'Following', value: formatCount(followingCount) },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.statBlock}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Quick actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate('OOTDPost')}>
                  <Text style={styles.quickBtnIcon}>📸</Text>
                  <Text style={styles.quickBtnLabel}>Post OOTD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate('StoryCreate')}>
                  <Text style={styles.quickBtnIcon}>✦</Text>
                  <Text style={styles.quickBtnLabel}>Add Story</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtnSecondary} onPress={() => navigation?.navigate('FollowerFeed')}>
                  <Text style={styles.quickBtnSecondaryText}>Following Feed</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Tab Bar ── */}
            <View style={styles.tabBar}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'Stories' ? `${tab} ${myStories.length > 0 ? `(${myStories.length})` : ''}` : tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'Stories' ? '✦' : activeTab === 'Saved' ? '🔖' : '📷'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'Stories' ? 'No active stories' : activeTab === 'Saved' ? 'Nothing saved yet' : 'No posts yet'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'Stories' ? 'Add a story — it vanishes in 24h' : activeTab === 'Saved' ? 'Save outfits from the feed' : 'Post your first OOTD'}
              </Text>
              {activeTab === 'Stories' && (
                <TouchableOpacity style={styles.emptyAction} onPress={() => navigation?.navigate('StoryCreate')}>
                  <Text style={styles.emptyActionText}>Add Story</Text>
                </TouchableOpacity>
              )}
              {activeTab === 'Posts' && (
                <TouchableOpacity style={styles.emptyAction} onPress={() => navigation?.navigate('OOTDPost')}>
                  <Text style={styles.emptyActionText}>Post OOTD</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={renderGridItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },

  // Hero Header
  headerHero: { height: 220, position: 'relative', zIndex: 2, elevation: 2 },
  coverGradientBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.charcoal,
  },
  coverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(196,168,130,0.07)',
  },
  topActions: {
    position: 'absolute', top: 52, right: 16, flexDirection: 'row', gap: 10, zIndex: 10,
  },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarArea: { position: 'absolute', bottom: -44, left: 20 },
  avatarRing: {
    padding: 3, borderRadius: 52,
    borderWidth: 2.5, borderColor: 'transparent',
  },
  avatarRingActive: { borderColor: Colors.accent },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: Colors.obsidian },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.obsidian,
  },
  avatarFallbackText: { ...Typography.h2, color: Colors.accent, fontSize: 28 },

  // Bio Card
  bioCard: {
    backgroundColor: Colors.obsidian,
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, gap: 10,
  },
  bioPrimary: { flexDirection: 'row', alignItems: 'flex-start' },
  displayName: { ...Typography.h2, color: Colors.cream, fontSize: 22 },
  usernameText: { ...Typography.body, color: Colors.silver, marginTop: 2 },
  editProfileBtn: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.silver + '40',
    backgroundColor: Colors.charcoal,
  },
  editProfileText: { color: Colors.cream, fontWeight: '600', fontSize: 13 },
  bio: { ...Typography.body, color: Colors.silver, lineHeight: 22 },
  bioEmpty: { ...Typography.body, color: Colors.silver + '50', fontStyle: 'italic', lineHeight: 22 },

  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '18', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  streakFire: { fontSize: 16 },
  streakText: { color: Colors.accent, fontWeight: '600', fontSize: 13 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.charcoal,
    borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.silver + '12',
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.cream, fontSize: 22 },
  statLabel: { ...Typography.caption, color: Colors.silver, marginTop: 2 },

  quickActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 42, backgroundColor: Colors.accent,
    borderRadius: 22,
  },
  quickBtnIcon: { fontSize: 16 },
  quickBtnLabel: { color: Colors.obsidian, fontWeight: '700', fontSize: 13 },
  quickBtnSecondary: {
    flex: 1, height: 42, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.charcoal, borderRadius: 22,
    borderWidth: 1, borderColor: Colors.silver + '25',
  },
  quickBtnSecondaryText: { color: Colors.silver, fontSize: 13, fontWeight: '600' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.obsidian,
    borderBottomWidth: 1, borderBottomColor: Colors.silver + '18',
    paddingTop: 4,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { ...Typography.label, color: Colors.silver, fontSize: 13 },
  tabTextActive: { color: Colors.accent },

  // Grid
  gridList: { paddingBottom: 120 },
  gridRow: { paddingHorizontal: 24, gap: 8, justifyContent: 'flex-start' as const, marginBottom: 8 },
  gridItem: {
    width: GRID_SIZE, height: GRID_SIZE,
    borderRadius: 12, backgroundColor: Colors.charcoal,
    overflow: 'hidden',
  },
  gridItemEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Story tile
  storyPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accent + '20',
  },
  storyOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 5,
  },
  storyViewText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  storyTimeLeft: { color: Colors.accent, fontSize: 11, fontWeight: '600' },

  // Empty states
  emptyState: { width: '100%', alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji: { fontSize: 44, opacity: 0.5 },
  emptyTitle: { ...Typography.h3, color: Colors.cream },
  emptyText: { ...Typography.body, color: Colors.silver, textAlign: 'center', opacity: 0.7 },
  emptyAction: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: Colors.accent, borderRadius: 22,
  },
  emptyActionText: { color: Colors.obsidian, fontWeight: '700', fontSize: 14 },
} as const);

// src/screens/SearchScreen.tsx — Discover & Search Users
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  Image, ActivityIndicator, Dimensions, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');

interface UserResult {
  id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
}

function UserCard({ user, currentUserId, navigation }: { user: UserResult; currentUserId: string; navigation?: any }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check follow status
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [user.id]);

  const toggleFollow = async () => {
    setLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: user.id });
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: user.id });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  const displayName = user.nickname || user.name || 'user';
  const username = (user.name || 'user').replace(/\s+/g, '').toLowerCase();
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isMe = user.id === currentUserId;

  return (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        if (isMe) {
          navigation?.navigate('Main', { screen: 'Profile' });
        } else {
          navigation?.navigate('UserProfile', { userId: user.id });
        }
      }}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
        )}
        {!user.is_public && (
          <View style={styles.lockBadge}><Text style={styles.lockIcon}>🔒</Text></View>
        )}
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        {user.bio ? <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text> : null}
      </View>

      {/* Follow / You */}
      {!isMe && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={toggleFollow}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isFollowing ? Colors.silver : Colors.obsidian} />
          ) : (
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
      {isMe && <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>}
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [suggested, setSuggested] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Load suggested users (all public profiles minus self) on mount
  const loadSuggested = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, nickname, avatar_url, bio, is_public')
      .neq('id', user.id)
      .eq('is_public', true)
      .order('name')
      .limit(30);
    setSuggested(data || []);
  }, [user]);

  useFocusEffect(useCallback(() => { loadSuggested(); }, [loadSuggested]));

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasFetched(false);
      return;
    }
    const delay = setTimeout(async () => {
      if (!user) return;
      setLoading(true);
      const cleaned = query.trim().toLowerCase();
      const { data } = await supabase
        .from('profiles')
        .select('id, name, nickname, avatar_url, bio, is_public')
        .or(`name.ilike.%${cleaned}%,nickname.ilike.%${cleaned}%`)
        .neq('id', user.id)
        .limit(25);
      setResults(data || []);
      setLoading(false);
      setHasFetched(true);
    }, 350); // debounce
    return () => clearTimeout(delay);
  }, [query]);

  const listData = query.trim() ? results : suggested;
  const isSearching = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover ✦</Text>
        <Text style={styles.subtitle}>Find fashion people to follow</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search users by name..."
            placeholderTextColor={Colors.silver + '60'}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Label */}
      <Text style={styles.sectionLabel}>
        {isSearching ? `Results for "${query}"` : '🌟 Suggested people to follow'}
      </Text>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{isSearching ? '🔍' : '✦'}</Text>
              <Text style={styles.emptyTitle}>
                {isSearching && hasFetched ? 'No users found' : isSearching ? 'Searching…' : 'No suggestions yet'}
              </Text>
              <Text style={styles.emptyText}>
                {isSearching ? 'Try a different name or username' : 'Be the first to post and get discovered!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <UserCard
              user={item}
              currentUserId={user?.id || ''}
              navigation={navigation}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },

  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
  },
  title: { ...Typography.h1, color: Colors.cream, letterSpacing: 0.3 },
  subtitle: { ...Typography.body, color: Colors.silver, marginTop: 4 },

  searchRow: { paddingHorizontal: 20, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.charcoal,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.silver + '20', gap: 10,
  },
  searchIcon: { fontSize: 18, color: Colors.silver },
  searchInput: {
    flex: 1, color: Colors.cream, fontSize: 15, padding: 0,
  },
  clearBtn: { paddingHorizontal: 4 },
  clearBtnText: { color: Colors.silver, fontSize: 16 },

  sectionLabel: {
    ...Typography.label, color: Colors.silver,
    paddingHorizontal: 24, paddingBottom: 12, fontSize: 12, textTransform: 'uppercase', opacity: 0.7,
  },

  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 2 },

  userCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.silver + '10',
    gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.charcoal },
  avatarFallback: { backgroundColor: Colors.accent + '30', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: Colors.accent, fontWeight: '700', fontSize: 18 },
  lockBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: Colors.obsidian, borderRadius: 8,
  },
  lockIcon: { fontSize: 11 },

  userInfo: { flex: 1, gap: 2 },
  displayName: { ...Typography.label, color: Colors.cream, fontSize: 15 },
  username: { ...Typography.caption, color: Colors.silver, fontSize: 12 },
  bio: { ...Typography.caption, color: Colors.silver + '80', fontSize: 12, marginTop: 2 },

  followBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: Colors.accent, borderRadius: 22,
    minWidth: 84, alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: Colors.silver + '40',
  },
  followBtnText: { color: Colors.obsidian, fontWeight: '700', fontSize: 13 },
  followingBtnText: { color: Colors.silver },

  youBadge: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.charcoal, borderRadius: 22,
    borderWidth: 1, borderColor: Colors.silver + '20',
  },
  youBadgeText: { color: Colors.silver, fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, opacity: 0.4 },
  emptyTitle: { ...Typography.h3, color: Colors.cream },
  emptyText: { ...Typography.body, color: Colors.silver, textAlign: 'center', lineHeight: 22 },
});

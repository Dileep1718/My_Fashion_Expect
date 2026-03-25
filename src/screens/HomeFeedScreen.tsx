// src/screens/HomeFeedScreen.tsx — Social Instagram-style Layout with Stories
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
  Image, ActivityIndicator, ScrollView
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Stories Bar (horizontal carousel at the top)
// ─────────────────────────────────────────────
interface StoryGroup {
  user_id: string;
  profile: { name: string; nickname: string | null; avatar_url: string | null };
  stories: any[];
  hasUnseenStory: boolean;
  isMe: boolean;
}

const StoriesBar = ({ currentUserId, navigation }: { currentUserId: string; navigation?: any }) => {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);

  const fetchStories = useCallback(async () => {
    // Fetch active (non-expired) stories
    const { data } = await supabase
      .from('stories')
      .select('*, profiles:user_id(name, nickname, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!data) return;

    // Fetch which stories I have viewed
    const { data: viewedData } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', currentUserId);

    const viewedIds = new Set((viewedData || []).map((v: any) => v.story_id));

    // Group by user
    const groupMap: Record<string, StoryGroup> = {};
    data.forEach((story: any) => {
      const uid = story.user_id;
      if (!groupMap[uid]) {
        const p = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
        groupMap[uid] = {
          user_id: uid,
          profile: p || { name: 'User', nickname: null, avatar_url: null },
          stories: [],
          hasUnseenStory: false,
          isMe: uid === currentUserId,
        };
      }
      if (!viewedIds.has(story.id) && story.user_id !== currentUserId) {
        groupMap[uid].hasUnseenStory = true;
      }
      groupMap[uid].stories.push(story);
    });

    // My profile for "+" button
    const { data: me } = await supabase
      .from('profiles')
      .select('name, nickname, avatar_url')
      .eq('id', currentUserId)
      .single();
    setMyProfile(me);

    // Sort: me first, then unseen, then seen
    const sorted = Object.values(groupMap).sort((a, b) => {
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      if (a.hasUnseenStory && !b.hasUnseenStory) return -1;
      if (!a.hasUnseenStory && b.hasUnseenStory) return 1;
      return 0;
    });

    setStoryGroups(sorted);
  }, [currentUserId]);

  useFocusEffect(useCallback(() => { fetchStories(); }, [fetchStories]));

  const avatarLetter = (p: any) => (p?.nickname || p?.name || 'U').charAt(0).toUpperCase();
  const displayName = (p: any) => {
    const n = p?.nickname || p?.name || '';
    return n.length > 8 ? n.substring(0, 8) + '…' : n;
  };

  return (
    <View style={styles.storiesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
        {/* My story / Add story button */}
        <TouchableOpacity
          style={styles.storyItem}
          onPress={() => navigation?.navigate('StoryCreate')}
        >
          <View style={[styles.storyAvatarWrap, styles.myStoryWrap]}>
            {myProfile?.avatar_url ? (
              <Image source={{ uri: myProfile.avatar_url }} style={styles.storyAvatarImg} />
            ) : (
              <View style={[styles.storyAvatarFallback, { backgroundColor: Colors.charcoal }]}>
                <Text style={styles.storyAvatarLetter}>{avatarLetter(myProfile)}</Text>
              </View>
            )}
            {/* "+" badge */}
            <View style={styles.addBadge}>
              <Text style={styles.addBadgeText}>+</Text>
            </View>
          </View>
          <Text style={styles.storyName}>Your Story</Text>
        </TouchableOpacity>

        {/* Other users' stories */}
        {storyGroups.map((group) => (
          <TouchableOpacity
            key={group.user_id}
            style={styles.storyItem}
            onPress={() => navigation?.navigate('StoryViewer', {
              stories: group.stories,
              startIndex: 0,
            })}
          >
            <View style={[styles.storyAvatarWrap, group.hasUnseenStory ? styles.unseenRing : styles.seenRing]}>
              {group.profile.avatar_url ? (
                <Image source={{ uri: group.profile.avatar_url }} style={styles.storyAvatarImg} />
              ) : (
                <View style={styles.storyAvatarFallback}>
                  <Text style={styles.storyAvatarLetter}>{avatarLetter(group.profile)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.storyName}>{displayName(group.profile)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// Post Card
// ─────────────────────────────────────────────
const PostCard = ({ item, currentUserId, onLikeToggle, onSaveToggle, navigation }: any) => {
  const { id, user_id, image_url, caption, created_at, profiles } = item;
  const [isLiked, setIsLiked] = useState<boolean>(item.isLikedByMe);
  const [likeCount, setLikeCount] = useState<number>(item.likeCount);
  const [isSaved, setIsSaved] = useState<boolean>(item.isSavedByMe);

  const handleLike = async () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
    await onLikeToggle(id, newStatus);
  };

  const handleSave = async () => {
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    await onSaveToggle(id, newStatus);
  };

  const posterProfile = Array.isArray(profiles) ? profiles[0] : profiles;
  const displayName = posterProfile?.nickname || posterProfile?.name || 'user';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const navigateToProfile = () => {
    if (user_id === currentUserId) {
      navigation?.navigate('Main', { screen: 'Profile' });
    } else {
      navigation?.navigate('UserProfile', { userId: user_id });
    }
  };

  return (
    <View style={styles.postCard}>
      {/* Header: avatar + username */}
      <TouchableOpacity style={styles.postHeader} onPress={navigateToProfile} activeOpacity={0.8}>
        <View style={styles.postAvatarWrap}>
          {posterProfile?.avatar_url ? (
            <Image source={{ uri: posterProfile.avatar_url }} style={styles.postAvatarImg} />
          ) : (
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarInitial}>{avatarLetter}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postUsername}>@{(posterProfile?.name || 'user').replace(/\s+/g, '').toLowerCase()}</Text>
          <Text style={styles.postTime}>{formatRelativeTime(created_at)}</Text>
        </View>
        <View style={styles.moreBtn}>
          <Text style={{ color: Colors.silver, fontSize: 18 }}>⋯</Text>
        </View>
      </TouchableOpacity>

      {/* Image */}
      {image_url ? (
        <TouchableOpacity activeOpacity={0.97} onPress={() => navigation?.navigate('PostViewer', { post: item })}>
          <Image source={{ uri: image_url }} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : (
        <View style={[styles.postImage, { backgroundColor: Colors.charcoal, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 40 }}>📸</Text>
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionGroup}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? Colors.blush : Colors.cream} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation?.navigate('PostComments', { postId: id })} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.cream} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.actionBtn}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={isSaved ? Colors.accent : Colors.cream} />
        </TouchableOpacity>
      </View>

      {/* Likes + Caption */}
      <View style={styles.postDetails}>
        {likeCount > 0 && (
          <Text style={styles.likesText}>{likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}</Text>
        )}
        {caption ? (
          <Text style={styles.captionText} numberOfLines={2}>
            <Text style={styles.captionUsername} onPress={navigateToProfile}>
              @{(posterProfile?.name || 'user').replace(/\s+/g, '').toLowerCase()}{' '}
            </Text>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HomeFeedScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!inner(name, nickname, avatar_url, is_public),
          post_likes(user_id),
          saved_posts(user_id)
        `)
        .eq('profiles.is_public', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const enrichedPosts = (data || []).map(post => ({
        ...post,
        likeCount: post.post_likes.length,
        isLikedByMe: post.post_likes.some((lk: any) => lk.user_id === user.id),
        isSavedByMe: post.saved_posts.some((sv: any) => sv.user_id === user.id),
      }));

      setPosts(enrichedPosts);
    } catch (e) {
      console.warn('Failed to fetch feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchFeed(); }, [user]));

  const toggleLike = async (postId: string, isLiking: boolean) => {
    if (!user) return;
    if (isLiking) {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
    }
  };

  const toggleSave = async (postId: string, isSaving: boolean) => {
    if (!user) return;
    if (isSaving) {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('saved_posts').delete().match({ post_id: postId, user_id: user.id });
    }
  };

  const ListHeader = () => (
    <View>
      {/* App header */}
      <View style={styles.appHeader}>
        <Text style={styles.appLogo}>MY outfit ✦</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('StoryCreate')} style={styles.headerBtn}>
          <Ionicons name="add-circle-outline" size={26} color={Colors.cream} />
        </TouchableOpacity>
      </View>

      {/* Stories Bar */}
      {user && <StoriesBar currentUserId={user.id} navigation={navigation} />}

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ListHeader />
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
        </>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); fetchFeed(); }}
          refreshing={refreshing}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✦</Text>
              <Text style={styles.emptyTitle}>Feed is quiet today</Text>
              <Text style={styles.emptyText}>Follow fashion people to fill your feed, or be the first to post!</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation?.navigate('Main', { screen: 'Search' })}
              >
                <Text style={styles.exploreBtnText}>Discover People ✦</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              item={item}
              currentUserId={user?.id}
              onLikeToggle={toggleLike}
              onSaveToggle={toggleSave}
              navigation={navigation}
            />
          )}
        />
      )}
    </View>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },

  // App Header
  appHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  appLogo: { ...Typography.h2, color: Colors.cream, letterSpacing: 0.5 },
  headerBtn: { padding: 4 },

  divider: { height: 1, backgroundColor: Colors.charcoal, marginTop: 4 },

  // Stories 
  storiesContainer: { paddingVertical: 12 },
  storiesScroll: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 68 },
  storyAvatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    padding: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  myStoryWrap: { backgroundColor: Colors.charcoal, borderWidth: 1.5, borderColor: Colors.silver + '30' },
  unseenRing: {
    borderWidth: 2.5,
    borderColor: Colors.accent,
    padding: 2,
  },
  seenRing: {
    borderWidth: 2,
    borderColor: Colors.silver + '40',
    padding: 2,
  },
  storyAvatarImg: { width: '100%', height: '100%', borderRadius: 100 },
  storyAvatarFallback: {
    width: '100%', height: '100%', borderRadius: 100,
    backgroundColor: Colors.accent + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  storyAvatarLetter: { color: Colors.accent, fontWeight: '700', fontSize: 18 },
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.obsidian,
  },
  addBadgeText: { color: Colors.obsidian, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  storyName: { ...Typography.caption, color: Colors.silver, marginTop: 4, textAlign: 'center', fontSize: 11 },

  // Post Card
  postCard: { marginBottom: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  postAvatarWrap: { marginRight: 10 },
  postAvatarImg: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.accent },
  postAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  postAvatarInitial: { ...Typography.label, color: Colors.accent },
  postUsername: { ...Typography.label, color: Colors.cream, fontSize: 14 },
  postTime: { ...Typography.caption, color: Colors.silver + '80', fontSize: 11, marginTop: 1 },
  moreBtn: { padding: 8 },
  postImage: { width: '100%', aspectRatio: 4 / 5 },

  // Actions
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  actionGroup: { flexDirection: 'row', gap: 16 },
  actionBtn: { padding: 4 },

  // Post details
  postDetails: { paddingHorizontal: 16, paddingBottom: 8 },
  likesText: { ...Typography.label, color: Colors.cream, marginBottom: 4, fontSize: 13 },
  captionText: { ...Typography.body, color: Colors.silver, lineHeight: 20, fontSize: 13 },
  captionUsername: { ...Typography.label, color: Colors.cream, fontSize: 13 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 48, color: Colors.accent, opacity: 0.5 },
  emptyTitle: { ...Typography.h3, color: Colors.cream },
  emptyText: { ...Typography.body, color: Colors.silver, textAlign: 'center', lineHeight: 22 },
  exploreBtn: {
    marginTop: 4, paddingHorizontal: 28, paddingVertical: 13,
    backgroundColor: Colors.accent, borderRadius: 26,
  },
  exploreBtnText: { color: Colors.obsidian, fontWeight: '700', fontSize: 14 },
} as const);

// src/screens/StoryViewerScreen.tsx — Instagram-style 24h story viewer
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated,
  ActivityIndicator, FlatList, Modal, ScrollView, StatusBar, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface Story {
  id: string;
  user_id: string;
  media_url: string | null;
  caption: string | null;
  expires_at: string;
  created_at: string;
  profiles?: { name: string; nickname: string | null; avatar_url: string | null };
  viewCount?: number;
  viewedByMe?: boolean;
}

export default function StoryViewerScreen({ route, navigation }: { route: any; navigation?: any }) {
  const { stories: initialStories, startIndex = 0 } = route.params || {};
  const { user } = useAuthStore();
  const [stories, setStories] = useState<Story[]>(initialStories || []);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [loading, setLoading] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory = stories[currentIndex];
  const isMyStory = currentStory?.user_id === user?.id;

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    progressRef.current?.stop();
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished && !paused) {
        goNext();
      }
    });
  }, [currentIndex, paused]);

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev: number) => prev + 1);
    } else {
      navigation?.goBack();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev: number) => prev - 1);
    }
  };

  const handleDeleteStory = () => {
    setPaused(true);
    Alert.alert('Delete Story', 'Remove this story?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setPaused(false) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('stories').delete().eq('id', currentStory.id);
            if (error) throw error;
            if (stories.length === 1) {
               navigation?.goBack();
            } else {
               setStories((prev: Story[]) => prev.filter(s => s.id !== currentStory.id));
               setCurrentIndex((prev: number) => Math.min(prev, stories.length - 2 > 0 ? stories.length - 2 : 0));
               setPaused(false);
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete story');
            setPaused(false);
          }
        }
      }
    ]);
  };

  useEffect(() => {
    if (!paused) startProgress();
    return () => progressRef.current?.stop();
  }, [currentIndex, paused]);

  // Mark story as viewed
  useEffect(() => {
    if (!user || !currentStory || currentStory.viewedByMe || currentStory.user_id === user.id) return;
    supabase.from('story_views').insert({ story_id: currentStory.id, viewer_id: user.id }).then(() => {
      setStories((prev: Story[]) => prev.map((s, i) => i === currentIndex ? { ...s, viewedByMe: true } : s));
    });
  }, [currentIndex]);

  const fetchViewers = async () => {
    if (!currentStory) return;
    const { data } = await supabase
      .from('story_views')
      .select('viewer_id, viewed_at, profiles:viewer_id(name, nickname, avatar_url)')
      .eq('story_id', currentStory.id)
      .order('viewed_at', { ascending: false });
    setViewers(data || []);
    setShowViewers(true);
  };

  const displayName = (p: any) => p?.nickname || p?.name || 'User';
  const avatarLetter = (p: any) => (p?.nickname || p?.name || 'U').charAt(0).toUpperCase();
  const storyProfile = currentStory?.profiles;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!currentStory) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.cream }}>No stories</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background: image or gradient */}
      {currentStory.media_url ? (
        <Image source={{ uri: currentStory.media_url }} style={styles.storyImage} resizeMode="cover" />
      ) : (
        <View style={[styles.storyImage, styles.gradientBg]}>
          <Text style={styles.noMediaEmoji}>✦</Text>
        </View>
      )}

      {/* Dim overlay */}
      <View style={styles.overlay} />

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: i < currentIndex ? '100%' : i === currentIndex ? progressWidth : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header: user info + close */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            navigation?.goBack();
            navigation?.navigate('UserProfile', { userId: currentStory.user_id });
          }}
        >
          {storyProfile?.avatar_url ? (
            <Image source={{ uri: storyProfile.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarLetter}>{avatarLetter(storyProfile)}</Text>
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName}>{displayName(storyProfile)}</Text>
            <Text style={styles.headerTime}>
              {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {currentStory.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </View>
      ) : null}

      {/* My story: show Eye icon for viewers + Delete btn */}
      {isMyStory && (
        <View style={styles.myStoryActions}>
          <TouchableOpacity style={styles.eyeBtn} onPress={fetchViewers}>
            <Text style={styles.eyeIcon}>👁</Text>
            <Text style={styles.eyeCount}>{currentStory.viewCount ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteStoryBtn} onPress={handleDeleteStory}>
            <Text style={styles.deleteStoryIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Touch zones for prev/next */}
      <View style={styles.touchZones}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={goPrev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={{ flex: 2 }}
          onPress={goNext}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          activeOpacity={1}
        />
      </View>

      {/* Viewers Modal */}
      <Modal visible={showViewers} transparent animationType="slide" onRequestClose={() => setShowViewers(false)}>
        <TouchableOpacity style={styles.viewersBackdrop} activeOpacity={1} onPress={() => setShowViewers(false)}>
          <View style={styles.viewersSheet}>
            <View style={styles.viewersHandle} />
            <Text style={styles.viewersTitle}>👁 Viewers · {viewers.length}</Text>
            <FlatList
              data={viewers}
              keyExtractor={(item) => item.viewer_id}
              renderItem={({ item }) => {
                const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                return (
                  <TouchableOpacity
                    style={styles.viewerRow}
                    onPress={() => {
                      setShowViewers(false);
                      navigation?.goBack();
                      navigation?.navigate('UserProfile', { userId: item.viewer_id });
                    }}
                  >
                    {p?.avatar_url ? (
                      <Image source={{ uri: p.avatar_url }} style={styles.viewerAvatar} />
                    ) : (
                      <View style={styles.viewerAvatarPlaceholder}>
                        <Text style={styles.viewerAvatarLetter}>{avatarLetter(p)}</Text>
                      </View>
                    )}
                    <Text style={styles.viewerName}>{displayName(p)}</Text>
                    <Text style={styles.viewerTime}>
                      {new Date(item.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.noViewers}>No views yet</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  storyImage: { position: 'absolute', width, height },
  gradientBg: { backgroundColor: Colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  noMediaEmoji: { fontSize: 80, opacity: 0.3 },
  overlay: { position: 'absolute', width, height, backgroundColor: 'rgba(0,0,0,0.15)' },

  progressContainer: {
    position: 'absolute', top: 50, left: 12, right: 12,
    flexDirection: 'row', gap: 4, zIndex: 20,
  },
  progressBar: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  header: {
    position: 'absolute', top: 62, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.accent },
  headerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.cream,
  },
  headerAvatarLetter: { color: Colors.obsidian, fontWeight: 'bold', fontSize: 16 },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '300' },

  captionContainer: {
    position: 'absolute', bottom: 100, left: 20, right: 20, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  captionText: { color: '#fff', fontSize: 15, lineHeight: 22, textAlign: 'center' },

  myStoryActions: {
    position: 'absolute', bottom: 36, left: 20, right: 20, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  eyeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  eyeIcon: { fontSize: 18 },
  eyeCount: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  deleteStoryBtn: {
    backgroundColor: 'rgba(255,0,0,0.3)', borderRadius: 20, padding: 8,
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.5)',
  },
  deleteStoryIcon: { fontSize: 16 },

  touchZones: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },

  viewersBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  viewersSheet: {
    backgroundColor: Colors.charcoal, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 40, maxHeight: height * 0.6,
  },
  viewersHandle: { width: 40, height: 4, backgroundColor: Colors.silver + '40', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  viewersTitle: { ...Typography.h3, color: Colors.cream, paddingHorizontal: 20, marginBottom: 12 },
  viewerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.silver + '15',
  },
  viewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  viewerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent + '40',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  viewerAvatarLetter: { color: Colors.accent, fontWeight: 'bold', fontSize: 16 },
  viewerName: { ...Typography.label, color: Colors.cream, flex: 1 },
  viewerTime: { ...Typography.caption, color: Colors.silver },
  noViewers: { ...Typography.body, color: Colors.silver, textAlign: 'center', marginTop: 20 },
} as const);

// src/screens/FollowerFeedScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function FollowerFeedScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    // Fetch posts, profiles, and all associated likes
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(name), likes(*)')
      .order('created_at', { ascending: false });
    
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleLike = async (postId: string, hasLiked: boolean, likeId?: string) => {
    if (!user) return;
    
    // Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        let newLikes = [...(p.likes || [])];
        if (hasLiked) {
          newLikes = newLikes.filter(l => l.user_id !== user.id);
        } else {
          newLikes.push({ id: 'temp', user_id: user.id, post_id: postId });
        }
        return { ...p, likes: newLikes };
      }
      return p;
    }));

    if (hasLiked && likeId) {
      await supabase.from('likes').delete().eq('id', likeId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headline}>Following</Text>
        <TouchableOpacity style={styles.chatButton} onPress={() => navigation?.navigate('GroupChat')}>
          <Text style={styles.chatIcon}>💬</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchPosts}
          ListEmptyComponent={() => (
            <Text style={{ ...Typography.body, color: Colors.silver, textAlign: 'center', marginTop: 40 }}>No posts yet. Be the first!</Text>
          )}
          renderItem={({ item }) => {
            const userName = item.profiles?.name || 'Unknown User';
            const initial = userName.substring(0, 2).toUpperCase();
            
            const date = new Date(item.created_at);
            const hours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
            const timeAgo = hours > 24 ? Math.floor(hours / 24) + 'd' : (hours > 0 ? hours + 'h' : 'Just now');

            const likesArray = item.likes || [];
            const userLike = likesArray.find((l: any) => l.user_id === user?.id);
            const hasLiked = !!userLike;

            return (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <TouchableOpacity
                    onPress={() => navigation?.navigate('SharedCart', { ownerId: item.user_id })}
                    accessibilityRole="button"
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{initial}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{userName.replace(/\s+/g, '').toLowerCase()}</Text>
                    <Text style={styles.postTime}>{timeAgo} {hours > 0 ? 'ago' : ''}</Text>
                  </View>
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Following</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.postImage}>
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
                
                <View style={styles.postFooter}>
                  <Text style={styles.outfitName}>{item.description || 'My Outfit'}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id, hasLiked, userLike?.id)}>
                      <Text style={[styles.actionIcon, hasLiked && { color: Colors.accent }]}>{hasLiked ? '♥' : '♡'}</Text>
                      <Text style={styles.actionCount}>{likesArray.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation?.navigate('PostComments', { postId: item.id })}
                    >
                      <Text style={styles.actionIcon}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>↗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headline: { ...Typography.h1, color: Colors.cream },
  chatButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  chatIcon: { fontSize: 20 },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 20 },
  postCard: { backgroundColor: Colors.charcoal, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.silver + '15' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { ...Typography.label, color: Colors.obsidian },
  userInfo: { flex: 1, gap: 2 },
  userName: { ...Typography.body, color: Colors.cream, fontWeight: '600' },
  postTime: { ...Typography.caption, color: Colors.silver },
  followButton: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.silver + '40',
  },
  followButtonText: { ...Typography.label, color: Colors.silver, fontSize: 11 },
  postImage: {
    height: 380, backgroundColor: Colors.obsidian, alignItems: 'center', justifyContent: 'center',
  },
  postFooter: { padding: 14, gap: 10 },
  outfitName: { ...Typography.body, color: Colors.cream, fontWeight: '600' },
  postActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 24, color: Colors.silver, marginTop: -4 },
  actionCount: { ...Typography.caption, color: Colors.silver },
});

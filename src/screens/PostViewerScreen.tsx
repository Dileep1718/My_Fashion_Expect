// src/screens/PostViewerScreen.tsx
// Full-screen image viewer that displays a single post when tapped from the Profile grid
import React from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, Alert
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function PostViewerScreen({ route, navigation }: { route?: any; navigation?: any }) {
  const post = route?.params?.post;
  const { user } = useAuthStore();
  const isMyPost = post?.user_id === user?.id;

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (error) throw error;
            navigation?.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete post');
          }
        }
      }
    ]);
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.silver, textAlign: 'center', marginTop: 200 }}>No post data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation?.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Full-size image */}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 64 }}>📸</Text>
        </View>
      )}

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.dateText}>
          {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }) : ''}
        </Text>
        <TouchableOpacity
          style={styles.commentBtn}
          onPress={() => navigation?.navigate('PostComments', { postId: post.id })}
        >
          <Text style={styles.commentBtnText}>💬 View Comments</Text>
        </TouchableOpacity>
        
        {isMyPost && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute', top: 48, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: Colors.cream, fontSize: 18, fontWeight: '600' },
  image: { width, height },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.6)', gap: 12,
  },
  dateText: { ...Typography.caption, color: Colors.silver },
  commentBtn: {
    alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: Colors.charcoal, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.silver + '30',
  },
  commentBtnText: { ...Typography.label, color: Colors.cream },
  deleteBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,0,0,0.15)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.4)',
    marginLeft: 'auto',
  },
});

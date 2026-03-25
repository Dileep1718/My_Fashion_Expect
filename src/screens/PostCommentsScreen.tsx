import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';
import { moderateComment } from '../services/commentModeration.service';

type Params = {
  PostComments: { postId: string };
};

export default function PostCommentsScreen({ navigation }: { navigation?: NativeStackNavigationProp<any> }) {
  const route = useRoute<RouteProp<Params, 'PostComments'>>();
  const { postId } = route.params || ({} as any);

  const { user } = useAuthStore();

  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Array<{ id: string; user_id: string; text: string; created_at: string; name?: string }>>(
    []
  );

  const commentCount = useMemo(() => comments.length, [comments]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: rawComments, error } = await supabase
        .from('comments')
        .select('id, user_id, text, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(80);

      if (error) throw error;
      const cc = (rawComments || []) as any[];

      // Resolve author names with a single profiles fetch.
      const userIds = Array.from(new Set(cc.map((c) => c.user_id).filter(Boolean)));
      let profileById: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        (profiles || []).forEach((p) => {
          profileById[p.id] = p.name;
        });
      }

      setComments(
        cc.map((c) => ({
          ...c,
          name: profileById[c.user_id] || 'User',
        }))
      );
    } catch (e: any) {
      console.warn('[PostCommentsScreen] loadComments error:', e);
      Alert.alert('Error', 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!postId) return;
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const onSubmit = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in to comment.');
      return;
    }
    if (!postId) return;

    const text = input.trim();
    if (!text) return;
    if (text.length > 500) {
      Alert.alert('Too long', 'Please keep comments under 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const moderation = await moderateComment(text);
      if (!moderation.allow) {
        Alert.alert('Comment rejected', moderation.reason);
        return;
      }

      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        text,
      });

      if (error) throw error;
      setInput('');
      await loadComments();
    } catch (e: any) {
      console.warn('[PostCommentsScreen] submit error:', e);
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{commentCount} comments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <Text style={{ ...Typography.body, color: Colors.silver, textAlign: 'center', marginTop: 40 }}>
              Be the first to leave a positive comment.
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.author}>@{(item.name || 'User').replace(/\s+/g, '').toLowerCase()}</Text>
              <Text style={styles.content}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Write a positive comment…"
          placeholderTextColor={Colors.silver + '60'}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, submitting && styles.sendBtnDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.obsidian} /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backBtn: { width: 90 },
  backText: { color: Colors.cream, fontSize: 14 },
  title: { ...Typography.h2, color: Colors.cream, fontSize: 20 },
  metaRow: { paddingHorizontal: 16, paddingBottom: 8 },
  metaText: { ...Typography.caption, color: Colors.silver },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  commentCard: {
    backgroundColor: Colors.charcoal,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.silver + '15',
    padding: 14,
    gap: 6,
  },
  author: { ...Typography.label, color: Colors.accent, textTransform: 'none' },
  content: { ...Typography.body, color: Colors.cream },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.obsidian,
    borderTopWidth: 1,
    borderTopColor: Colors.silver + '20',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: Colors.charcoal,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.silver + '20',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: Colors.cream,
  },
  sendBtn: {
    width: 86,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { ...Typography.label, color: Colors.obsidian, fontSize: 14, fontWeight: '800' },
});


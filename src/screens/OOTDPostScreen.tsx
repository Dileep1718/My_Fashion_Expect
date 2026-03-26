// src/screens/OOTDPostScreen.tsx — Outfit of The Day
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const MOODS = ['✦ Confident', '🔥 Fire', '🌿 Chill', '🖤 Edgy', '💫 Dreamy'];

export default function OOTDPostScreen({ navigation }: { navigation?: any }) {
  const [caption, setCaption] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuthStore();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0 && result.assets[0].base64) {
      setImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Missing photo', 'Please select an outfit photo first.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    // Enforce “one OOTD per day” (local device timezone).
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

    setIsPosting(true);
    try {
      // 0. Verify Auth Session first (crucial for RLS policies)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('Your login session has expired. Please sign out and sign back in to post.');
      }

      const { data: existingToday } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfToday.toISOString())
        .lt('created_at', startOfTomorrow.toISOString())
        .limit(1);

      if (existingToday && existingToday.length > 0) {
        Alert.alert('Already posted today', 'You can post your OOTD once per day. Come back tomorrow!');
        setIsPosting(false);
        return;
      }

      // 1. Upload Image to Supabase Storage
      // Use base64 → decode() — same pattern as VirtualClosetScreen / TryOnScreen.
      // fetch(localUri) fails on Android with "Network request failed".
      const ext = (image.uri.split('.').pop()?.toLowerCase() || 'jpg').replace('jpeg', 'jpg');
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('app_images')
        .upload(fileName, decode(image.base64), {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Storage Error]:', uploadError);
        throw new Error(`STORAGE_ERROR: ${uploadError.message}`);
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('app_images').getPublicUrl(fileName);

      // 3. Insert Post Entry
      const { error: dbError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        description: `${caption}\n${selectedMood ? selectedMood : ''}`.trim(),
        likes_count: 0
      });

      if (dbError) {
        console.error('[Posts Table Error]:', dbError);
        throw new Error(`DB_POSTS_ERROR: ${dbError.message}`);
      }

      // 4. Update daily streak counters on the user profile (if columns exist).
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ootd_streak, ootd_last_post_date')
          .eq('id', user.id)
          .single();

        const currentStreak = profile?.ootd_streak ?? 0;
        const lastPostDate = profile?.ootd_last_post_date ?? null;

        const nextStreak = lastPostDate === yesterdayStr ? currentStreak + 1 : 1;

        await supabase.from('profiles').upsert(
          {
            id: user.id,
            ootd_last_post_date: todayStr,
            ootd_streak: nextStreak,
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        // Non-fatal: app still posts. Schema may not yet have streak columns.
        console.warn('[OOTDPostScreen] streak update skipped:', e);
      }

      Alert.alert('Success', 'Your OOTD is now live!');
      navigation?.navigate('Main', { screen: 'Home' });
      
    } catch (e: any) {
      console.error('[OOTDPostScreen Error]:', e);
      Alert.alert(
        'Post Failed',
        e.message?.includes('JWT') ? 'Session expired. Please log out and back in.' : (e.message || 'Something went wrong. Please check your connection.')
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} disabled={isPosting}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Your OOTD</Text>
        <TouchableOpacity style={[styles.postButton, isPosting && { opacity: 0.5 }]} onPress={handlePost} disabled={isPosting}>
          {isPosting ? <ActivityIndicator size="small" color={Colors.obsidian} /> : <Text style={styles.postButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>

      {/* Photo area */}
      <TouchableOpacity style={[styles.photoArea, image ? { borderWidth: 0 } : {}]} onPress={pickImage} disabled={isPosting}>
        {image ? (
          <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%', borderRadius: 20 }} resizeMode="cover" />
        ) : (
          <>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.photoLabel}>Add your outfit photo</Text>
            <Text style={styles.photoSub}>Tap to choose from gallery</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Caption */}
      <TextInput
        style={styles.captionInput}
        value={caption}
        onChangeText={setCaption}
        placeholder="Caption your look… #OOTD"
        placeholderTextColor={Colors.silver + '60'}
        multiline
        maxLength={280}
        editable={!isPosting}
      />
      <Text style={styles.charCount}>{caption.length}/280</Text>

      {/* Mood */}
      <Text style={styles.sectionLabel}>MOOD</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.moodChip, selectedMood === m && styles.moodChipActive]}
            onPress={() => setSelectedMood(m)}
            disabled={isPosting}
          >
            <Text style={[styles.moodText, selectedMood === m && styles.moodTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      {['Tag Items from Closet', 'Add Location', 'Share to Follower Feed'].map((opt, i) => (
        <TouchableOpacity key={opt} style={styles.optionRow} disabled={isPosting}>
          <Text style={styles.optionText}>{opt}</Text>
          <Text style={styles.optionChevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText: { fontSize: 18, color: Colors.silver },
  title: { ...Typography.h3, color: Colors.cream },
  postButton: {
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.accent, borderRadius: 10,
  },
  postButtonText: { ...Typography.label, color: Colors.obsidian },
  photoArea: {
    height: 260, backgroundColor: Colors.charcoal, borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Colors.silver + '40',
  },
  photoIcon: { fontSize: 36 },
  photoLabel: { ...Typography.body, color: Colors.cream },
  photoSub: { ...Typography.caption, color: Colors.silver },
  captionInput: {
    backgroundColor: Colors.charcoal, borderRadius: 14, padding: 14,
    color: Colors.cream, fontSize: 15, minHeight: 80, borderWidth: 1,
    borderColor: Colors.silver + '20', textAlignVertical: 'top',
  },
  charCount: { ...Typography.caption, color: Colors.silver, textAlign: 'right' },
  sectionLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase' },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.silver + '30',
  },
  moodChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  moodText: { ...Typography.label, color: Colors.silver, fontSize: 12 },
  moodTextActive: { color: Colors.obsidian },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.silver + '15',
  },
  optionText: { ...Typography.body, color: Colors.cream },
  optionChevron: { fontSize: 20, color: Colors.silver },
});

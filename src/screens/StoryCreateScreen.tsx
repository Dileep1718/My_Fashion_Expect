// src/screens/StoryCreateScreen.tsx — Create and post a 24h story
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const { width, height } = Dimensions.get('window');

export default function StoryCreateScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [9, 16],
      base64: true,
    });
    if (!result.canceled && result.assets[0] && result.assets[0].base64) {
      setImageUri({ uri: result.assets[0].uri, base64: result.assets[0].base64 } as any);
    }
  };

  const postStory = async () => {
    if (!user) return;
    setUploading(true);
    try {
      let media_url: string | null = null;

        // Upload to Supabase storage
        const ext = (imageUri as any).uri.split('.').pop() || 'jpg';
        const fileName = `story_${user.id}_${Date.now()}.${ext}`;
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('app_images')
          .upload(fileName, decode((imageUri as any).base64), { 
             contentType,
             upsert: false 
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('app_images').getPublicUrl(uploadData.path);
        media_url = urlData.publicUrl;

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url,
        caption: caption.trim() || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      Alert.alert('Story posted! ✦', 'Your story will be visible for 24 hours.');
      navigation?.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <TouchableOpacity
          onPress={postStory}
          disabled={uploading}
          style={[styles.shareBtn, uploading && { opacity: 0.5 }]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.obsidian} />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview area */}
      <TouchableOpacity style={styles.previewArea} onPress={pickImage} activeOpacity={0.85}>
        {imageUri ? (
          <Image source={{ uri: (imageUri as any).uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Tap to select photo</Text>
            <Text style={styles.placeholderSub}>9:16 ratio recommended</Text>
          </View>
        )}

        {/* Caption input floating on image */}
        {imageUri && (
          <View style={styles.captionOverlay}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.captionInput}
              multiline
              maxLength={200}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Caption input below image (if no image selected) */}
      {!imageUri && (
        <View style={styles.captionBox}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What's your story? Add a caption..."
            placeholderTextColor={Colors.silver + '60'}
            style={styles.captionField}
            multiline
            maxLength={200}
          />
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsRow}>
        <Text style={styles.tipText}>⏱ Stories disappear after 24 hours</Text>
        <Text style={styles.tipText}>👁 See who viewed your story</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.charcoal,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: Colors.cream, fontSize: 18 },
  headerTitle: { ...Typography.h3, color: Colors.cream },
  shareBtn: {
    backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 20,
  },
  shareBtnText: { color: Colors.obsidian, fontWeight: '700', fontSize: 14 },

  previewArea: {
    width: width - 40, alignSelf: 'center', marginTop: 20,
    height: (width - 40) * (16 / 9), borderRadius: 20,
    overflow: 'hidden', backgroundColor: Colors.charcoal,
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { ...Typography.h3, color: Colors.silver },
  placeholderSub: { ...Typography.caption, color: Colors.silver + '60' },

  captionOverlay: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    padding: 12,
  },
  captionInput: { color: '#fff', fontSize: 16, lineHeight: 22, textAlign: 'center' },

  captionBox: {
    margin: 20, marginTop: 16, backgroundColor: Colors.charcoal,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.silver + '20',
    padding: 16, minHeight: 80,
  },
  captionField: { color: Colors.cream, fontSize: 15, lineHeight: 22 },

  tipsRow: { paddingHorizontal: 20, gap: 4, marginTop: 12 },
  tipText: { ...Typography.caption, color: Colors.silver + '60' },
} as const);

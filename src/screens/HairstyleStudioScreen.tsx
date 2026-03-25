// src/screens/HairstyleStudioScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FaceShape, getHairstylesForShape, HairstyleAsset } from '../services/hairstyle.service';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default function HairstyleStudioScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(null);
  const [recommendations, setRecommendations] = useState<HairstyleAsset[]>([]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeFace(result.assets[0].base64);
    }
  };

  const analyzeFace = async (base64String: string) => {
    setLoading(true);
    setFaceShape(null);
    setRecommendations([]);

    if (!GEMINI_API_KEY) {
      // Mock flow if no API key is provided
      setTimeout(() => {
        const mockShape = 'Oval';
        setFaceShape(mockShape);
        setRecommendations(getHairstylesForShape(mockShape));
        setLoading(false);
        Alert.alert('Demo Mode', 'No Gemini API key found in .env. Falling back to mock "Oval" face shape.');
      }, 1500);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = "Analyze this selfie and return ONLY one of these exact words representing their face shape: 'Oval', 'Round', 'Square', 'Heart', or 'Oblong'. Do not return any other text or markdown.";
      
      const imageParts = [{
        inlineData: { data: base64String, mimeType: 'image/jpeg' },
      }];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text().trim().replace(/['"`]/g, '');

      // Sanitize standard response to map to exactly FaceShape type
      const match = ['Oval', 'Round', 'Square', 'Heart', 'Oblong'].find(
        (shape) => text.toLowerCase().includes(shape.toLowerCase())
      ) as FaceShape | undefined;

      const detectedShape: FaceShape = match || 'Oval';

      setFaceShape(detectedShape);
      setRecommendations(getHairstylesForShape(detectedShape));
    } catch (err) {
      console.error(err);
      Alert.alert('Analysis Failed', 'Could not analyze face shape. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStyle = (item: HairstyleAsset) => {
    Alert.alert('Applying Style...', `Generating an AR overlay of the ${item.name} for you... \n\n(AR generative swap mock successful!)`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>AI Hairstyle Studio</Text>
      <Text style={styles.subheadline}>Upload a selfie to detect your face shape and get tailored hairstyle recommendations.</Text>

      <TouchableOpacity style={styles.uploadArea} onPress={pickImage} disabled={loading}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
        ) : (
          <>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadText}>Upload Selfie</Text>
          </>
        )}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Analyzing face shape...</Text>
          </View>
        )}
      </TouchableOpacity>

      {faceShape && !loading && (
        <View style={styles.resultSection}>
          <View style={styles.shapeChip}>
            <Text style={styles.shapeText}>Detected Shape: {faceShape}</Text>
          </View>

          <Text style={styles.sectionLabel}>RECOMMENDED STYLES</Text>
          
          <View style={styles.grid}>
            {recommendations.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemTags} numberOfLines={2}>{item.description}</Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => handleApplyStyle(item)}>
                  <Text style={styles.applyButtonText}>Try On</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 100, gap: 20 },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  
  uploadArea: {
    height: 300, backgroundColor: Colors.charcoal, borderRadius: 24,
    borderWidth: 1.5, borderColor: Colors.silver + '30', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadText: { ...Typography.label, color: Colors.cream },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,11,0.7)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { ...Typography.caption, color: Colors.accent },
  
  resultSection: { marginTop: 10, gap: 16 },
  shapeChip: {
    alignSelf: 'flex-start', backgroundColor: Colors.accent,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100,
  },
  shapeText: { ...Typography.h3, color: Colors.obsidian, fontSize: 14 },
  
  sectionLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase', marginTop: 10 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: {
    width: '48%', backgroundColor: Colors.charcoal, borderRadius: 16,
    padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.silver + '15',
  },
  itemEmoji: { fontSize: 32, alignSelf: 'center', marginBottom: 4 },
  itemName: { ...Typography.body, color: Colors.cream, fontWeight: '600', textAlign: 'center' },
  itemTags: { ...Typography.caption, color: Colors.silver, textAlign: 'center', fontSize: 10 },
  applyButton: {
    backgroundColor: Colors.white10, paddingVertical: 8, borderRadius: 8,
    alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: Colors.silver + '40',
  },
  applyButtonText: { ...Typography.label, color: Colors.cream, fontSize: 11 },
});

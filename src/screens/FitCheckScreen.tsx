// src/screens/FitCheckScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getLinkPreview } from 'link-preview-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function FitCheckScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    try {
      // Fetch metadata using link-preview-js
      const data: any = await getLinkPreview(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      
      setPreview({
        title: data.title || 'Unknown Product',
        image: data.images && data.images.length > 0 ? data.images[0] : null,
        description: data.description || 'No description available',
        url: url,
        // link-preview-js doesn't extract price reliably, so we check title/desc
        price: extractPrice(data.title + ' ' + data.description)
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch link preview. The site might be blocking scrapers.');
    } finally {
      setLoading(false);
    }
  };

  const extractPrice = (text: string) => {
    // Simple regex to find $ or ₹ followed by numbers
    const match = text.match(/(?:₹|\$)\s?\d+(?:,\d+)*(?:\.\d{2})?/);
    return match ? match[0] : 'Price unavailable';
  };

  const handleSaveToWishlist = async () => {
    if (!preview) return;
    const user = useAuthStore.getState().user;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save');
      return;
    }
    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        url: preview.url,
        title: preview.title,
        image_url: preview.image,
        price: preview.price,
      });

      if (error) throw error;
      
      Alert.alert('Success', 'Item saved to your Wishlist!');
      setPreview(null);
      setUrl('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save to wishlist');
    }
  };

  const handleBuyNow = async () => {
    if (preview?.url) {
      await WebBrowser.openBrowserAsync(preview.url);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>Wishlist Scraper</Text>
      <Text style={styles.subheadline}>Paste a Myntra, Flipkart, or any product URL to extract details.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="https://www.myntra.com/..."
          placeholderTextColor={Colors.silver + '60'}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity style={styles.scrapeButton} onPress={handleScrape} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={Colors.obsidian} /> : <Text style={styles.scrapeButtonText}>Scrape</Text>}
        </TouchableOpacity>
      </View>

      {preview && (
        <View style={styles.previewCard}>
          {preview.image ? (
            <Image source={{ uri: preview.image }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 40 }}>🛍️</Text>
            </View>
          )}
          
          <View style={styles.previewDetails}>
            <Text style={styles.previewTitle} numberOfLines={2}>{preview.title}</Text>
            <Text style={styles.previewPrice}>{preview.price}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.wishlistButton} onPress={handleSaveToWishlist}>
                <Text style={styles.wishlistButtonText}>♡ Save to Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
                <Text style={styles.buyButtonText}>Buy Now ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 100, gap: 20 },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  inputContainer: {
    flexDirection: 'row', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.charcoal, borderRadius: 12, paddingHorizontal: 16,
    height: 50, color: Colors.cream, borderWidth: 1, borderColor: Colors.silver + '20',
  },
  scrapeButton: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center', height: 50,
  },
  scrapeButtonText: { ...Typography.label, color: Colors.obsidian },
  previewCard: {
    backgroundColor: Colors.charcoal, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.silver + '20', marginTop: 10,
  },
  previewImage: {
    width: '100%', height: 280, backgroundColor: Colors.obsidian,
  },
  previewDetails: {
    padding: 20, gap: 12,
  },
  previewTitle: { ...Typography.h3, color: Colors.cream },
  previewPrice: { ...Typography.h2, color: Colors.accent },
  actionRow: {
    flexDirection: 'row', gap: 12, marginTop: 10,
  },
  wishlistButton: {
    flex: 1, backgroundColor: Colors.obsidian, borderRadius: 12, height: 44,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.silver + '30',
  },
  wishlistButtonText: { ...Typography.label, color: Colors.cream },
  buyButton: {
    flex: 1, backgroundColor: Colors.accent, borderRadius: 12, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  buyButtonText: { ...Typography.label, color: Colors.obsidian },
});

// src/screens/OutfitSuggestionScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { suggestOutfit } from '../services/outfit.service';

const EVENTS = ['Casual', 'Party', 'Date', 'Temple', 'Movie', 'Gym'];
const { width } = Dimensions.get('window');

export default function OutfitSuggestionScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState('Party');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    fetchWardrobe();
  }, []);

  const fetchWardrobe = async () => {
    const { data } = await supabase.from('wardrobe_items').select('*');
    if (data) setWardrobe(data);
  };

  const handleSuggest = async () => {
    if (wardrobe.length < 2) {
      alert('Please add more items to your Virtual Closet first!');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const suggestion = await suggestOutfit(wardrobe, activeEvent);
      // Map IDs back to objects
      setResult({
        top: wardrobe.find(i => i.id === suggestion.top) || null,
        bottom: wardrobe.find(i => i.id === suggestion.bottom) || null,
        footwear: wardrobe.find(i => i.id === suggestion.footwear) || null,
        reasoning: suggestion.reasoning
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate outfit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ padding: 10, alignSelf: 'flex-start' }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>AI Stylist</Text>
        <Text style={styles.subheadline}>Select an event to get the perfect combination.</Text>
      </View>

      <View style={styles.eventScroller}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
          {EVENTS.map(ev => (
            <TouchableOpacity 
              key={ev} 
              style={[styles.eventPill, activeEvent === ev && styles.eventPillActive]}
              onPress={() => setActiveEvent(ev)}
            >
              <Text style={[styles.eventText, activeEvent === ev && styles.eventTextActive]}>{ev}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={handleSuggest} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.obsidian} /> : <Text style={styles.generateBtnText}>Generate Combo 🪄</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.reasoningTitle}>Why this works:</Text>
          <Text style={styles.reasoningBody}>"{result.reasoning}"</Text>
          
          <View style={styles.outfitGrid}>
            {result.top && (
              <View style={styles.itemSlot}>
                <Image source={{ uri: result.top.image_url }} style={styles.itemImage} />
                <Text style={styles.itemLabel}>TOP</Text>
              </View>
            )}
            {result.bottom && (
              <View style={styles.itemSlot}>
                <Image source={{ uri: result.bottom.image_url }} style={styles.itemImage} />
                <Text style={styles.itemLabel}>BOTTOM</Text>
              </View>
            )}
            {result.footwear && (
              <View style={styles.itemSlot}>
                <Image source={{ uri: result.footwear.image_url }} style={styles.itemImage} />
                <Text style={styles.itemLabel}>FOOTWEAR</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.wearBtn} onPress={() => navigation?.navigate('TryOn')}>
            <Text style={styles.wearBtnText}>Try it on virtually ↗</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { paddingHorizontal: 14, paddingTop: 50, paddingBottom: 16 },
  backText: { fontSize: 36, color: Colors.cream, marginTop: -8 },
  headline: { ...Typography.h1, color: Colors.cream, paddingHorizontal: 10 },
  subheadline: { ...Typography.body, color: Colors.silver, paddingHorizontal: 10, marginTop: 4 },
  
  eventScroller: { marginVertical: 24 },
  eventPill: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.silver + '20',
  },
  eventPillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  eventText: { ...Typography.label, color: Colors.silver },
  eventTextActive: { color: Colors.obsidian, fontWeight: '700' },
  
  generateBtn: {
    marginHorizontal: 24, height: 56, borderRadius: 28,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
    marginBottom: 30,
  },
  generateBtnText: { ...Typography.h3, color: Colors.obsidian },
  
  resultContainer: {
    marginHorizontal: 24, padding: 24, borderRadius: 20,
    backgroundColor: Colors.charcoal, borderWidth: 1, borderColor: Colors.silver + '20',
  },
  reasoningTitle: { ...Typography.label, color: Colors.accent, marginBottom: 8 },
  reasoningBody: { ...Typography.body, color: Colors.cream, fontStyle: 'italic', marginBottom: 24, lineHeight: 22 },
  
  outfitGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 24 },
  itemSlot: { flex: 1, aspectRatio: 0.8, backgroundColor: Colors.obsidian, borderRadius: 12, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, textAlign: 'center', ...Typography.caption, color: Colors.cream, fontSize: 9 },
  
  wearBtn: {
    height: 48, borderRadius: 24, borderWidth: 1, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  wearBtnText: { ...Typography.label, color: Colors.accent },
});

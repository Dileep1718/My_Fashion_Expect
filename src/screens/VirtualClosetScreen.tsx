import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES = ['TOP', 'BOTTOM', 'FOOTWEAR', 'ACCESSORY'];
const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 16) / 3;

export default function VirtualClosetScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('TOP');
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ uri: string, base64: string } | null>(null);

  useEffect(() => {
    fetchWardrobe();
  }, [activeTab]);

  const fetchWardrobe = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    if (!user) return;
    const { data } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', activeTab)
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
    setLoading(false);
  };

  const handlePickItem = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPendingImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64
      });
    }
  };

  const executeUpload = async (category: string) => {
    if (!pendingImage || !user) return;
    setUploading(true);
    try {
      const ext = pendingImage.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `wardrobe/${user.id}/${Date.now()}.${ext}`;
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      
      const { error: uploadError } = await supabase.storage
        .from('app_images')
        .upload(filePath, decode(pendingImage.base64), { contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('app_images').getPublicUrl(filePath);

      await supabase.from('wardrobe_items').insert({
        user_id: user.id,
        image_url: publicUrl,
        category: category,
      });

      setPendingImage(null);
      if (activeTab === category) {
        fetchWardrobe(); // refresh list
      } else {
        setActiveTab(category); // switch tab which auto-refreshes
      }
    } catch (e: any) {
      console.error('[Upload Error]:', e);
      Alert.alert('Upload Failed', e.message || 'Failed to add item to your wardrobe. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headline}>Your Closet</Text>
            <Text style={styles.subheadline}>Digitize your wardrobe for AI styling.</Text>
          </View>
          <TouchableOpacity style={styles.aiButton} onPress={() => navigation?.navigate('OutfitSuggestion')}>
            <Text style={styles.aiButtonText}>AI Stylist 🪄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.tabButton, activeTab === cat && styles.tabButtonActive]}
            onPress={() => setActiveTab(cat)}
          >
            <Text style={[styles.tabText, activeTab === cat && styles.tabTextActive]}>
              {cat}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
               <Text style={styles.emptyIcon}>🧥</Text>
               <Text style={styles.emptyText}>No {activeTab.toLowerCase()}s found.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            </View>
          )}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handlePickItem}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Category Selection Modal */}
      <Modal visible={!!pendingImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {pendingImage && (
              <Image source={{ uri: pendingImage.uri }} style={styles.previewImage} />
            )}
            <Text style={styles.modalTitle}>What type of item is this?</Text>
            {uploading ? (
               <View style={styles.uploadingContainer}>
                 <ActivityIndicator size="large" color={Colors.accent} />
                 <Text style={styles.uploadText}>Adding to Wardrobe...</Text>
               </View>
            ) : (
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={styles.catSelectBtn}
                    onPress={() => executeUpload(cat)}
                  >
                    <Text style={styles.catSelectText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!uploading && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingImage(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver, marginTop: 4 },
  aiButton: {
    backgroundColor: Colors.accent + '20', borderWidth: 1, borderColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 4
  },
  aiButtonText: { ...Typography.label, color: Colors.accent },
  
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: Colors.charcoal,
  },
  tabButtonActive: { backgroundColor: Colors.accent },
  tabText: { ...Typography.label, color: Colors.silver },
  tabTextActive: { color: Colors.obsidian },
  
  list: { paddingHorizontal: 24, paddingBottom: 120 },
  row: { justifyContent: 'flex-start', gap: 8, marginBottom: 8 },
  itemCard: {
    width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: Colors.charcoal,
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.silver + '20',
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.body, color: Colors.silver },
  
  fab: {
    position: 'absolute', bottom: 30, right: 30, width: 64, height: 64,
    borderRadius: 32, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  fabIcon: { fontSize: 32, fontWeight: '300', color: Colors.obsidian, marginTop: -4 },
  
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', backgroundColor: Colors.charcoal, borderRadius: 24,
    padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.silver + '20',
  },
  previewImage: {
    width: 140, height: 140, borderRadius: 16, marginBottom: 20,
  },
  modalTitle: { ...Typography.h3, color: Colors.cream, marginBottom: 20 },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
  },
  catSelectBtn: {
    width: '45%', paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.accent + '20', borderWidth: 1, borderColor: Colors.accent + '60',
    alignItems: 'center',
  },
  catSelectText: { ...Typography.label, color: Colors.accent },
  cancelBtn: { marginTop: 24, paddingVertical: 12 },
  cancelBtnText: { ...Typography.label, color: Colors.silver },
  
  uploadingContainer: { alignItems: 'center', gap: 16, marginVertical: 20 },
  uploadText: { ...Typography.label, color: Colors.accent },
});

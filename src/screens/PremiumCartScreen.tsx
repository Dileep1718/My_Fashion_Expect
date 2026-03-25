// src/screens/PremiumCartScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Linking, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function PremiumCartScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Modal states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!user || !title || !url) return alert('Title and URL are required.');
    setSaving(true);
    try {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        title,
        external_url: url,
        price: parseFloat(price) || 0,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop', // Fallback fashion img
      });
      setShowModal(false);
      setTitle(''); setUrl(''); setPrice(''); setImageUrl('');
      fetchCart();
    } catch (e) {
      console.warn(e);
      alert('Failed to save link.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    fetchCart();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ padding: 10, marginLeft: -10 }}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>Your Cart</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Link</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subheadline}>Save your favorite external store links here.</Text>

      {/* Cart Grid */}
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image_url }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.price > 0 && <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>}
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.buyBtn} onPress={() => Linking.openURL(item.external_url)}>
                    <Text style={styles.buyBtnText}>Shop Now ↗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save External Item</Text>
            
            <TextInput style={styles.input} placeholder="Product Name (e.g. Nike Dunks)" placeholderTextColor={Colors.silver} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Store URL (Myntra, ASOS...)" placeholderTextColor={Colors.silver} value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
            <TextInput style={styles.input} placeholder="Image URL (optional)" placeholderTextColor={Colors.silver} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" keyboardType="url" />
            <TextInput style={styles.input} placeholder="Price (optional)" placeholderTextColor={Colors.silver} value={price} onChangeText={setPrice} keyboardType="numeric" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddItem} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save to Cart'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60 },
  backButton: { fontSize: 36, color: Colors.cream, marginTop: -6 },
  headline: { ...Typography.h1, color: Colors.cream },
  addBtn: { backgroundColor: Colors.charcoal, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.accent },
  addBtnText: { ...Typography.label, color: Colors.accent },
  subheadline: { ...Typography.body, color: Colors.silver, paddingHorizontal: 24, marginBottom: 20 },
  
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 16 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.body, color: Colors.silver },
  
  card: { flexDirection: 'row', backgroundColor: Colors.charcoal, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.silver + '20' },
  cardImage: { width: 100, height: 100, backgroundColor: Colors.obsidian },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { ...Typography.label, color: Colors.cream },
  cardPrice: { ...Typography.h3, color: Colors.accent, marginVertical: 4 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  buyBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  buyBtnText: { ...Typography.caption, color: Colors.obsidian, fontWeight: '700' },
  deleteText: { fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.charcoal, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { ...Typography.h2, color: Colors.cream, marginBottom: 20 },
  input: { height: 50, backgroundColor: Colors.obsidian, borderRadius: 12, paddingHorizontal: 16, color: Colors.cream, marginBottom: 12, borderWidth: 1, borderColor: Colors.silver + '30' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 40 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: Colors.obsidian, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...Typography.label, color: Colors.silver },
  saveBtn: { flex: 2, height: 50, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...Typography.label, color: Colors.obsidian, fontWeight: '700' },
});

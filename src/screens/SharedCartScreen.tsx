import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function SharedCartScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const { user } = useAuthStore();
  const ownerId = route?.params?.ownerId as string | undefined;

  const [cartIsPublic, setCartIsPublic] = useState<boolean>(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('cart_is_public')
        .eq('id', ownerId)
        .single();
      if (profileError || !profile) {
        // If RLS blocks access to cart visibility, treat it as private.
        setCartIsPublic(false);
        setItems([]);
        return;
      }

      setCartIsPublic(!!profile.cart_is_public);

      const allowed = user?.id === ownerId || !!profile?.cart_is_public;
      if (!allowed) {
        setItems([]);
        return;
      }

      const { data } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', ownerId)
        .order('created_at', { ascending: false });

      setItems((data || []) as any[]);
    } catch (e: any) {
      console.warn('[SharedCartScreen] load error:', e);
      Alert.alert('Error', 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const isOwnCart = user?.id === ownerId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ padding: 10 }}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>{isOwnCart ? 'Your Cart' : 'Shared Cart'}</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : !isOwnCart && !cartIsPublic ? (
        <View style={{ padding: 24 }}>
          <Text style={{ ...Typography.h3, color: Colors.cream }}>This cart is private.</Text>
          <Text style={{ ...Typography.body, color: Colors.silver, marginTop: 10 }}>
            The owner has not allowed others to view it.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyText}>No items yet.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta}>${Number(item.price || 0).toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => Linking.openURL(item.external_url)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.buyBtnText}>Shop Now ↗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver + '15',
  },
  backText: { color: Colors.cream, fontSize: 14 },
  headline: { ...Typography.h1, color: Colors.cream, fontSize: 22, paddingHorizontal: 0 },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 14, paddingTop: 18 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.charcoal,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.silver + '15',
  },
  cardImage: { width: 110, height: 110, backgroundColor: Colors.obsidian },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'space-between', gap: 10 },
  cardTitle: { ...Typography.label, color: Colors.cream, fontSize: 14 },
  cardMeta: { ...Typography.caption, color: Colors.silver },
  buyBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  buyBtnText: { ...Typography.caption, color: Colors.obsidian, fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.body, color: Colors.silver },
});


import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export default function SettingsScreen({ navigation }: { navigation?: any }) {
  const { user, signOut } = useAuthStore();
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('is_public').eq('id', user.id).single()
        .then(({ data }) => {
           if (data) setIsPublic(data.is_public);
        });
    }
  }, [user]);

  const togglePublic = async (val: boolean) => {
    setIsPublic(val);
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({ is_public: val }).eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to update privacy settings', e);
      setIsPublic(!val); // Revert
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut();
          navigation?.replace('Auth');
      }}
    ]);
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );

  const renderRow = (icon: string, label: string, trailing: React.ReactNode, hideDivider = false, danger = false) => (
    <View>
      <View style={styles.settingRow}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
        {trailing}
      </View>
      {!hideDivider && <View style={styles.divider} />}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>Settings</Text>
      </View>

      {renderSection('Account', <>
        {renderRow('👤', 'Edit Profile', <Text style={styles.chevron}>›</Text>)}
        {renderRow('🔑', 'Change Password', <Text style={styles.chevron}>›</Text>)}
        {renderRow('🔗', 'Linked Accounts', <Text style={styles.chevron}>›</Text>, true)}
      </>)}

      {renderSection('Privacy', <>
        {renderRow('👁', 'Public Profile Visibility', 
          <Switch value={isPublic} onValueChange={togglePublic} trackColor={{ false: Colors.charcoal, true: Colors.accent }} thumbColor={Colors.cream} />
        )}
        {renderRow('📊', 'Data & Analytics', <Text style={styles.chevron}>›</Text>)}
        {renderRow('🗑', 'Delete Account', <Text style={styles.chevron}>›</Text>, true, true)}
      </>)}

      {renderSection('About', <>
        {renderRow('ℹ️', 'App Version', <Text style={styles.valueText}>1.0.0-rc1</Text>)}
        {renderRow('📄', 'Terms of Service', <Text style={styles.chevron}>›</Text>)}
        {renderRow('🛡', 'Privacy Policy', <Text style={styles.chevron}>›</Text>, true)}
      </>)}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48, gap: 24 },
  header: { gap: 12 },
  backText: { ...Typography.body, color: Colors.silver },
  headline: { ...Typography.h1, color: Colors.cream },
  section: { gap: 8 },
  sectionTitle: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase', paddingLeft: 4 },
  sectionCard: {
    backgroundColor: Colors.charcoal, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.silver + '15',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
  },
  settingIcon: { fontSize: 18, width: 24 },
  settingLabel: { ...Typography.body, color: Colors.cream, flex: 1 },
  dangerText: { color: Colors.blush },
  valueText: { ...Typography.caption, color: Colors.silver },
  chevron: { fontSize: 20, color: Colors.silver },
  divider: { height: 1, backgroundColor: Colors.silver + '15', marginHorizontal: 16 },
  signOutButton: {
    height: 56, borderRadius: 16, borderWidth: 1, borderColor: Colors.blush + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { ...Typography.label, color: Colors.blush, fontSize: 15 },
});

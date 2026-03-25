// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: '👤', type: 'nav' },
      { label: 'Change Password', icon: '🔑', type: 'nav' },
      { label: 'Linked Accounts', icon: '🔗', type: 'nav' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Dark Mode', icon: '🌙', type: 'toggle', value: true },
      { label: 'Outfit Reminders', icon: '🔔', type: 'toggle', value: false },
      { label: 'AI Suggestions', icon: '🪄', type: 'toggle', value: true },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { label: 'Profile Visibility', icon: '👁', type: 'nav' },
      { label: 'Data & Analytics', icon: '📊', type: 'nav' },
      { label: 'Delete Account', icon: '🗑', type: 'nav', danger: true },
    ],
  },
  {
    title: 'About',
    items: [
      { label: 'App Version', icon: 'ℹ️', type: 'value', value: '1.0.0-alpha' },
      { label: 'Terms of Service', icon: '📄', type: 'nav' },
      { label: 'Privacy Policy', icon: '🛡', type: 'nav' },
    ],
  },
];

export default function SettingsScreen({ navigation }: { navigation?: any }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>Settings</Text>
      </View>

      {SETTINGS_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                  <Text style={[styles.settingLabel, (item as any).danger && styles.dangerText]}>
                    {item.label}
                  </Text>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={(item as any).value}
                      trackColor={{ false: Colors.charcoal, true: Colors.accent }}
                      thumbColor={Colors.cream}
                    />
                  ) : item.type === 'value' ? (
                    <Text style={styles.valueText}>{(item as any).value}</Text>
                  ) : (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </View>
                {i < section.items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.signOutButton}>
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

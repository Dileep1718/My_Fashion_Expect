// src/screens/HistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const HISTORY = [
  {
    title: 'Today',
    data: [
      { id: '1', emoji: '◻️', outfit: 'Minimal White Set', action: 'Worn', time: '8:30 AM' },
      { id: '2', emoji: '🪄', outfit: 'AI Try-On Demo', action: 'Tried On', time: '10:15 AM' },
    ],
  },
  {
    title: 'Yesterday',
    data: [
      { id: '3', emoji: '🌿', outfit: 'Boho Summer Look', action: 'Saved', time: '3:00 PM' },
      { id: '4', emoji: '🧢', outfit: 'Street Core Drop', action: 'Fit Checked', time: '6:45 PM' },
    ],
  },
  {
    title: 'Last Week',
    data: [
      { id: '5', emoji: '✦', outfit: 'Editorial Pick', action: 'Worn', time: 'Mon' },
      { id: '6', emoji: '🖤', outfit: 'All-Black Night', action: 'Posted OOTD', time: 'Sun' },
    ],
  },
];

export default function HistoryScreen({ navigation }: { navigation?: any }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headline}>History</Text>
      </View>
      <SectionList
        sections={HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <View>
                <Text style={styles.itemOutfit}>{item.outfit}</Text>
                <Text style={styles.itemAction}>{item.action}</Text>
              </View>
            </View>
            <Text style={styles.itemTime}>{item.time}</Text>
          </View>
        )}
        renderSectionFooter={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, gap: 8 },
  backText: { ...Typography.body, color: Colors.silver },
  headline: { ...Typography.h1, color: Colors.cream },
  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 8 },
  sectionHeader: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase', paddingVertical: 10 },
  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.charcoal, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.silver + '15',
  },
  itemLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  itemEmoji: { fontSize: 24, width: 36 },
  itemOutfit: { ...Typography.body, color: Colors.cream, fontWeight: '600' },
  itemAction: { ...Typography.caption, color: Colors.silver },
  itemTime: { ...Typography.caption, color: Colors.silver },
});

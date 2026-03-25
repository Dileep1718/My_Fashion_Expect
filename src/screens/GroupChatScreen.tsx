// src/screens/GroupChatScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function GroupChatScreen({ navigation }: { navigation?: any }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Style Squad</Text>
        <Text style={styles.membersCount}>4 Online</Text>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        <View style={styles.messageBubble}>
          <Text style={styles.sender}>@lexi_style</Text>
          <Text style={styles.messageText}>What are we wearing to the concert tonight? 🔥</Text>
        </View>
        
        <View style={[styles.messageBubble, styles.myMessage]}>
          <Text style={[styles.messageText, { color: Colors.obsidian }]}>I'm thinking the cargo pants from yesterday + crop tee</Text>
        </View>
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.silver + '60'}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.silver + '20',
  },
  backText: { fontSize: 32, color: Colors.cream, marginTop: -6 },
  title: { ...Typography.h3, color: Colors.cream },
  membersCount: { ...Typography.caption, color: Colors.accent },
  chatArea: { flex: 1 },
  chatContent: { padding: 24, gap: 16 },
  messageBubble: {
    backgroundColor: Colors.charcoal, alignSelf: 'flex-start',
    padding: 14, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4, borderBottomLeftRadius: 16,
  },
  sender: { ...Typography.caption, color: Colors.silver, marginBottom: 4 },
  messageText: { ...Typography.body, color: Colors.cream },
  inputArea: {
    flexDirection: 'row', padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: Colors.silver + '20', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.charcoal, borderRadius: 100, paddingHorizontal: 20,
    height: 50, color: Colors.cream,
  },
  sendButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 24, color: Colors.obsidian },
});

// src/screens/GroupChatScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function GroupChatScreen({ navigation }: { navigation?: any }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupRoom = async () => {
      const { data, error } = await supabase.from('chat_rooms').select('id, name').eq('name', 'Global Fashion Hub').single();
      if (data) {
        setRoomId(data.id);
        fetchMessages(data.id);
        subscribeToMessages(data.id);
      }
    };
    setupRoom();

    return () => {
      supabase.removeAllChannels(); // Cleanup socket listeners on unmount
    };
  }, []);

  const fetchMessages = async (rid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(name)')
      .eq('room_id', rid)
      .order('created_at', { ascending: false }) // Latest first for inverted FlatList
      .limit(80);
    if (data) setMessages(data);
    setLoading(false);
  };

  const subscribeToMessages = (rid: string) => {
    supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${rid}` },
        async (payload) => {
          // Fetch the profile name for the new message as it is not joined in payload.new
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', payload.new.user_id).single();
          const newMsg = { ...payload.new, profiles: { name: profile?.name || 'Unknown' } };
          setMessages((prev) => [newMsg, ...prev]);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !roomId) return;
    const txt = input.trim();
    setInput('');
    // Optimistic UI could be added here, but relying on server broadcast ensures sync consistency
    await supabase.from('messages').insert({ room_id: roomId, user_id: user.id, text: txt });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{ padding: 10 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Global Fashion Hub</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ flex: 1, justifyContent: 'center' }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted // Renders bottom-up like iMessage/WhatsApp
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.user_id === user?.id;
            const userName = item.profiles?.name || 'User';
            return (
              <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                {!isMe && <Text style={styles.sender}>@{userName.replace(/\s+/g, '').toLowerCase()}</Text>}
                <Text style={[styles.messageText, isMe ? { color: Colors.obsidian } : {}]}>{item.text}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Start typing..."
          placeholderTextColor={Colors.silver + '60'}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!input.trim()}>
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 50, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.silver + '20',
  },
  backText: { fontSize: 36, color: Colors.cream, marginTop: -8 },
  title: { ...Typography.h3, color: Colors.cream },
  chatContent: { padding: 24, gap: 16 },
  messageBubble: {
    padding: 14, borderRadius: 18, maxWidth: '82%',
  },
  theirMessage: {
    backgroundColor: Colors.charcoal, alignSelf: 'flex-start', borderBottomLeftRadius: 4,
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: Colors.accent, borderBottomRightRadius: 4,
  },
  sender: { ...Typography.caption, color: Colors.silver, marginBottom: 4, fontSize: 10 },
  messageText: { ...Typography.body, color: Colors.cream },
  inputArea: {
    flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: Colors.silver + '20', gap: 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.charcoal, borderRadius: 100, paddingHorizontal: 20,
    height: 50, ...Typography.body, color: Colors.cream,
  },
  sendButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 24, color: Colors.obsidian, fontWeight: '700' },
});

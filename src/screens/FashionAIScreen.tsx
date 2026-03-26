// src/screens/FashionAIScreen.tsx — NOVA: 24/7 AI Fashion Assistant
// Features: Chat, TTS (expo-speech), Closet vision via Gemini inlineData
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Keyboard,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { getFashionModel, getVisionModel } from '../lib/gemini';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const QUICK_PROMPTS = [
  '🎨 What colors suit warm skin tones?',
  '👗 Outfit ideas for a first date',
  '🌿 Build a capsule wardrobe on budget',
  '💼 Style tips for the office',
  '🌧️ Monsoon fashion essentials',
  '👟 How to style white sneakers',
];

const NOVA_GREETING = `Hey! I'm **NOVA**, your 24/7 personal fashion AI ✦

Ask me anything — outfit pairing, color theory, trend advice, styling tips for your body type, what to wear to any occasion, and more.

Tap 🎭 to let me **read your closet** and give personalised outfit ideas!

What's on your fashion mind today? 💫`;

// Strip markdown for cleaner TTS
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/•/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

export default function FashionAIScreen() {
  const { user } = useAuthStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    { id: 'greeting', role: 'model', text: NOVA_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFetchingCloset, setIsFetchingCloset] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const chatRef = useRef<any>(null);

  // ── Typing animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnim.stopAnimation();
      dotAnim.setValue(0);
    }
  }, [isTyping]);

  // ── Cleanup TTS on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // ── Chat helper ────────────────────────────────────────────────────────────
  const getOrCreateChat = () => {
    if (!chatRef.current) {
      const model = getFashionModel();
      chatRef.current = model.startChat({ history: [] });
    }
    return chatRef.current;
  };

  // ── TTS toggle ─────────────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const clean = stripMarkdown(text);
    setIsSpeaking(true);
    Speech.speak(clean, {
      language: 'en-US',
      pitch: 1.05,
      rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking]);

  // ── Send plain text message ────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const chat = getOrCreateChat();
      const result = await chat.sendMessage(trimmed);
      const responseText = result.response.text();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Hmm, I hit a snag! 😅 Please check your connection.\n\n_Error: ${e.message}_`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Voice Dictation Hint ───────────────────────────────────────────────────
  const handleMicPress = () => {
    Alert.alert(
      'Voice Dictation', 
      'To speak to NOVA, simply tap the built-in 🎙 microphone icon on your device keyboard!',
      [{ text: 'Got it', onPress: () => textInputRef.current?.focus() }]
    );
  };

  // ── Read closet → Gemini vision ────────────────────────────────────────────
  const analyzeCloset = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to use closet analysis.');
      return;
    }
    if (isTyping || isFetchingCloset) return;

    setIsFetchingCloset(true);

    try {
      // 1. Fetch wardrobe items
      const { data: items, error } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12); // Cap at 12 images to stay within token limits

      if (error) throw error;
      if (!items || items.length === 0) {
        Alert.alert('Empty Closet', 'Your closet has no items yet. Add some clothes first!');
        setIsFetchingCloset(false);
        return;
      }

      // Inform user we're loading
      const loadingMsg: Message = {
        id: 'closet-loading',
        role: 'user',
        text: `🎭 Analyze my closet (${items.length} items) and suggest outfit combinations!`,
      };
      setMessages((prev) => [...prev, loadingMsg]);
      setIsTyping(true);
      setIsFetchingCloset(false);

      // 2. Download images and convert to base64 via fetch
      const imageParts: { inlineData: { mimeType: string; data: string } }[] = [];

      for (const item of items) {
        try {
          const response = await fetch(item.image_url);
          if (!response.ok) continue;
          const arrayBuffer = await response.arrayBuffer();
          // Convert ArrayBuffer → base64
          const uint8 = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);
          // Detect mime type from URL or default to jpeg
          const ext = item.image_url.split('.').pop()?.toLowerCase();
          const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
          imageParts.push({ inlineData: { mimeType, data: base64 } });
        } catch (_) {
          // Skip images that fail to download
        }
      }

      if (imageParts.length === 0) {
        throw new Error('Could not load any closet images. Check your internet connection.');
      }

      // 3. Build category summary for context
      const categoryCounts: Record<string, number> = {};
      items.forEach((it) => {
        categoryCounts[it.category] = (categoryCounts[it.category] || 0) + 1;
      });
      const categoryDesc = Object.entries(categoryCounts)
        .map(([cat, count]) => `${count} ${cat.toLowerCase()}(s)`)
        .join(', ');

      // 4. Send to Gemini 2.0 Flash with vision
      const visionModel = getVisionModel();
      const prompt = `You're looking at the user's actual wardrobe containing ${categoryDesc}.
Analyse these clothing items carefully — their colors, patterns, and styles.
Then suggest 3 specific complete outfit combinations using ONLY the items you can see.
Format each outfit clearly with items and why they work together.
Keep it personal, encouraging, and fashion-forward! 💫`;

      const result = await visionModel.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `I couldn't read your closet right now 😔\n\n_${e.message || 'Please try again.'}_`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      setIsFetchingCloset(false);
    }
  };

  // ── Render message ─────────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const parts = item.text.split(/(\*\*[^*]+\*\*)/g);

    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>✦</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={isUser ? styles.msgTextUser : styles.msgTextAI}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <Text key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>;
              }
              return part;
            })}
          </Text>
          {/* TTS button on AI messages */}
          {!isUser && (
            <TouchableOpacity
              style={styles.ttsBtn}
              onPress={() => speakText(item.text)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.ttsBtnIcon}>{isSpeaking ? '⏹' : '🔊'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.novaIcon}>
            <Text style={styles.novaIconText}>✦</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>NOVA</Text>
            <Text style={styles.headerSub}>Fashion AI · Always On</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {isSpeaking && <View style={styles.speakingDot} />}
          <View style={styles.onlineDot} />
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.msgRow]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>✦</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                <Animated.Text style={[styles.typingDots, { opacity: dotAnim }]}>
                  ● ● ●
                </Animated.Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <View style={styles.quickPromptsContainer}>
          <FlatList
            data={QUICK_PROMPTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.quickPromptsList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.quickPrompt} onPress={() => sendMessage(item)}>
                <Text style={styles.quickPromptText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBarWrapper}>
        <View style={styles.inputBar}>
          {/* Closet Vision Button */}
          <TouchableOpacity
            style={[styles.iconBtn, (isFetchingCloset || isTyping) && styles.iconBtnDisabled]}
            onPress={analyzeCloset}
            disabled={isFetchingCloset || isTyping}
          >
            {isFetchingCloset ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <Text style={styles.iconBtnText}>🎭</Text>
            )}
          </TouchableOpacity>

          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask NOVA anything about fashion…"
            placeholderTextColor={Colors.silver + '50'}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
          />

          {/* Voice / Send Button */}
          {input.trim() ? (
            <TouchableOpacity
              style={[styles.sendBtn, isTyping && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={isTyping}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color={Colors.obsidian} />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.micBtn, isTyping && styles.sendBtnDisabled]}
              onPress={handleMicPress}
              disabled={isTyping}
            >
              <Text style={styles.micIcon}>🎙</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.poweredBy}>
          {isSpeaking ? '🔊 NOVA is speaking — tap 🔊 on a message to stop' : 'Tap 🎙 for voice · Tap 🎭 for closet outfit ideas'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.silver + '15',
    backgroundColor: Colors.obsidian,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  novaIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent + '25',
    borderWidth: 1.5, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  novaIconText: { fontSize: 18, color: Colors.accent },
  headerTitle: { ...Typography.h3, color: Colors.cream, fontSize: 17 },
  headerSub: { ...Typography.caption, color: Colors.silver, marginTop: 1 },
  onlineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
  },
  speakingDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },

  // Messages
  messagesList: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 16 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, maxWidth: '90%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    borderWidth: 1, borderColor: Colors.accent + '60',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 13, color: Colors.accent },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '85%' },
  bubbleAI: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1, borderColor: Colors.silver + '15',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  msgTextAI: { ...Typography.body, color: Colors.cream, lineHeight: 22, fontSize: 14 },
  msgTextUser: { ...Typography.body, color: Colors.obsidian, lineHeight: 22, fontSize: 14 },

  // TTS button
  ttsBtn: { alignSelf: 'flex-end', marginTop: 6 },
  ttsBtnIcon: { fontSize: 14, opacity: 0.6 },

  // Typing indicator
  typingBubble: { paddingVertical: 14, paddingHorizontal: 20 },
  typingDots: { fontSize: 12, color: Colors.accent, letterSpacing: 4 },

  // Quick prompts
  quickPromptsContainer: { paddingBottom: 8 },
  quickPromptsList: { paddingHorizontal: 16, gap: 8 },
  quickPrompt: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.silver + '25',
  },
  quickPromptText: { ...Typography.label, color: Colors.cream, fontSize: 12 },

  // Input bar
  inputBarWrapper: {
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.silver + '15',
    backgroundColor: Colors.obsidian,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: Colors.charcoal,
    borderRadius: 24, borderWidth: 1, borderColor: Colors.silver + '20',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1, borderColor: Colors.accent + '40',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconBtnDisabled: { opacity: 0.4 },
  iconBtnText: { fontSize: 17 },
  textInput: {
    flex: 1, color: Colors.cream, fontSize: 15,
    maxHeight: 100, paddingTop: 6, paddingBottom: 6,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: Colors.silver + '30' },
  sendIcon: { fontSize: 18, color: Colors.obsidian, fontWeight: '700', marginTop: -1 },
  
  micBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.accent + '40',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  micIcon: { fontSize: 16, color: Colors.accent },

  poweredBy: {
    ...Typography.caption, color: Colors.silver + '55',
    textAlign: 'center', marginTop: 8, fontSize: 10,
  },
});

// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading, error, user } = useAuthStore();

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      alert('Notice: OAuth is disabled. Please use Email/Password during this testing phase.');
    } catch (e: any) {
      console.warn(`[OAuth Error]: ${e.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.stylePreferences) {
        navigation.replace('Main');
      } else {
        navigation.replace('StyleQuiz');
      }
    } catch (e) {
      // Error is handled in the store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.headline}>Welcome back.</Text>
          <Text style={styles.subheadline}>Sign in to your wardrobe.</Text>
        </View>

        {/* Social Sign-in */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuth('google')}>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuth('apple')}>
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.silverFaint}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.silverFaint}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={{ ...Typography.caption, color: Colors.accent, textAlign: 'center' }}>{error}</Text>}

        {/* CTA */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerLinkText}>
            New here? <Text style={{ color: Colors.accent }}>Create an account →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    gap: 24,
  },
  logoArea: { alignItems: 'flex-start', gap: 8 },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoLetter: { fontSize: 26, fontWeight: '800', color: Colors.obsidian },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  socialContainer: { gap: 12 },
  socialButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.silver + '40',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.charcoal,
  },
  socialButtonText: { ...Typography.body, color: Colors.cream },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.silver + '30' },
  dividerText: { ...Typography.caption, color: Colors.silver },
  formContainer: { gap: 16 },
  inputWrapper: { gap: 6 },
  inputLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase' },
  input: {
    height: 52,
    backgroundColor: Colors.charcoal,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.silver + '30',
    color: Colors.cream,
    fontSize: 15,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  eyeText: { fontSize: 18 },
  forgotButton: { alignSelf: 'flex-end' },
  forgotText: { ...Typography.caption, color: Colors.accent },
  primaryButton: {
    height: 56,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...Typography.label,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.obsidian,
    letterSpacing: 0.5,
  },
  registerLink: { alignItems: 'center' },
  registerLinkText: { ...Typography.body, color: Colors.silver },
});

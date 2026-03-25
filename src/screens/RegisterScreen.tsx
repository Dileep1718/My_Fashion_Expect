// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    try {
      await signUp(email, password, name);
      navigation.replace('StyleQuiz');
    } catch (e) {
      // Error mapped in store
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headline}>Create your{'\n'}account.</Text>
        <Text style={styles.subheadline}>Join thousands of fashion-forward individuals.</Text>

        <View style={styles.form}>
          {[
            { label: 'FULL NAME', value: name, setter: setName, placeholder: 'Your name' },
            { label: 'EMAIL', value: email, setter: setEmail, placeholder: 'your@email.com', keyboard: 'email-address' as any },
            { label: 'PASSWORD', value: password, setter: setPassword, placeholder: '••••••••', secure: true },
          ].map(({ label, value, setter, placeholder, keyboard, secure }) => (
            <View key={label} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor={Colors.silverFaint}
                keyboardType={keyboard || 'default'}
                autoCapitalize="none"
                secureTextEntry={secure}
              />
            </View>
          ))}
        </View>

        <Text style={styles.termsText}>
          By creating an account you agree to our{' '}
          <Text style={{ color: Colors.accent }}>Terms of Service</Text> and{' '}
          <Text style={{ color: Colors.accent }}>Privacy Policy</Text>.
        </Text>

        {error && <Text style={{ ...Typography.caption, color: Colors.accent, textAlign: 'center' }}>{error}</Text>}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={{ color: Colors.accent }}>Sign in →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48, gap: 20 },
  backButton: { marginBottom: 8 },
  backText: { ...Typography.body, color: Colors.silver },
  headline: { ...Typography.h1, color: Colors.cream },
  subheadline: { ...Typography.body, color: Colors.silver },
  form: { gap: 14 },
  inputWrapper: { gap: 6 },
  inputLabel: { ...Typography.label, color: Colors.silver, textTransform: 'uppercase' },
  input: {
    height: 52, backgroundColor: Colors.charcoal, borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.silver + '30',
    color: Colors.cream, fontSize: 15,
  },
  termsText: { ...Typography.caption, color: Colors.silver, lineHeight: 18 },
  primaryButton: {
    height: 56, backgroundColor: Colors.accent, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { ...Typography.label, fontSize: 16, fontWeight: '700', color: Colors.obsidian },
  loginLinkText: { ...Typography.body, color: Colors.silver, textAlign: 'center' },
});

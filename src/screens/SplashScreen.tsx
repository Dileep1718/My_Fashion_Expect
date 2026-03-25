// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

import { useAuthStore } from '../stores/authStore';

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      const { isAuthenticated, hasOnboarded } = useAuthStore.getState();
      if (isAuthenticated) {
        navigation.replace('Main');
      } else if (hasOnboarded) {
        // Bypass onboarding and jump straight to Login inside Auth nested navigator
        navigation.replace('Auth', { screen: 'Login' });
      } else {
        navigation.replace('Auth'); // default goes to Onboarding
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      <Animated.View
        style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>M</Text>
        </View>

        <Text style={styles.logoTitle}>MY Outfit</Text>
        <Text style={styles.tagline}>Dress Your Confidence.</Text>
      </Animated.View>

      <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
        by Mo ✦
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: Colors.charcoal,
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: Colors.accentFaint,
    opacity: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.obsidian,
  },
  logoTitle: {
    ...Typography.display,
    color: Colors.cream,
    letterSpacing: 1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.silver,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerText: {
    position: 'absolute',
    bottom: 48,
    ...Typography.caption,
    color: Colors.silver,
    letterSpacing: 1.5,
  },
});

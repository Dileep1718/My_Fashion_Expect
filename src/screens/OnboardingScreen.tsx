// src/screens/OnboardingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '✦',
    title: 'Your Style,\nReimagined.',
    subtitle: 'Discover outfits that match your unique personality and body type.',
    accent: Colors.accent,
  },
  {
    id: '2',
    emoji: '🪄',
    title: 'AI Try-On\nBefore You Buy.',
    subtitle: 'See exactly how any outfit looks on you — no fitting room needed.',
    accent: Colors.sage,
  },
  {
    id: '3',
    emoji: '👗',
    title: 'Your Digital\nWardrobe.',
    subtitle: 'Organise your closet, plan your looks, and never repeat an outfit.',
    accent: Colors.silver,
  },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export default function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      navigation.replace('Login');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={[styles.title, { color: Colors.cream }]}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === activeIndex ? Colors.accent : Colors.silverFaint },
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>{isLast ? 'Get Started' : 'Continue'}</Text>
        </TouchableOpacity>
        {!isLast && (
          <TouchableOpacity onPress={() => {
            completeOnboarding();
            navigation.replace('Login');
          }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    color: Colors.cream,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.silver,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.obsidian,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipText: {
    ...Typography.body,
    color: Colors.silver,
  },
});

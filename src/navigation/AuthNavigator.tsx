// src/navigation/AuthNavigator.tsx
// Flow: Onboarding → Login / Register → StyleQuiz → (Body Ratio optional)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StyleQuizScreen from '../screens/StyleQuizScreen';
import BodyRatioScreen from '../screens/BodyRatioScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  StyleQuiz: undefined;
  BodyRatio: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="StyleQuiz" component={StyleQuizScreen} />
      <Stack.Screen name="BodyRatio" component={BodyRatioScreen} />
    </Stack.Navigator>
  );
}

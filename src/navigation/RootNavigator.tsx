// src/navigation/RootNavigator.tsx
// Top-level navigator: Splash → Auth → Main App
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
// Modal screens (accessible from anywhere)
import OOTDPostScreen from '../screens/OOTDPostScreen';
import FitCheckScreen from '../screens/FitCheckScreen';
import FollowerFeedScreen from '../screens/FollowerFeedScreen';
import OutfitSuggestionScreen from '../screens/OutfitSuggestionScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BodyRatioScreen from '../screens/BodyRatioScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import HairstyleStudioScreen from '../screens/HairstyleStudioScreen';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  // Modals / Detail screens
  OOTDPost: undefined;
  FitCheck: undefined;
  FollowerFeed: undefined;
  OutfitSuggestion: undefined;
  History: undefined;
  Settings: undefined;
  BodyRatio: undefined;
  GroupChat: undefined;
  HairstyleStudio: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {/* Entry */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Auth flow */}
      <Stack.Screen name="Auth" component={AuthNavigator} options={{ animation: 'slide_from_right' }} />

      {/* Main app with bottom tabs */}
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ animation: 'fade' }} />

      {/* Modal screens (accessible via navigation.navigate from anywhere) */}
      <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
        <Stack.Screen name="OOTDPost" component={OOTDPostScreen} />
        <Stack.Screen name="FitCheck" component={FitCheckScreen} />
        <Stack.Screen name="FollowerFeed" component={FollowerFeedScreen} />
        <Stack.Screen name="OutfitSuggestion" component={OutfitSuggestionScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="BodyRatio" component={BodyRatioScreen} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
        <Stack.Screen name="HairstyleStudio" component={HairstyleStudioScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

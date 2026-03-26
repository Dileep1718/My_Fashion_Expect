// src/navigation/MainTabNavigator.tsx
// Bottom tab bar: Home | Search | Try-On | Closet | Profile
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// Screens
import HomeFeedScreen from '../screens/HomeFeedScreen';
import SearchScreen from '../screens/SearchScreen';
import FashionAIScreen from '../screens/FashionAIScreen';
import VirtualClosetScreen from '../screens/VirtualClosetScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  FashionAI: undefined;
  Closet: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '⌂',
  Search: '⌕',
  FashionAI: '✦',
  Closet: '◻',
  Profile: '◉',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }: { focused: boolean }) => (
          <Text style={[styles.label, focused && styles.labelActive]}>
            {route.name === 'FashionAI' ? 'AI Chat' : route.name}
          </Text>
        ),
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeFeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="FashionAI" component={FashionAIScreen} />
      <Tab.Screen name="Closet" component={VirtualClosetScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    backgroundColor: Colors.obsidian,
    borderTopWidth: 1,
    borderTopColor: Colors.silver + '25',
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  iconContainer: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconContainerActive: {
    backgroundColor: Colors.accent + '20',
  },
  icon: {
    fontSize: 18,
    color: Colors.silver,
    opacity: 0.5,
  },
  iconActive: {
    color: Colors.accent,
    opacity: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.silver,
    opacity: 0.5,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.accent,
    opacity: 1,
  },
});

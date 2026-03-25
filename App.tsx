import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { supabase } from './src/lib/supabase';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        useAuthStore.setState({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.email?.split('@')[0],
            stylePreferences: profile?.style_preferences,
          },
        });
      } else {
        useAuthStore.setState({ isAuthenticated: false, user: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#0B0B0B" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

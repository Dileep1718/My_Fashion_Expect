import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';
import { auth } from './src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from './src/lib/supabase';

export default function App() {
  const initSession = useAuthStore((s) => s.initSession);

  useEffect(() => {
<<<<<<< HEAD
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        // Lookup the native PostgreSQL UUID attached to this Firebase email
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', firebaseUser.email)
          .single();

        if (profile) {
          useAuthStore.setState({
            isAuthenticated: true,
            user: {
              id: profile.id, // the required native UUID
              email: profile.email || '',
              name: profile.name || firebaseUser.email.split('@')[0],
              stylePreferences: profile.style_preferences,
            },
          });
        } else {
          // If profile lookup fails natively, drop the session state
          useAuthStore.setState({ isAuthenticated: false, user: null });
        }
      } else {
        // Logged out natively in Firebase
        useAuthStore.setState({ isAuthenticated: false, user: null });
      }
    });

    return () => unsubscribe();
=======
    // Restores persisted session and subscribes to token refresh / sign-out events
    initSession();
>>>>>>> 46973d8 (feat: Add NOVA Fashion AI with closet vision, fix RLS on posts, and add native voice dictation hint)
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



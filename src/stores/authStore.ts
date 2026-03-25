// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

// Simple UUID generator fallback since crypto.randomUUID may not be available in bare RN
function generateFallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface User {
  id: string; // The Supabase UUID mapped to this user
  email: string;
  name: string;
  stylePreferences?: {
    styles: string[];
    palette: string | null;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  completeOnboarding: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (styles: string[], palette: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasOnboarded: false,
      user: null,
      isLoading: false,
      error: null,

      completeOnboarding: () => set({ hasOnboarded: true }),

      signIn: async (email, pass) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Authenticate with Firebase
          await signInWithEmailAndPassword(auth, email, pass);

          // 2. Fetch the linked mapped UUID from Supabase via Email
          const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (dbError || !profile) {
            throw new Error('Profile not found in database for this Firebase account.');
          }

          set({
            isAuthenticated: true,
            user: {
              id: profile.id, // The mapped UUID the rest of the app relies on natively
              email: profile.email || email,
              name: profile.name || email.split('@')[0],
              stylePreferences: profile.style_preferences,
            },
          });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (email, pass, name) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Create User in Firebase
          await createUserWithEmailAndPassword(auth, email, pass);

          // 2. Generate Native Supabase UUID for them
          const newUUID = generateFallbackUUID();

          // 3. Insert officially into Supabase PostgreSQL Database bridging the ecosystems
          const { error: dbError } = await supabase.from('profiles').insert({
            id: newUUID,
            email: email,
            name: name,
          });

          if (dbError) throw dbError;

          set({
            isAuthenticated: true,
            user: {
              id: newUUID,
              email: email,
              name: name,
            },
          });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        await firebaseSignOut(auth);
        set({ isAuthenticated: false, user: null });
      },

      updatePreferences: async (styles, palette) => {
        const currentUser = get().user;
        if (currentUser) {
          const prefs = { styles, palette };
          set({
            user: { ...currentUser, stylePreferences: prefs },
          });

          await supabase
            .from('profiles')
            .update({ style_preferences: prefs })
            .eq('id', currentUser.id);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

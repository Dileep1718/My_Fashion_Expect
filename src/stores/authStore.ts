// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
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

  // Actions
  completeOnboarding: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => void;
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
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
          });

          if (error) throw error;

          if (data.user) {
            // We fetch the profile separately or rely on onAuthStateChange, 
            // but for immediate UI response we can construct a base user
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              isAuthenticated: true,
              user: {
                id: data.user.id,
                email: data.user.email || email,
                name: profile?.name || email.split('@')[0],
                stylePreferences: profile?.style_preferences,
              },
            });
          }
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
          const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
              data: { name },
            },
          });

          if (error) throw error;

          if (data.user) {
            set({
              isAuthenticated: true,
              user: {
                id: data.user.id,
                email: data.user.email || email,
                name: name,
              },
            });
          }
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null });
      },

      updatePreferences: async (styles, palette) => {
        const currentUser = get().user;
        if (currentUser) {
          const prefs = { styles, palette };
          set({
            user: {
              ...currentUser,
              stylePreferences: prefs,
            },
          });

          // Sync with Supabase asynchronously
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

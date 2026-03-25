// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://piwwgcmgvbbiosexwncv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpd3dnY21ndmJiaW9zZXh3bmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTI3OTAsImV4cCI6MjA4OTk4ODc5MH0.nzQg7vf0Wd4u6JVbwD240mIWU9VIomM3pJ0ZCaV3utE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

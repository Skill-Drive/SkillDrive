import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { bookingService } from '../services/bookingService';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null; // store role and profile info
  loading: boolean;
  initialize: () => Promise<void>;
  signOut: (scope?: 'local' | 'global') => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      let profile = null;
      if (session?.user) {
        profile = await bookingService.getUserProfile();
      }

      set({ session, user: session?.user ?? null, profile, loading: false });

      // Listen for changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        let newProfile = null;
        if (session?.user) {
          newProfile = await bookingService.getUserProfile();
        }
        set({ session, user: session?.user ?? null, profile: newProfile });
      });
    } catch (error) {
      console.error('Auth initialization failed', error);
      set({ loading: false });
    }
  },
  signOut: async (scope: 'local' | 'global' = 'local') => {
    await supabase.auth.signOut({ scope });
    set({ session: null, user: null, profile: null });
  }
}));

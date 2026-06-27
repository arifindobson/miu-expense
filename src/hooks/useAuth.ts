import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const KEEP_KEY = 'miu_keep_logged_in';

export interface AuthState {
  isAuthenticated: boolean;
  authLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  onLoginSuccess: (uid: string) => void;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const keepLoggedIn = localStorage.getItem(KEEP_KEY);
          if (keepLoggedIn === 'true') {
            setUserId(session.user.id);
            setUserEmail(session.user.email || null);
            setIsAuthenticated(true);
          } else {
            await supabase.auth.signOut();
            setUserId(null);
            setUserEmail(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      }
      setAuthLoading(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLoginSuccess = (uid: string) => {
    setUserId(uid);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
    localStorage.removeItem(KEEP_KEY);
    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, authLoading, userId, userEmail, onLoginSuccess, logout };
}

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let failureCount = 0;

    const checkProStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_pro, plan_type')
          .eq('id', userId)
          .single();

        if (!error && data) {
          // Success - reset failure count
          failureCount = 0;
          
          // Set isPro status
          const proStatus = data.is_pro || false;
          setIsPro(proStatus);
        } else if (error) {
          failureCount++;
          // Stop checking after 3 failures
          if (failureCount >= 3 && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        failureCount++;
        // Stop checking after 3 failures
        if (failureCount >= 3 && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkProStatus(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Reset failure count on auth change
        failureCount = 0;
        checkProStatus(session.user.id);
        
        // Clear existing interval if any
        if (intervalId) {
          clearInterval(intervalId);
        }
        
        // Start new interval for this user
        intervalId = setInterval(() => {
          if (failureCount < 3) {
            checkProStatus(session.user.id);
          } else {
            // Stop interval after 3 failures
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        }, 300000); // 5 minutes
      } else {
        setIsPro(false);
        // Clear interval when user logs out
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Empty deps - only run once

  const signUp = async (email: string, password: string) => {
    try {
      // First, check if user already exists by attempting to sign in
      const { data: existingSession, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in succeeds, user already exists with these exact credentials
      if (existingSession?.user) {
        return { 
          error: { 
            message: 'An account with this email already exists. Please sign in instead.',
            code: 'user_already_exists'
          } 
        };
      }

      // If sign in fails with invalid credentials, check if the email exists at all
      if (signInError && signInError.message !== 'Invalid login credentials') {
        // Some other error occurred during sign in check
        console.error('Error checking existing user:', signInError);
      }

      // Now attempt to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      // Check if signup succeeded but user already exists (Supabase behavior)
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        // User already exists but hasn't confirmed email, or confirmation is disabled
        return { 
          error: { 
            message: 'An account with this email already exists. Please sign in or check your email for a confirmation link.',
            code: 'user_already_exists'
          } 
        };
      }

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.',
              code: 'user_already_exists'
            } 
          };
        }
        return { error };
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: data.user.id,
          email: data.user.email,
          is_pro: false,
        });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail signup if profile creation fails - profile can be created later
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { 
        error: { 
          message: err.message || 'An error occurred during signup. Please try again.',
          code: 'signup_error'
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const upgradeToPro = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_pro: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error) {
        setIsPro(true);
      }
    } catch (error) {
      console.error('Error upgrading to pro:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }

      console.log('Password reset email sent successfully');
      return { error: null };
    } catch (err: any) {
      console.error('Password reset exception:', err);
      return { 
        error: { 
          message: err.message || 'Failed to send reset email. Please check your connection and try again.' 
        } 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isPro,
        signUp,
        signIn,
        signOut,
        upgradeToPro,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



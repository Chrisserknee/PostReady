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
    console.log('🚀 AuthProvider useEffect mounted');
    
    // CRITICAL FIX: Remove auth error hash from URL to prevent session clearing
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error=') || hash.includes('error_code=')) {
        console.log('🚨 DETECTED AUTH ERROR IN URL:', hash);
        console.log('🧹 Clearing error hash to prevent session logout...');
        
        // Clear the hash without triggering a page reload
        const cleanUrl = window.location.href.split('#')[0];
        window.history.replaceState({}, document.title, cleanUrl);
        
        console.log('✅ Error hash cleared from URL');
      }
      
      const storedAuth = localStorage.getItem('postready-auth-token');
      console.log('🔍 Checking localStorage for auth token:', storedAuth ? 'FOUND' : 'NOT FOUND');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          console.log('📦 Stored auth data:', {
            hasAccessToken: !!parsed?.access_token,
            hasRefreshToken: !!parsed?.refresh_token,
            expiresAt: parsed?.expires_at,
            currentTime: Math.floor(Date.now() / 1000)
          });
        } catch (e) {
          console.error('❌ Failed to parse stored auth:', e);
        }
      }
    }
    
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
    console.log('🔄 Calling supabase.auth.getSession()...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📡 getSession() response received');
      
      if (error) {
        console.error('❌ Session retrieval error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
      }
      
      if (session) {
        console.log('✅ Session found on load!');
        console.log('User:', {
          id: session.user?.id,
          email: session.user?.email,
          emailConfirmed: session.user?.email_confirmed_at
        });
        console.log('Session:', {
          expiresAt: session.expires_at,
          expiresIn: session.expires_in,
          tokenType: session.token_type
        });
      } else {
        console.log('⚠️ No session found on load');
        console.log('This means the user is logged out or session expired');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkProStatus(session.user.id);
      }
      setLoading(false);
      console.log('✅ Auth loading complete, loading state set to false');
    }).catch((err) => {
      console.error('❌ Fatal error during getSession():', err);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 AUTH STATE CHANGE EVENT');
      console.log('Event:', _event);
      console.log('User:', session?.user?.email || 'No user');
      console.log('Has Session:', !!session);
      console.log('='.repeat(60) + '\n');
      
      // Check localStorage after auth change
      if (typeof window !== 'undefined') {
        const storedAuth = localStorage.getItem('postready-auth-token');
        console.log('📦 localStorage after auth change:', storedAuth ? 'EXISTS' : 'MISSING');
      }
      
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
        console.log('👤 Creating user profile for:', data.user.email);
        
        // Create user profile with more complete data
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            is_pro: false,
            plan_type: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError);
          console.error('Profile error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          // Profile creation failed - this might cause issues later
          // but we don't want to block signup
        } else {
          console.log('✅ User profile created successfully:', profileData);
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
    console.log('🔐 signIn called for:', email);
    
    // Check storage availability
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('test-storage', 'test');
        const test = localStorage.getItem('test-storage');
        localStorage.removeItem('test-storage');
        console.log('✅ localStorage is accessible:', test === 'test');
      } catch (e) {
        console.error('❌ localStorage is NOT accessible:', e);
        console.error('This could be due to private browsing mode or browser restrictions');
      }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.session) {
      console.log('✅ Sign in successful!');
      console.log('Session details:', {
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in
      });
      
      // Verify session was stored
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const storedAuth = localStorage.getItem('postready-auth-token');
          console.log('🔍 Verifying session storage after sign-in:', storedAuth ? 'STORED' : 'NOT STORED');
        }
      }, 1000);
    } else if (error) {
      console.error('❌ Sign in failed:', error);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const upgradeToPro = async () => {
    // Navigate to premium page
    if (typeof window !== 'undefined') {
      window.location.href = '/?premium=true';
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



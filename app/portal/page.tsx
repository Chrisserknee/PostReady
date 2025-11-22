"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/SectionCard';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';

export default function UserPortal() {
  const { user, isPro, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [billingLoading, setBillingLoading] = useState(false);
  const [userPlanType, setUserPlanType] = useState<'free' | 'pro' | 'creator'>('free');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signingOutRef = useRef(false);
  
  // Support contact form state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportModalState, setSupportModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  
  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'success' | 'error';
    onConfirm?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Load user plan type - refresh when isPro changes
  useEffect(() => {
    const loadUserPlanType = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('plan_type, is_pro')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setUserPlanType(data.plan_type || 'free');
          }
        } catch (error) {
          console.error('Error loading plan type:', error);
        }
      } else {
        setUserPlanType('free');
      }
    };
    
    loadUserPlanType();
  }, [user, isPro]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSupportSubmit = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      setSupportModalState({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please fill in both subject and message fields.',
        type: 'error',
      });
      return;
    }

    setIsSubmittingSupport(true);
    try {
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage,
          userEmail: user?.email || 'Anonymous',
          userId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSupportModalState({
        isOpen: true,
        title: 'Message Sent!',
        message: 'Your message has been sent. Please check your email for a reply within 24 hours.',
        type: 'success',
      });

      setSupportSubject('');
      setSupportMessage('');
      setShowSupportModal(false);
    } catch (error: any) {
      setSupportModalState({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Failed to send message. Please try again later.',
        type: 'error',
      });
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) {
      setModalState({
        isOpen: true,
        title: 'Not Signed In',
        message: 'Please sign in to manage your billing.',
        type: 'info',
      });
      return;
    }
    
    setBillingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found. Please sign in again.');
      }
      
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Portal error:', error);
      setModalState({
        isOpen: true,
        title: 'Billing Portal Error',
        message: error.message || 'Failed to open billing portal. Please make sure you have an active subscription.',
        type: 'error',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const isCreator = userPlanType === 'creator';

  // Helper for card styles to ensure consistency
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.2), 0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    backdropFilter: 'blur(10px)',
  };

  const getGlowStyle = () => {
    if (isCreator && isPro) return {
      boxShadow: '0 0 50px -5px rgba(218, 165, 32, 0.3), 0 0 0 1px rgba(218, 165, 32, 0.4) inset',
      borderColor: 'rgba(218, 165, 32, 0.3)'
    };
    if (isPro) return {
      boxShadow: '0 0 50px -5px rgba(41, 121, 255, 0.3), 0 0 0 1px rgba(41, 121, 255, 0.4) inset',
      borderColor: 'rgba(41, 121, 255, 0.3)'
    };
    return {};
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen"></div>
      
      <div className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full scale-150"></div>
              <img 
                src="/postready-logo.svg" 
                alt="PostReady Logo" 
                className="h-10 w-auto cursor-pointer hover:scale-105 transition-transform relative z-10"
                onClick={() => router.push('/')}
              />
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--card-border)'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="space-y-8">
          {/* Account Overview */}
          <div className="rounded-2xl p-8 transition-all hover:-translate-y-1" style={{ ...cardStyle, ...getGlowStyle() }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Account Overview
              {isPro && <span className="animate-pulse text-xs">✨</span>}
            </h2>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email Address</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                   {isPro ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold" style={{ 
                      background: isCreator && isPro 
                        ? 'linear-gradient(to right, #DAA520, #F4D03F)' 
                        : 'linear-gradient(to right, #2979FF, #6FFFD2)', 
                      color: 'white',
                      boxShadow: '0 2px 10px rgba(41, 121, 255, 0.2)'
                    }}>
                      {isCreator && isPro ? '✨ Creator Plan' : '⚡ Pro Plan'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Free Plan
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Member Since</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                  {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Billing & Subscription */}
          <div className="rounded-2xl p-8 transition-all hover:-translate-y-1" style={{ ...cardStyle, ...getGlowStyle() }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Billing & Subscription
            </h2>
            
            {isPro ? (
              <div className="p-6 rounded-xl border bg-opacity-50" style={{ 
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--card-border)' 
              }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {isCreator && isPro ? 'Creator Subscription' : 'Pro Subscription'}
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      $10.00 / month
                    </p>
                  </div>
                  <button
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="px-5 py-2.5 rounded-lg font-medium text-white text-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-70"
                    style={{
                      background: isCreator && isPro ? '#DAA520' : '#2979FF',
                    }}
                  >
                    {billingLoading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Manage your payment method, view billing history, or cancel your subscription via our secure portal.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Upgrade to Pro</h3>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  Unlock unlimited AI generation, premium insights, and priority support.
                </p>
                <button
                  onClick={() => router.push('/?premium=true')}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #2979FF, #6FFFD2)',
                    boxShadow: '0 4px 15px rgba(41, 121, 255, 0.3)'
                  }}
                >
                  View Pro Plans
                </button>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="rounded-2xl p-8 transition-all hover:-translate-y-1" style={{ ...cardStyle, ...getGlowStyle() }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Account Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-opacity-50"
                style={{ 
                  borderColor: 'var(--card-border)',
                  backgroundColor: 'var(--background)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <div className="text-left">
                    <span className="block font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Contact Support</span>
                    <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>Get help with your account</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>→</span>
              </button>

              <button
                onClick={() => {
                  setModalState({
                    isOpen: true,
                    title: 'Sign Out',
                    message: 'Are you sure you want to sign out?',
                    type: 'confirm',
                    onConfirm: async () => {
                      if (signingOutRef.current) return;
                      signingOutRef.current = true;
                      setIsSigningOut(true);
                      document.body.style.transition = 'opacity 0.3s ease-out';
                      document.body.style.opacity = '0';
                      await new Promise(resolve => setTimeout(resolve, 300));
                      await supabase.auth.signOut();
                      localStorage.clear();
                      window.location.href = '/';
                    },
                    confirmText: 'Sign Out'
                  });
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/30"
                style={{ 
                  borderColor: 'var(--card-border)',
                  backgroundColor: 'var(--background)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚪</span>
                  <div className="text-left">
                    <span className="block font-medium text-sm text-red-500">Sign Out</span>
                    <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>Log out of your account</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg hover:scale-110 transition-all z-50"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          color: 'var(--text-primary)'
        }}
        title="Toggle Theme"
      >
        <span className="text-2xl">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>

      {/* Modals */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingSupport) {
              setShowSupportModal(false);
              setSupportSubject('');
              setSupportMessage('');
            }
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--card-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Contact Support</h3>
                <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-500">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button onClick={() => setShowSupportModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSupportSubmit} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">Send</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
      />
      
      <Modal
        isOpen={supportModalState.isOpen}
        title={supportModalState.title}
        message={supportModalState.message}
        type={supportModalState.type}
        onClose={() => setSupportModalState({ ...supportModalState, isOpen: false })}
        confirmText="OK"
      />
    </div>
  );
}
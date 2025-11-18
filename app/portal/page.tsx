"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/SectionCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Modal } from '@/components/Modal';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function UserPortal() {
  const { user, isPro, signOut, loading } = useAuth();
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
  }, [user, isPro]); // Refresh when subscription status changes

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
        headers: {
          'Content-Type': 'application/json',
        },
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
        message: data.message || 'Your message has been sent successfully. We\'ll get back to you soon!',
        type: 'success',
      });

      // Clear form
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
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found. Please sign in again.');
      }
      
      // Create Stripe Customer Portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
        }),
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

  // Show loading if auth is loading or no user
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is a creator
  const isCreator = userPlanType === 'creator';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/postready-logo.svg" 
              alt="PostReady Logo" 
              className="h-16 w-auto cursor-pointer transition-all hover:scale-105 logo-glow"
              onClick={() => router.push('/')}
            />
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: isCreator && isPro 
                ? 'rgba(218, 165, 32, 0.3)' 
                : 'var(--card-border)',
              color: isCreator && isPro 
                ? '#DAA520' 
                : 'var(--text-primary)'
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Account Overview */}
        <div 
          className="mb-6 rounded-2xl shadow-lg border p-8 space-y-6 transition-all duration-300"
          style={{
            backgroundColor: isCreator && isPro 
              ? 'rgba(218, 165, 32, 0.08)' 
              : 'var(--card-bg)',
            borderColor: isCreator && isPro 
              ? 'rgba(218, 165, 32, 0.3)' 
              : 'var(--card-border)',
            boxShadow: isCreator && isPro 
              ? '0 10px 40px rgba(218, 165, 32, 0.15)' 
              : '0 10px 40px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ 
                color: isCreator && isPro ? '#DAA520' : 'var(--text-primary)' 
              }}>
                Account Overview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Account Status</p>
                  <div className="flex items-center gap-2">
                    {isPro ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold" style={{ 
                        background: isCreator && isPro 
                          ? 'linear-gradient(to right, #DAA520, #F4D03F)' 
                          : 'linear-gradient(to right, #2979FF, #6FFFD2)', 
                        color: 'white',
                        boxShadow: isCreator && isPro 
                          ? '0 0 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)' 
                          : 'none'
                      }}>
                        {isCreator && isPro ? '✨' : '⚡'} {isCreator && isPro ? 'Creator' : 'Pro'} Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-200" style={{ color: 'var(--text-secondary)' }}>
                        Free Plan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Subscription */}
        <SectionCard className="mb-6">
          <h2 className="text-2xl font-bold mb-6" style={{ 
            color: isCreator && isPro ? '#DAA520' : 'var(--secondary)' 
          }}>
            Billing & Subscription
          </h2>
          
          {isPro ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border-2" style={{ 
                backgroundColor: isCreator && isPro 
                  ? 'rgba(218, 165, 32, 0.08)' 
                  : 'var(--hover-bg)',
                borderColor: isCreator && isPro 
                  ? 'rgba(218, 165, 32, 0.3)' 
                  : 'var(--primary)',
                boxShadow: isCreator && isPro 
                  ? '0 10px 40px rgba(218, 165, 32, 0.15)' 
                  : 'none'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xl flex items-center" style={{ 
                    color: isCreator && isPro ? '#DAA520' : 'var(--text-primary)' 
                  }}>
                    <span className="mr-2">{isCreator && isPro ? '✨' : '⚡'}</span>
                    {isCreator && isPro ? 'PostReady Creator' : 'PostReady Pro'}
                  </h3>
                  <span className="text-lg font-bold px-3 py-1 rounded-lg" style={{ 
                    color: isCreator && isPro ? '#DAA520' : 'var(--primary)',
                    backgroundColor: 'var(--card-bg)'
                  }}>
                    $10/month
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Unlimited video ideas, advanced insights, and priority support
                </p>
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full text-white rounded-xl px-6 py-3 font-bold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105"
                  style={{
                    backgroundColor: billingLoading ? undefined : (isCreator && isPro ? '#DAA520' : '#2979FF'),
                    boxShadow: billingLoading ? undefined : (isCreator && isPro 
                      ? '0 4px 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)' 
                      : '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)')
                  }}
                  onMouseEnter={(e) => {
                    if (!billingLoading) {
                      e.currentTarget.style.backgroundColor = isCreator && isPro ? '#C19A1E' : '#1e5dd9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!billingLoading) {
                      e.currentTarget.style.backgroundColor = isCreator && isPro ? '#DAA520' : '#2979FF';
                    }
                  }}
                >
                  {billingLoading ? 'Loading...' : '⚙️ Manage Subscription'}
                </button>
                <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Update payment method, view invoices, or cancel subscription
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3" style={{ 
                color: 'var(--secondary)' 
              }}>
                Upgrade to Pro
              </h3>
              <p className="mb-6 text-lg" style={{ color: 'var(--text-secondary)' }}>
                Get unlimited video ideas, advanced insights, and priority support for just $10/month
              </p>
              <button
                onClick={() => {
                  router.push('/?premium=true');
                }}
                className="w-full text-white rounded-xl px-6 py-3 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105"
                style={{
                  backgroundColor: '#2979FF',
                  boxShadow: '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e5dd9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2979FF';
                }}
              >
                ⚡ View Pro Plans
              </button>
            </div>
          )}
        </SectionCard>

        {/* Account Actions */}
        <SectionCard>
          <h2 className="text-2xl font-bold mb-6" style={{ 
            color: isCreator && isPro ? '#DAA520' : 'var(--secondary)' 
          }}>
            Account Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{ 
                borderColor: isPro 
                  ? (isCreator && isPro ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)')
                  : 'var(--card-border)',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold flex items-center gap-2" style={{ 
                    color: isPro 
                      ? (isCreator && isPro ? '#DAA520' : 'var(--primary)')
                      : 'var(--text-primary)'
                  }}>
                    {isPro ? '⚡' : ''} {isPro ? 'Priority Support' : 'Support'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isPro ? 'Get priority assistance from our team' : 'Contact our support team'}
                  </p>
                </div>
                <span style={{ 
                  color: isPro 
                    ? (isCreator && isPro ? '#DAA520' : 'var(--primary)')
                    : 'var(--primary)' 
                }}>→</span>
              </div>
            </button>

            <button
              onClick={() => {
                // Show confirmation modal
                setModalState({
                  isOpen: true,
                  title: 'Sign Out',
                  message: 'Are you sure you want to sign out?',
                  type: 'confirm',
                  onConfirm: async () => {
                    // Prevent multiple clicks using ref (instant check, no re-render needed)
                    if (signingOutRef.current) {
                      console.log('⚠️ Sign out already in progress, ignoring click');
                      return;
                    }
                    
                    signingOutRef.current = true;
                    setIsSigningOut(true);
                    console.log('🚪 Signing out...');
                    
                    // Add smooth fade-out effect
                    document.body.style.transition = 'opacity 0.3s ease-out';
                    document.body.style.opacity = '0';
                    
                    // Wait for fade animation
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Sign out from Supabase and wait for it to complete
                    await supabase.auth.signOut();
                    console.log('✅ Signed out successfully');
                    
                    // Clear all local storage
                    localStorage.clear();
                    
                    // Redirect
                    window.location.href = '/';
                  },
                  confirmText: 'Sign Out'
                });
              }}
              disabled={isSigningOut}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#EF4444',
                backgroundColor: 'var(--card-bg)'
              }}
              onMouseEnter={(e) => {
                if (!isSigningOut) {
                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#DC2626';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.borderColor = '#EF4444';
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-red-600">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isSigningOut ? 'Please wait...' : 'Sign out of your account'}
                  </p>
                </div>
                <span className="text-red-600">→</span>
              </div>
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Floating Theme Toggle - Bottom Right */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-110 z-50"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: `3px solid ${isCreator && isPro ? '#DAA520' : 'var(--primary)'}`,
          transition: 'all 0.3s ease, transform 0.2s ease',
          boxShadow: isCreator && isPro 
            ? '0 10px 40px rgba(218, 165, 32, 0.3)' 
            : '0 10px 40px rgba(0, 0, 0, 0.2)'
        }}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <span className="text-3xl" style={{ transition: 'opacity 0.3s ease' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
      
      {/* Support Contact Modal */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingSupport) {
              setShowSupportModal(false);
              setSupportSubject('');
              setSupportMessage('');
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: `2px solid ${isPro 
                ? (isCreator && isPro ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)')
                : 'var(--card-border)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ 
                  color: isPro 
                    ? (isCreator && isPro ? '#DAA520' : 'var(--primary)')
                    : 'var(--text-primary)'
                }}>
                  {isPro ? '⚡ Priority Support' : 'Support'}
                </h3>
                <button
                  onClick={() => {
                    setShowSupportModal(false);
                    setSupportSubject('');
                    setSupportMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {isPro && (
                <div className="mb-4 p-3 rounded-lg" style={{
                  backgroundColor: isCreator && isPro 
                    ? 'rgba(218, 165, 32, 0.1)' 
                    : 'rgba(41, 121, 255, 0.1)',
                  border: `1px solid ${isCreator && isPro 
                    ? 'rgba(218, 165, 32, 0.3)' 
                    : 'rgba(41, 121, 255, 0.3)'}`
                }}>
                  <p className="text-sm font-medium" style={{ 
                    color: isCreator && isPro ? '#DAA520' : 'var(--primary)' 
                  }}>
                    ⚡ As a Pro member, you'll receive priority support with faster response times.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g., Account Issue, Feature Request"
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                    style={{
                      backgroundColor: 'white',
                      borderColor: isPro 
                        ? (isCreator && isPro ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)')
                        : 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmittingSupport}
                    onFocus={(e) => {
                      e.target.style.boxShadow = isPro 
                        ? (isCreator && isPro 
                          ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                          : '0 0 0 2px rgba(41, 121, 255, 0.5)')
                        : '0 0 0 2px rgba(0, 0, 0, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Message *
                  </label>
                  <textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Please describe your question or issue..."
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border-2 resize-none focus:outline-none"
                    style={{
                      backgroundColor: 'white',
                      borderColor: isPro 
                        ? (isCreator && isPro ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)')
                        : 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmittingSupport}
                    onFocus={(e) => {
                      e.target.style.boxShadow = isPro 
                        ? (isCreator && isPro 
                          ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                          : '0 0 0 2px rgba(41, 121, 255, 0.5)')
                        : '0 0 0 2px rgba(0, 0, 0, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {user?.email && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Sending from: {user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportSubject('');
                  setSupportMessage('');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                }}
                disabled={isSubmittingSupport}
              >
                Cancel
              </button>
              <button
                onClick={handleSupportSubmit}
                disabled={isSubmittingSupport || !supportSubject.trim() || !supportMessage.trim()}
                className="px-6 py-2 rounded-lg font-bold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isPro 
                    ? (isCreator && isPro 
                      ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                      : 'linear-gradient(to right, #2979FF, #6FFFD2)')
                    : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  boxShadow: isPro 
                    ? (isCreator && isPro 
                      ? '0 4px 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
                      : '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)')
                    : 'none'
                }}
              >
                {isSubmittingSupport ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
      />
      
      {/* Support Success/Error Modal */}
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


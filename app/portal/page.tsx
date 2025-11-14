"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/SectionCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Modal } from '@/components/Modal';

export default function UserPortal() {
  const { user, isPro, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [billingLoading, setBillingLoading] = useState(false);
  
  // Dev mode support - check localStorage for dev mode state
  const [devMode, setDevMode] = useState<'none' | 'regular' | 'pro' | 'creator'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('devMode') as 'none' | 'regular' | 'pro' | 'creator' | null;
      return stored || 'none';
    }
    return 'none';
  });
  const [devModeLoaded, setDevModeLoaded] = useState(false);
  
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
  
  useEffect(() => {
    // Mark dev mode as loaded after component mounts
    setDevModeLoaded(true);
  }, []);
  
  // Dev mode overrides (same logic as main page)
  const devUser = devMode !== 'none' ? { 
    id: 'dev-user', 
    email: devMode === 'pro' ? 'pro@test.com' : devMode === 'creator' ? 'creator@test.com' : 'user@test.com' 
  } : null;
  const effectiveUser = devMode !== 'none' ? devUser : user;
  const effectiveIsPro = devMode === 'pro' || devMode === 'creator' ? true : devMode !== 'none' ? false : isPro;
  
  
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

  useEffect(() => {
    // Wait for both auth loading and dev mode loading to complete
    // Allow dev mode users or real users
    if (!loading && devModeLoaded && !effectiveUser) {
      router.push('/');
    }
  }, [effectiveUser, loading, devModeLoaded, router]);

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
          userEmail: effectiveUser?.email || 'Anonymous',
          userId: effectiveUser?.id || null,
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
    if (!effectiveUser || devMode !== 'none') {
      // Dev mode users can't manage billing
      setModalState({
        isOpen: true,
        title: 'Billing Unavailable',
        message: 'Billing management is not available in dev mode. Please sign in with a real account.',
        type: 'info',
      });
      return;
    }
    
    if (!user) return;
    
    setBillingLoading(true);
    try {
      // Create Stripe Customer Portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Show loading if auth is loading OR dev mode hasn't loaded yet OR no user
  if (loading || !devModeLoaded || !effectiveUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/postready-logo.svg" 
              alt="PostReady Logo" 
              className="h-16 w-auto cursor-pointer transition-all hover:scale-105"
              onClick={() => router.push('/')}
            />
            <h1 className="text-3xl font-bold" style={{ 
              color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--secondary)' 
            }}>
              User Portal
              {devMode !== 'none' && (
                <span className="ml-3 text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-300">
                  DEV MODE
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: devMode === 'creator' && effectiveIsPro 
                ? 'rgba(218, 165, 32, 0.3)' 
                : 'var(--card-border)',
              color: devMode === 'creator' && effectiveIsPro 
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
            backgroundColor: devMode === 'creator' && effectiveIsPro 
              ? 'rgba(218, 165, 32, 0.08)' 
              : 'var(--card-bg)',
            borderColor: devMode === 'creator' && effectiveIsPro 
              ? 'rgba(218, 165, 32, 0.3)' 
              : 'var(--card-border)',
            boxShadow: devMode === 'creator' && effectiveIsPro 
              ? '0 10px 40px rgba(218, 165, 32, 0.15)' 
              : '0 10px 40px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ 
                color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--text-primary)' 
              }}>
                Account Overview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{effectiveUser?.email || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Account Status</p>
                  <div className="flex items-center gap-2">
                    {effectiveIsPro ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold" style={{ 
                        background: devMode === 'creator' && effectiveIsPro 
                          ? 'linear-gradient(to right, #DAA520, #F4D03F)' 
                          : 'linear-gradient(to right, #2979FF, #6FFFD2)', 
                        color: 'white',
                        boxShadow: devMode === 'creator' && effectiveIsPro 
                          ? '0 0 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)' 
                          : 'none'
                      }}>
                        {devMode === 'creator' && effectiveIsPro ? '✨' : '⚡'} {devMode === 'creator' && effectiveIsPro ? 'Creator' : 'Pro'} Member
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
            color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--secondary)' 
          }}>
            Billing & Subscription
          </h2>
          
          {effectiveIsPro ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border-2" style={{ 
                backgroundColor: devMode === 'creator' && effectiveIsPro 
                  ? 'rgba(218, 165, 32, 0.08)' 
                  : 'var(--hover-bg)',
                borderColor: devMode === 'creator' && effectiveIsPro 
                  ? 'rgba(218, 165, 32, 0.3)' 
                  : 'var(--primary)',
                boxShadow: devMode === 'creator' && effectiveIsPro 
                  ? '0 10px 40px rgba(218, 165, 32, 0.15)' 
                  : 'none'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xl flex items-center" style={{ 
                    color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--text-primary)' 
                  }}>
                    <span className="mr-2">{devMode === 'creator' && effectiveIsPro ? '✨' : '⚡'}</span>
                    {devMode === 'creator' && effectiveIsPro ? 'PostReady Creator' : 'PostReady Pro'}
                  </h3>
                  <span className="text-lg font-bold px-3 py-1 rounded-lg" style={{ 
                    color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)',
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
                    backgroundColor: billingLoading ? undefined : (devMode === 'creator' && effectiveIsPro ? '#DAA520' : '#2979FF'),
                    boxShadow: billingLoading ? undefined : (devMode === 'creator' && effectiveIsPro 
                      ? '0 4px 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)' 
                      : '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)')
                  }}
                  onMouseEnter={(e) => {
                    if (!billingLoading) {
                      e.currentTarget.style.backgroundColor = devMode === 'creator' && effectiveIsPro ? '#C19A1E' : '#1e5dd9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!billingLoading) {
                      e.currentTarget.style.backgroundColor = devMode === 'creator' && effectiveIsPro ? '#DAA520' : '#2979FF';
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
              <div className="text-6xl mb-4">{devMode === 'creator' ? '✨' : '⚡'}</div>
              <h3 className="text-2xl font-bold mb-3" style={{ 
                color: devMode === 'creator' ? '#DAA520' : 'var(--secondary)' 
              }}>
                Upgrade to {devMode === 'creator' ? 'PostReady Creator' : 'PostReady Pro'}
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
                  backgroundColor: devMode === 'creator' ? '#DAA520' : '#2979FF',
                  boxShadow: devMode === 'creator'
                    ? '0 4px 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
                    : '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = devMode === 'creator' ? '#C19A1E' : '#1e5dd9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = devMode === 'creator' ? '#DAA520' : '#2979FF';
                }}
              >
                {devMode === 'creator' ? '✨' : '⚡'} View {devMode === 'creator' ? 'Creator' : 'Pro'} Plans
              </button>
            </div>
          )}
        </SectionCard>

        {/* Account Actions */}
        <SectionCard>
          <h2 className="text-2xl font-bold mb-6" style={{ 
            color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--secondary)' 
          }}>
            Account Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/?view=businesses')}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{ 
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>My Businesses</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>View and manage your saved businesses</p>
                </div>
                <span style={{ 
                  color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)' 
                }}>→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/?view=history')}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{ 
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Post History</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>View all your completed posts</p>
                </div>
                <span style={{ 
                  color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)' 
                }}>→</span>
              </div>
            </button>

            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{ 
                borderColor: effectiveIsPro 
                  ? (devMode === 'creator' && effectiveIsPro ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)')
                  : 'var(--card-border)',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold flex items-center gap-2" style={{ 
                    color: effectiveIsPro 
                      ? (devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)')
                      : 'var(--text-primary)'
                  }}>
                    {effectiveIsPro ? '⚡' : ''} {effectiveIsPro ? 'Priority Support' : 'Support'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {effectiveIsPro ? 'Get priority assistance from our team' : 'Contact our support team'}
                  </p>
                </div>
                <span style={{ 
                  color: effectiveIsPro 
                    ? (devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)')
                    : 'var(--primary)' 
                }}>→</span>
              </div>
            </button>

            <button
              onClick={async () => {
                if (devMode !== 'none') {
                  // For dev mode, just clear dev mode and redirect
                  localStorage.removeItem('devMode');
                  router.push('/');
                  return;
                }
                
                setModalState({
                  isOpen: true,
                  title: 'Sign Out',
                  message: 'Are you sure you want to sign out?',
                  type: 'confirm',
                  onConfirm: async () => {
                    await signOut();
                    router.push('/');
                  },
                  confirmText: 'Sign Out'
                });
              }}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{ 
                borderColor: '#EF4444',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-red-600">Sign Out</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sign out of your account</p>
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
          border: `3px solid ${devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)'}`,
          transition: 'all 0.3s ease, transform 0.2s ease',
          boxShadow: devMode === 'creator' && effectiveIsPro 
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
              border: `2px solid ${effectiveIsPro 
                ? (devMode === 'creator' && effectiveIsPro ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)')
                : 'var(--card-border)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ 
                  color: effectiveIsPro 
                    ? (devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)')
                    : 'var(--text-primary)'
                }}>
                  {effectiveIsPro ? '⚡ Priority Support' : 'Support'}
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

              {effectiveIsPro && (
                <div className="mb-4 p-3 rounded-lg" style={{
                  backgroundColor: devMode === 'creator' && effectiveIsPro 
                    ? 'rgba(218, 165, 32, 0.1)' 
                    : 'rgba(41, 121, 255, 0.1)',
                  border: `1px solid ${devMode === 'creator' && effectiveIsPro 
                    ? 'rgba(218, 165, 32, 0.3)' 
                    : 'rgba(41, 121, 255, 0.3)'}`
                }}>
                  <p className="text-sm font-medium" style={{ 
                    color: devMode === 'creator' && effectiveIsPro ? '#DAA520' : 'var(--primary)' 
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
                      borderColor: effectiveIsPro 
                        ? (devMode === 'creator' && effectiveIsPro ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)')
                        : 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmittingSupport}
                    onFocus={(e) => {
                      e.target.style.boxShadow = effectiveIsPro 
                        ? (devMode === 'creator' && effectiveIsPro 
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
                      borderColor: effectiveIsPro 
                        ? (devMode === 'creator' && effectiveIsPro ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)')
                        : 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmittingSupport}
                    onFocus={(e) => {
                      e.target.style.boxShadow = effectiveIsPro 
                        ? (devMode === 'creator' && effectiveIsPro 
                          ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                          : '0 0 0 2px rgba(41, 121, 255, 0.5)')
                        : '0 0 0 2px rgba(0, 0, 0, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {effectiveUser?.email && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Sending from: {effectiveUser.email}
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
                  background: effectiveIsPro 
                    ? (devMode === 'creator' && effectiveIsPro 
                      ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                      : 'linear-gradient(to right, #2979FF, #6FFFD2)')
                    : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  boxShadow: effectiveIsPro 
                    ? (devMode === 'creator' && effectiveIsPro 
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
      
      {/* Dev Buttons - Top Left */}
      <div className="fixed top-6 left-6 z-50 flex flex-col gap-2">
        <button
          onClick={() => {
            setDevMode('none');
            localStorage.removeItem('devMode');
            router.push('/');
          }}
          className="px-4 py-2 rounded-lg shadow-lg hover:scale-105 text-xs font-bold transition-all"
          style={{ 
            backgroundColor: devMode === 'none' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.5)',
            color: 'rgba(255, 0, 0, 0.9)'
          }}
          title="Not Signed In"
        >
          Not Signed In
        </button>
        <button
          onClick={() => {
            setDevMode('regular');
            localStorage.setItem('devMode', 'regular');
            router.push('/');
          }}
          className="px-4 py-2 rounded-lg shadow-lg hover:scale-105 text-xs font-bold transition-all"
          style={{ 
            backgroundColor: devMode === 'regular' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.5)',
            color: 'rgba(255, 0, 0, 0.9)'
          }}
          title="Regular User"
        >
          Regular User
        </button>
        <button
          onClick={() => {
            setDevMode('pro');
            localStorage.setItem('devMode', 'pro');
            router.push('/');
          }}
          className="px-4 py-2 rounded-lg shadow-lg hover:scale-105 text-xs font-bold transition-all"
          style={{ 
            backgroundColor: devMode === 'pro' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.5)',
            color: 'rgba(255, 0, 0, 0.9)'
          }}
          title="Pro User"
        >
          Pro User
        </button>
        <button
          onClick={() => {
            setDevMode('creator');
            localStorage.setItem('devMode', 'creator');
            router.push('/');
          }}
          className="px-4 py-2 rounded-lg shadow-lg hover:scale-105 text-xs font-bold transition-all"
          style={{ 
            backgroundColor: devMode === 'creator' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.5)',
            color: 'rgba(255, 0, 0, 0.9)'
          }}
          title="Creator User"
        >
          Creator User
        </button>
      </div>
    </div>
  );
}


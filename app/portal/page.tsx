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
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleManageBilling = async () => {
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
            <h1 className="text-3xl font-bold" style={{ color: 'var(--secondary)' }}>
              User Portal
            </h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--card-border)',
              color: 'var(--text-primary)'
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Account Overview */}
        <SectionCard className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Account Overview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email</p>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Account Status</p>
                  <div className="flex items-center gap-2">
                    {isPro ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'linear-gradient(to right, #2979FF, #6FFFD2)', color: 'white' }}>
                        ⚡ Pro Member
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
        </SectionCard>

        {/* Billing & Subscription */}
        <SectionCard className="mb-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--secondary)' }}>
            Billing & Subscription
          </h2>
          
          {isPro ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border-2" style={{ 
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--primary)'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xl flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <span className="mr-2">⚡</span>
                    PostReady Pro
                  </h3>
                  <span className="text-lg font-bold px-3 py-1 rounded-lg" style={{ 
                    color: 'var(--primary)',
                    backgroundColor: 'var(--card-bg)'
                  }}>
                    $10/month
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Unlimited video ideas, advanced insights, and priority support
                </p>
                <PrimaryButton 
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full"
                >
                  {billingLoading ? 'Loading...' : '⚙️ Manage Subscription'}
                </PrimaryButton>
                <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Update payment method, view invoices, or cancel subscription
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                Upgrade to PostReady Pro
              </h3>
              <p className="mb-6 text-lg" style={{ color: 'var(--text-secondary)' }}>
                Get unlimited video ideas, advanced insights, and priority support for just $10/month
              </p>
              <PrimaryButton onClick={() => {
                router.push('/?premium=true');
              }}>
                ⚡ View Pro Plans
              </PrimaryButton>
            </div>
          )}
        </SectionCard>

        {/* Account Actions */}
        <SectionCard>
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--secondary)' }}>
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
                <span style={{ color: 'var(--primary)' }}>→</span>
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
                <span style={{ color: 'var(--primary)' }}>→</span>
              </div>
            </button>

            <button
              onClick={async () => {
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
          border: '3px solid var(--primary)',
          transition: 'all 0.3s ease, transform 0.2s ease'
        }}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <span className="text-3xl" style={{ transition: 'opacity 0.3s ease' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
      
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
    </div>
  );
}


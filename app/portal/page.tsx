"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/SectionCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';

export default function UserPortal() {
  const { user, isPro, signOut, loading } = useAuth();
  const router = useRouter();
  const [billingLoading, setBillingLoading] = useState(false);

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
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
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
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            User Portal
          </h1>
          <SecondaryButton onClick={() => router.push('/')}>
            ← Back to Home
          </SecondaryButton>
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Billing & Subscription
          </h2>
          
          {isPro ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>PostReady Pro</h3>
                  <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>$10/month</span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Unlimited video ideas, advanced insights, and priority support
                </p>
                <PrimaryButton 
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full"
                >
                  {billingLoading ? 'Loading...' : '⚙️ Manage Subscription'}
                </PrimaryButton>
                <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Update payment method, view invoices, or cancel subscription
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Upgrade to PostReady Pro
              </h3>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Get unlimited video ideas, advanced insights, and priority support for just $10/month
              </p>
              <PrimaryButton onClick={() => router.push('/?upgrade=true')}>
                View Pro Plans
              </PrimaryButton>
            </div>
          )}
        </SectionCard>

        {/* Account Actions */}
        <SectionCard>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
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
                if (confirm('Are you sure you want to sign out?')) {
                  await signOut();
                  router.push('/');
                }
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
    </div>
  );
}


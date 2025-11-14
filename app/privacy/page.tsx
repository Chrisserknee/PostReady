"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { theme } = useTheme();

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
              Privacy Policy
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

        {/* Content */}
        <div 
          className="rounded-2xl shadow-lg border p-8 space-y-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              1. Information We Collect
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Account information (email address, password)</li>
              <li>Business information you input into the application</li>
              <li>Payment information processed through Stripe</li>
              <li>Usage data and preferences</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              3. Information Sharing
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>With service providers who assist us in operating our platform (e.g., Stripe for payments, Supabase for data storage)</li>
              <li>When required by law or to protect our rights</li>
              <li>With your consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Data Security
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              5. Your Rights
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt-out of certain communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              6. Cookies and Tracking
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              7. Changes to This Policy
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              8. Contact Us
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions about this Privacy Policy, please contact us through the support channels available in the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}



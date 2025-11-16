"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsOfService() {
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
              className="h-16 w-auto cursor-pointer transition-all hover:scale-105 logo-glow"
              onClick={() => router.push('/')}
            />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--secondary)' }}>
              Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              By accessing and using PostReady, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              2. Description of Service
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              PostReady is a social media content creation tool that helps businesses and creators generate posts, captions, strategies, and content ideas. We provide AI-powered content generation services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              3. User Accounts
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              To use certain features of our service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Subscription and Payment
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              PostReady offers both free and paid subscription plans:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Free plans have limited features and usage</li>
              <li>Paid subscriptions are billed monthly</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>You may cancel your subscription at any time</li>
              <li>Refunds are available as outlined in our Refund Policy</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              5. Acceptable Use
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              6. Intellectual Property
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              The service and its original content, features, and functionality are owned by PostReady and are protected by international copyright, trademark, and other intellectual property laws. Content generated by our AI tools belongs to you, but you grant us a license to use it for service improvement purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              7. Disclaimer of Warranties
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              The service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              8. Limitation of Liability
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              In no event shall PostReady be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              9. Termination
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              10. Changes to Terms
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              11. Contact Information
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions about these Terms of Service, please contact us through the support channels available in the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}



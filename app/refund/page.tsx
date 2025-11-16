"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal';

export default function RefundPolicy() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactModalState, setContactModalState] = useState<{
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

  const handleContactSubmit = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      setContactModalState({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please fill in both subject and message fields.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: contactSubject,
          message: contactMessage,
          userEmail: user?.email || 'Anonymous',
          userId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setContactModalState({
        isOpen: true,
        title: 'Message Sent!',
        message: data.message || 'Your message has been sent successfully. We\'ll get back to you soon!',
        type: 'success',
      });

      // Clear form
      setContactSubject('');
      setContactMessage('');
      setShowContactModal(false);
    } catch (error: any) {
      setContactModalState({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Failed to send message. Please try again later.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Refund Policy
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
              Our Refund Policy
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              At PostReady, we want you to be completely satisfied with our service. If you are not happy with the application for any reason, we offer refunds.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              How to Request a Refund
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              To request a refund, please contact our support team through the support channels available in the application. Include your account email and reason for the refund request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Refund Processing
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Once your refund request is approved:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Refunds will be processed within 5-10 business days</li>
              <li>Refunds will be issued to the original payment method</li>
              <li>You will receive an email confirmation when the refund is processed</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Subscription Cancellation
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will continue to have access to Pro features until the end of your paid period.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Questions?
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you have any questions about our refund policy, please contact our support team.
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-md hover:shadow-lg text-white flex items-center gap-2"
              style={{
                background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </button>
          </section>
        </div>
      </div>

      {/* Contact Us Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setShowContactModal(false);
              setContactSubject('');
              setContactMessage('');
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '2px solid var(--card-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Contact Support
                </h3>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactSubject('');
                    setContactMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g., Refund Request"
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                    style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Message *
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Please describe your question or issue..."
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border-2 resize-none focus:outline-none"
                    style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--card-border)',
                      color: '#1a1a1a',
                    }}
                    disabled={isSubmitting}
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
                  setShowContactModal(false);
                  setContactSubject('');
                  setContactMessage('');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleContactSubmit}
                disabled={isSubmitting || !contactSubject.trim() || !contactMessage.trim()}
                className="px-6 py-2 rounded-lg font-bold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                }}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      <Modal
        isOpen={contactModalState.isOpen}
        title={contactModalState.title}
        message={contactModalState.message}
        type={contactModalState.type}
        onClose={() => setContactModalState({ ...contactModalState, isOpen: false })}
        confirmText="OK"
      />
    </div>
  );
}


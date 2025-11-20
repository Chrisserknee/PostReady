"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your subscription...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID found. Please contact support.');
      return;
    }

    // Call the checkout success endpoint to upgrade the user
    const upgradeUser = async () => {
      try {
        console.log('🎯 Calling checkout-success endpoint with session:', sessionId);
        
        const response = await fetch('/api/checkout-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        console.log('📡 Checkout success response:', data);

        if (response.ok) {
          setStatus('success');
          setMessage('Successfully upgraded to PostReady Pro! 🎉');
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            router.push('/?upgraded=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to upgrade account. Please contact support.');
        }
      } catch (error) {
        console.error('❌ Checkout success error:', error);
        setStatus('error');
        setMessage('An error occurred. Please contact support.');
      }
    };

    upgradeUser();
  }, [searchParams, router]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
      }}
    >
      <div 
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
          border: `2px solid ${
            status === 'success' ? '#10b981' : 
            status === 'error' ? '#ef4444' : 
            'rgba(41, 121, 255, 0.3)'
          }`,
          boxShadow: theme === 'dark'
            ? '0 20px 60px rgba(0, 0, 0, 0.5)'
            : '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="animate-spin w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full" />
          )}
          {status === 'success' && (
            <div className="text-6xl mb-4">✅</div>
          )}
          {status === 'error' && (
            <div className="text-6xl mb-4">❌</div>
          )}
        </div>

        {/* Title */}
        <h1 
          className="text-3xl font-bold mb-4"
          style={{
            color: status === 'success' ? '#10b981' : 
                   status === 'error' ? '#ef4444' : 
                   '#2979FF',
          }}
        >
          {status === 'processing' && 'Processing Payment'}
          {status === 'success' && 'Welcome to Pro!'}
          {status === 'error' && 'Oops!'}
        </h1>

        {/* Message */}
        <p 
          className="text-lg mb-6"
          style={{
            color: theme === 'dark' ? '#e0e0e0' : '#4a4a4a',
          }}
        >
          {message}
        </p>

        {/* Additional Info */}
        {status === 'success' && (
          <div 
            className="p-4 rounded-lg mb-6"
            style={{
              backgroundColor: theme === 'dark' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <p 
              className="text-sm"
              style={{
                color: theme === 'dark' ? '#e0e0e0' : '#4a4a4a',
              }}
            >
              You now have access to all Pro features including unlimited AI generations, advanced tools, and priority support.
            </p>
          </div>
        )}

        {/* Actions */}
        {status === 'success' && (
          <button
            onClick={() => router.push('/?upgraded=true')}
            className="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
              boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)',
            }}
          >
            Start Creating 🚀
          </button>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)',
              }}
            >
              Return Home
            </button>
            <button
              onClick={() => router.push('/portal')}
              className="w-full py-3 rounded-lg font-bold transition-all hover:opacity-80"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: theme === 'dark' ? '#ffffff' : '#000000',
              }}
            >
              Contact Support
            </button>
          </div>
        )}

        {status === 'processing' && (
          <p 
            className="text-sm opacity-60"
            style={{
              color: theme === 'dark' ? '#e0e0e0' : '#4a4a4a',
            }}
          >
            Please don't close this page...
          </p>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}


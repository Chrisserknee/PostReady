"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { AuthModal } from '@/components/AuthModal';

export function Navbar() {
  const { user, isPro, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const signingOutRef = React.useRef(false);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSignOut = useCallback(() => {
    setShowSignOutModal(true);
  }, []);

  const confirmSignOut = useCallback(async () => {
    if (signingOutRef.current) {
      console.log('⚠️ Sign out already in progress, ignoring click');
      return;
    }
    
    signingOutRef.current = true;
    setIsSigningOut(true);
    console.log('🚪 Signing out...');
    
    // Add smooth fade-out effect
    if (typeof document !== 'undefined') {
      document.body.style.transition = 'opacity 0.3s ease-out';
      document.body.style.opacity = '0';
    }
    
    // Wait for fade animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    // Clear all local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    // Redirect
    window.location.href = '/';
  }, []);

  const navigateToPortal = () => {
    router.push('/portal');
  };

  const scrollToPremium = () => {
    router.push('/?premium=true');
  };

  if (authLoading) {
    return null;
  }

  return (
    <>
      <nav className="w-full border-b mb-6" style={{ 
        borderColor: 'var(--card-border)',
        backgroundColor: 'var(--background)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Home Link */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                PostReady
              </span>
            </Link>

            {/* Right side - Auth buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Pro Badge */}
                  {isPro && (
                    <span 
                      className="text-white px-3 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                        boxShadow: '0 0 20px rgba(41, 121, 255, 0.4)'
                      }}
                    >
                      PRO
                    </span>
                  )}
                  
                  {/* Home Button */}
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="px-4 py-2 h-auto rounded-lg text-sm font-semibold"
                  >
                    Home
                  </Button>

                  {/* Account Button */}
                  <Button
                    onClick={navigateToPortal}
                    variant="outline"
                    className="px-4 py-2 h-auto rounded-lg text-sm font-semibold"
                  >
                    Account
                  </Button>

                  {/* Get Pro Button (if not Pro) */}
                  {!isPro && (
                    <Button
                      onClick={scrollToPremium}
                      className="px-4 py-2 h-auto rounded-lg text-sm font-bold text-white border-none"
                      style={{
                        background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                      }}
                    >
                      ★ Get Pro
                    </Button>
                  )}

                  {/* Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    variant="outline"
                    className="px-4 py-2 h-auto rounded-lg text-sm font-semibold text-destructive border-destructive hover:bg-destructive/10"
                  >
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="px-4 py-2 h-auto rounded-lg text-sm font-semibold"
                  >
                    Home
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signin')}
                    variant="outline"
                    className="px-4 py-2 h-auto rounded-lg text-sm font-semibold"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signup')}
                    className="px-4 py-2 h-auto rounded-lg text-sm font-bold text-white border-none"
                    style={{
                      background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                    }}
                  >
                    Sign Up
                  </Button>
                  <Button
                    onClick={() => router.push('/?premium=true')}
                    className="px-4 py-2 h-auto rounded-lg text-sm font-bold text-white border-none"
                    style={{
                      background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                    }}
                  >
                    ★ Get Pro
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
      />

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => {
          setShowSignOutModal(false);
          signingOutRef.current = false;
          setIsSigningOut(false);
        }}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        type="confirm"
        onConfirm={confirmSignOut}
        confirmText="Sign Out"
      />
    </>
  );
}


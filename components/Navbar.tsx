"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { AuthModal } from '@/components/AuthModal';

export function Navbar() {
  const { user, isPro, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isToolPage = pathname?.startsWith('/tools') ?? false;
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
      <nav className="w-full border-b mb-6 overflow-x-hidden" style={{ 
        borderColor: 'var(--card-border)',
        backgroundColor: 'var(--background)'
      }}>
        <div className="max-w-7xl mx-auto px-1 sm:px-3 md:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-0.5 sm:gap-2 min-w-0">
            {/* Logo/Home Link */}
            <Link href="/" className="hidden sm:flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
              <span className="text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                PostReady
              </span>
            </Link>

            {/* Right side - Auth buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-2 lg:gap-3 flex-nowrap justify-end flex-shrink-0">
              {user ? (
                <>
                  {/* Pro Badge */}
                  {isPro && (
                    <span 
                      className="text-white px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 hidden sm:inline-flex"
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
                    variant={isToolPage ? undefined : "outline"}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-2 sm:px-3 md:px-4'} py-2 h-auto min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-xs sm:text-sm'} font-semibold ${isToolPage ? 'bg-[#06B6D4]/20 backdrop-blur-md text-white border border-[#06B6D4]/30 shadow-none sm:hover:bg-[#06B6D4] sm:hover:border-[#06B6D4] drop-shadow-none hover:opacity-90 transition-[background-color,border-color,opacity] duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300' : ''}`}
                  >
                    <span className="relative z-10">Home</span>
                  </Button>

                  {/* Account Button */}
                  <Button
                    onClick={navigateToPortal}
                    variant={isToolPage ? undefined : "outline"}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-2 sm:px-3 md:px-4'} py-2 h-auto min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-xs sm:text-sm'} font-semibold ${isToolPage ? 'bg-[#06B6D4] text-white border-none shadow-none drop-shadow-none hover:opacity-90 transition-[background-color,opacity] duration-300 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : ''}`}
                  >
                    <span className="relative z-10">{isToolPage ? 'Account' : <><span className="hidden sm:inline">Account</span><span className="sm:hidden">Acct</span></>}</span>
                  </Button>

                  {/* Get Pro Button (if not Pro) */}
                  {!isPro && (
                    <Button
                      onClick={scrollToPremium}
                      className={`${isToolPage ? 'px-3 sm:px-4' : 'px-2 sm:px-3 md:px-4'} py-2 h-auto min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-xs sm:text-sm'} font-bold text-white border-none ${isToolPage ? 'bg-[#06B6D4] shadow-none drop-shadow-none hover:opacity-90 transition-[background-color,opacity] duration-300 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : ''}`}
                      style={isToolPage ? {
                        background: '#06B6D4'
                      } : {
                        background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                      }}
                    >
                      <span className="relative z-10">{isToolPage ? 'Get Pro' : <><span className="hidden sm:inline">Get Pro</span><span className="sm:hidden">Pro</span></>}</span>
                    </Button>
                  )}

                  {/* Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    variant={isToolPage ? undefined : "outline"}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-2 sm:px-3 md:px-4'} py-2 h-auto min-h-[44px] rounded-lg ${isToolPage ? 'text-sm' : 'text-xs sm:text-sm'} font-semibold ${isToolPage ? 'bg-[#06B6D4] text-white border-none shadow-none drop-shadow-none hover:opacity-90 transition-[background-color,opacity] duration-300 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : 'text-destructive border-destructive hover:bg-destructive/10'}`}
                  >
                    <span className="relative z-10">{isSigningOut ? '...' : (isToolPage ? 'Sign Out' : <><span className="hidden sm:inline">Sign Out</span><span className="sm:hidden">Out</span></>)}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/')}
                    variant={isToolPage ? undefined : "outline"}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-1 sm:px-2 md:px-3 lg:px-4'} py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-[9px] sm:text-xs md:text-sm'} font-semibold flex-shrink-0 ${isToolPage ? 'bg-[#06B6D4]/20 backdrop-blur-md text-white border border-[#06B6D4]/30 shadow-none sm:hover:bg-[#06B6D4] sm:hover:shadow-[0_0_15px_rgba(6,182,212,0.6),0_0_25px_rgba(6,182,212,0.4)] sm:hover:border-[#06B6D4] drop-shadow-none sm:hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] hover:opacity-90 transition-[background-color,border-color,opacity] duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300' : ''}`}
                  >
                    <span className="relative z-10">
                      <span className="hidden sm:inline">Home</span>
                      <span className="sm:hidden">🏠</span>
                    </span>
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signin')}
                    variant={isToolPage ? undefined : "outline"}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-1 sm:px-2 md:px-3 lg:px-4'} py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-[9px] sm:text-xs md:text-sm'} font-semibold flex-shrink-0 ${isToolPage ? 'bg-[#06B6D4] text-white border-none shadow-none drop-shadow-none hover:opacity-90 transition-[background-color,opacity] duration-300 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : ''}`}
                  >
                    <span className="relative z-10">{isToolPage ? 'Sign In' : <><span className="hidden sm:inline">Sign In</span><span className="sm:hidden">In</span></>}</span>
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signup')}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-1 sm:px-2 md:px-3 lg:px-4'} py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-[9px] sm:text-xs md:text-sm'} font-bold text-white border-none flex-shrink-0 ${isToolPage ? 'bg-[#06B6D4] shadow-none drop-shadow-none hover:opacity-90 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : ''}`}
                    style={isToolPage ? {
                      background: '#06B6D4'
                    } : {
                      background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                    }}
                  >
                    <span className="relative z-10">{isToolPage ? 'Sign Up' : <><span className="hidden sm:inline">Sign Up</span><span className="sm:hidden">Up</span></>}</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/?premium=true')}
                    className={`${isToolPage ? 'px-3 sm:px-4' : 'px-1 sm:px-2 md:px-3 lg:px-4'} py-1 sm:py-2 h-auto min-h-[32px] sm:min-h-[44px] ${isToolPage ? 'rounded-2xl' : 'rounded-lg'} ${isToolPage ? 'text-sm' : 'text-[9px] sm:text-xs md:text-sm'} font-bold text-white border-none flex-shrink-0 ${isToolPage ? 'bg-[#06B6D4] shadow-none drop-shadow-none hover:opacity-90 relative overflow-hidden backdrop-blur-md before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none' : ''}`}
                    style={isToolPage ? {
                      background: '#06B6D4'
                    } : {
                      background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                    }}
                  >
                    <span className="relative z-10">{isToolPage ? 'Get Pro' : <><span className="hidden sm:inline">Get Pro</span><span className="sm:hidden">Pro</span></>}</span>
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


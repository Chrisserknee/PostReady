"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { AuthModal } from '@/components/AuthModal';
import { Crown, Home, User, LogOut } from 'lucide-react';

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
    if (signingOutRef.current) return;
    
    signingOutRef.current = true;
    setIsSigningOut(true);
    
    if (typeof document !== 'undefined') {
      document.body.style.transition = 'opacity 0.3s ease-out';
      document.body.style.opacity = '0';
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    await supabase.auth.signOut();
    
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    window.location.href = '/';
  }, []);

  const navigateToPortal = () => router.push('/portal');
  const scrollToPremium = () => router.push('/?premium=true');
  const navigateHome = () => router.push('/');

  if (authLoading) return null;

  // Consistent button base styles
  const btnBase = "px-4 py-2 h-auto min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";
  const btnOutline = `${btnBase} bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--primary)] hover:bg-[var(--hover-bg)]`;
  const btnPrimary = `${btnBase} bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_30px_rgba(6,182,212,0.4)]`;
  const btnGhost = `${btnBase} bg-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] border border-transparent hover:border-[var(--card-border)]`;
  const btnDanger = `${btnBase} bg-[var(--background-secondary)] text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10`;

  return (
    <>
      <nav className="w-full border-b overflow-x-hidden sticky top-0 z-50 backdrop-blur-md" style={{ 
        borderColor: 'var(--card-border)',
        backgroundColor: 'rgba(10, 15, 26, 0.9)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all duration-300">
                PostReady
              </span>
            </Link>

            {/* Right side - Auth buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Pro Badge */}
                  {isPro && (
                    <span className="badge-pro hidden sm:inline-flex">
                      <Crown className="w-3 h-3" />
                      PRO
                    </span>
                  )}
                  
                  {/* Home Button */}
                  <Button onClick={navigateHome} className={btnOutline}>
                    <Home className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>

                  {/* Account Button */}
                  <Button onClick={navigateToPortal} className={btnOutline}>
                    <User className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>

                  {/* Get Pro Button */}
                  {!isPro && (
                    <Button onClick={scrollToPremium} className={btnPrimary}>
                      <Crown className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Get Pro</span>
                      <span className="sm:hidden">Pro</span>
                    </Button>
                  )}

                  {/* Sign Out Button */}
                  <Button onClick={handleSignOut} disabled={isSigningOut} className={btnDanger}>
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isSigningOut ? '...' : 'Sign Out'}</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Home Button */}
                  <Button onClick={navigateHome} className={btnGhost}>
                    <Home className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>

                  {/* Sign In Button */}
                  <Button onClick={() => openAuthModal('signin')} className={btnOutline}>
                    <span>Sign In</span>
                  </Button>

                  {/* Sign Up Button */}
                  <Button onClick={() => openAuthModal('signup')} className={btnPrimary}>
                    <span>Sign Up</span>
                  </Button>

                  {/* Get Pro Button */}
                  <Button onClick={scrollToPremium} className={`${btnPrimary} hidden sm:flex`}>
                    <Crown className="w-4 h-4 mr-2" />
                    Get Pro
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

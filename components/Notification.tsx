"use client";

import React, { useEffect, useRef } from 'react';

interface NotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const Notification = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  duration = 3000,
}: NotificationProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep onClose reference up to date without triggering effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen && duration > 0) {
      // Use requestAnimationFrame to ensure timer starts after render
      // This helps with iOS Safari timing issues
      requestAnimationFrame(() => {
        timerRef.current = setTimeout(() => {
          onCloseRef.current();
        }, duration);
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, duration]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✨';
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return '💡';
      default:
        return '✨';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
          border: '#6FFFD2',
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
          border: '#F87171',
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
          border: '#FCD34D',
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
          border: '#60A5FA',
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
          border: '#6FFFD2',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className="rounded-xl shadow-lg overflow-hidden max-w-xs"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <span className="text-lg flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-white text-xs mb-0.5 leading-tight">{title}</h3>
            )}
            <p className="text-white text-xs leading-snug">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-all flex-shrink-0 text-xs"
            style={{ fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-0.5 bg-white/20">
            <div
              className="h-full bg-white/60 transition-all"
              style={{
                animation: `shrink ${duration}ms linear`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Add these animations to your globals.css



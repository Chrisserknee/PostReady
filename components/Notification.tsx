"use client";

import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

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
        className="rounded-2xl shadow-2xl overflow-hidden max-w-md"
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div className="p-5 flex items-start gap-4">
          <span className="text-3xl">{getIcon()}</span>
          <div className="flex-1">
            {title && (
              <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
            )}
            <p className="text-white text-sm leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>
        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-1 bg-white/30">
            <div
              className="h-full bg-white transition-all"
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



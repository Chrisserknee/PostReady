"use client";

import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, Zap, X } from 'lucide-react';

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

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen && duration > 0) {
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
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircle2 className={`${iconClass} text-emerald-400`} />;
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <Zap className={`${iconClass} text-amber-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-cyan-400`} />;
      default:
        return <CheckCircle2 className={`${iconClass} text-cyan-400`} />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--card-bg)',
          border: 'rgba(16, 185, 129, 0.4)',
          iconBg: 'rgba(16, 185, 129, 0.15)',
        };
      case 'error':
        return {
          bg: 'var(--card-bg)',
          border: 'rgba(239, 68, 68, 0.4)',
          iconBg: 'rgba(239, 68, 68, 0.15)',
        };
      case 'warning':
        return {
          bg: 'var(--card-bg)',
          border: 'rgba(245, 158, 11, 0.4)',
          iconBg: 'rgba(245, 158, 11, 0.15)',
        };
      case 'info':
        return {
          bg: 'var(--card-bg)',
          border: 'rgba(6, 182, 212, 0.4)',
          iconBg: 'rgba(6, 182, 212, 0.15)',
        };
      default:
        return {
          bg: 'var(--card-bg)',
          border: 'rgba(6, 182, 212, 0.4)',
          iconBg: 'rgba(6, 182, 212, 0.15)',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className="rounded-xl overflow-hidden max-w-sm backdrop-blur-md"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(6, 182, 212, 0.1)',
        }}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          {/* Icon */}
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{ background: styles.iconBg }}
          >
            {getIcon()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {title && (
              <h3 className="font-semibold text-[var(--foreground)] text-sm mb-0.5">{title}</h3>
            )}
            <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">{message}</p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-1 bg-[var(--background-tertiary)]">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
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

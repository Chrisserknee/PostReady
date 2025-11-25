"use client";

import React from 'react';
import { Crown, CheckCircle2, AlertTriangle, Zap, Sparkles, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  title: string;
  message?: string;
  type?: 'info' | 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
  isCreator?: boolean;
  children?: React.ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  isCreator = false,
  children,
}: ModalProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'success':
        return <CheckCircle2 className={`${iconClass} text-emerald-400`} />;
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-400`} />;
      case 'confirm':
        return isCreator ? <Sparkles className={`${iconClass} text-amber-400`} /> : <Zap className={`${iconClass} text-cyan-400`} />;
      default:
        return <Crown className={`${iconClass} text-cyan-400`} />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const isProModal = title.toLowerCase().includes('pro') || title.toLowerCase().includes('upgrade');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        backgroundColor: 'rgba(10, 15, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl max-w-md w-full overflow-hidden animate-scale-in relative"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: isProModal
            ? '0 25px 80px rgba(6, 182, 212, 0.25), 0 0 60px rgba(6, 182, 212, 0.1)'
            : '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-8">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="icon-circle-sm flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-xl font-bold mb-2 text-gradient">
                {title}
              </h3>
              {message && (
                <p className="leading-relaxed whitespace-pre-line text-sm text-[var(--foreground-muted)]">
                  {message}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4 flex gap-3 justify-end"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid var(--card-border)'
          }}
        >
          {(type === 'confirm' || onCancel) && (
            <button
              onClick={() => {
                if (onCancel) onCancel();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                color: 'var(--foreground-muted)',
                backgroundColor: 'var(--background-tertiary)',
                border: '1px solid var(--card-border)'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

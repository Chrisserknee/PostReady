"use client";

import React from 'react';
import { Crown, CheckCircle2, AlertTriangle, Zap, Sparkles, MessageSquare } from 'lucide-react';

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

  // Check if this is a Pro upgrade modal
  const isProModal = title.toLowerCase().includes('pro') || title.toLowerCase().includes('upgrade');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
        style={{
          backgroundColor: 'var(--card-bg, #1a1a2e)',
          border: isProModal 
            ? '1px solid rgba(6, 182, 212, 0.3)' 
            : isCreator && type === 'confirm' 
              ? '1px solid rgba(218, 165, 32, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isProModal
            ? '0 20px 60px rgba(6, 182, 212, 0.2), 0 0 0 1px rgba(6, 182, 212, 0.1)'
            : isCreator && type === 'confirm' 
              ? '0 20px 60px rgba(218, 165, 32, 0.2), 0 0 0 1px rgba(218, 165, 32, 0.1)'
              : '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{
                background: isProModal 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.2))'
                  : isCreator 
                    ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.2), rgba(244, 208, 63, 0.2))'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))'
              }}
            >
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="text-xl font-bold mb-2"
                style={{ 
                  color: isProModal 
                    ? '#06B6D4' 
                    : isCreator && type === 'confirm' 
                      ? '#DAA520' 
                      : 'var(--text-primary, #E7E9EA)' 
                }}
              >
                {title}
              </h3>
              {message && (
                <p 
                  className="leading-relaxed whitespace-pre-line text-sm"
                  style={{ color: 'var(--text-secondary, #9CA3AF)' }}
                >
                  {message}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>

        <div 
          className="px-6 py-4 flex gap-3 justify-end"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {(type === 'confirm' || onCancel) && (
            <button
              onClick={() => {
                if (onCancel) {
                  onCancel();
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ 
                color: 'var(--text-secondary, #9CA3AF)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={
              isProModal
                ? {
                    background: '#06B6D4',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)'
                  }
                : type === 'confirm' && isCreator
                  ? {
                      background: 'linear-gradient(to right, #DAA520, #F4D03F)',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(218, 165, 32, 0.4)'
                    }
                  : {
                      background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                    }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};



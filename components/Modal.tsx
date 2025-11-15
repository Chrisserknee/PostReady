"use client";

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
  isCreator?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  isCreator = false,
}: ModalProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '⚠️';
      case 'confirm':
        return isCreator ? '✨' : '⚡';
      default:
        return '💬';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
        style={isCreator && type === 'confirm' ? {
          border: '2px solid rgba(218, 165, 32, 0.3)',
          boxShadow: '0 20px 60px rgba(218, 165, 32, 0.3), 0 0 0 1px rgba(218, 165, 32, 0.1)'
        } : {
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className="text-4xl mr-4">{getIcon()}</div>
            <div className="flex-1">
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: isCreator && type === 'confirm' ? '#DAA520' : '#111827' }}
              >
                {title}
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              type === 'confirm'
                ? isCreator
                  ? 'text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            style={type === 'confirm' && isCreator ? {
              background: 'linear-gradient(to right, #DAA520, #F4D03F)',
              boxShadow: '0 4px 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
            } : {}}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};



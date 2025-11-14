"use client";

import React from "react";

interface ModeToggleProps {
  mode: 'business' | 'creator';
  onChange: (mode: 'business' | 'creator') => void;
  className?: string;
}

export function ModeToggle({ mode, onChange, className = "" }: ModeToggleProps) {
  return (
    <div className={`flex justify-center mb-8 ${className}`}>
      <div 
        className="relative inline-flex rounded-full p-1 transition-all duration-300"
        style={{ 
          backgroundColor: mode === 'creator' ? 'rgba(218, 165, 32, 0.15)' : 'rgba(41, 121, 255, 0.1)',
          boxShadow: mode === 'creator' 
            ? '0 4px 20px rgba(218, 165, 32, 0.2)' 
            : '0 4px 20px rgba(41, 121, 255, 0.1)',
        }}
      >
        {/* Sliding background pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
          style={{
            left: mode === 'business' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
            backgroundColor: mode === 'creator' ? '#DAA520' : '#2979FF',
            boxShadow: mode === 'creator'
              ? '0 4px 15px rgba(218, 165, 32, 0.4)'
              : '0 4px 15px rgba(41, 121, 255, 0.3)',
          }}
        />
        
        {/* Business Option */}
        <button
          type="button"
          onClick={() => onChange('business')}
          className="relative px-8 py-3 rounded-full font-bold text-base transition-all duration-300 min-w-[140px]"
          style={{
            color: mode === 'business' ? '#FFFFFF' : 'var(--text-secondary)',
            zIndex: 1,
          }}
        >
          🏢 Businesses
        </button>
        
        {/* Creator Option */}
        <button
          type="button"
          onClick={() => onChange('creator')}
          className="relative px-8 py-3 rounded-full font-bold text-base transition-all duration-300 min-w-[140px]"
          style={{
            color: mode === 'creator' ? '#FFFFFF' : 'var(--text-secondary)',
            zIndex: 1,
          }}
        >
          ✨ Creators
        </button>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-110 z-50 group"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '3px solid var(--primary)',
        transition: 'all 0.3s ease, transform 0.2s ease',
      }}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      <div className="relative w-8 h-8">
        {/* Sun Icon for Light Mode */}
        <svg
          className={`absolute inset-0 w-8 h-8 transition-all duration-500 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#FDB813' }}
        >
          {/* Sun center circle */}
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="#FDB813"
            stroke="#FDB813"
            strokeWidth="2"
            className="group-hover:scale-110 transition-transform duration-300"
          />
          {/* Sun rays */}
          <g strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="4" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="12" y1="20" x2="12" y2="22" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="22" y1="12" x2="20" y2="12" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="4" y1="12" x2="2" y2="12" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="18.36" y1="5.64" x2="17.07" y2="6.93" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="6.93" y1="17.07" x2="5.64" y2="18.36" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="18.36" y1="18.36" x2="17.07" y2="17.07" className="origin-center group-hover:scale-110 transition-transform" />
            <line x1="6.93" y1="6.93" x2="5.64" y2="5.64" className="origin-center group-hover:scale-110 transition-transform" />
          </g>
        </svg>

        {/* Moon Icon for Dark Mode */}
        <svg
          className={`absolute inset-0 w-8 h-8 transition-all duration-500 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#FDB813' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            fill="#FDB813"
            stroke="#FDB813"
            className="group-hover:scale-110 transition-transform duration-300"
          />
          {/* Stars around moon */}
          <g fill="#FDB813">
            <circle cx="19" cy="6" r="1" className="animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} />
            <circle cx="17" cy="4" r="0.7" className="animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
            <circle cx="21" cy="9" r="0.7" className="animate-pulse" style={{ animationDelay: '1s', animationDuration: '2.2s' }} />
          </g>
        </svg>
      </div>
    </button>
  );
};

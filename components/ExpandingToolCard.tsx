"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ExpandingToolCardProps {
  toolId: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  icon: string;
  color: string;
  href: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: (e: React.MouseEvent) => void;
  isReorderMode?: boolean;
  order: number;
  dragProps?: any;
}

export function ExpandingToolCard({
  toolId,
  title,
  shortDescription,
  fullDescription,
  features,
  icon,
  color,
  href,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isReorderMode = false,
  order,
  dragProps
}: ExpandingToolCardProps) {
  return (
    <div
      {...dragProps}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
      style={{
        marginBottom: '1rem',
        backgroundColor: 'var(--card-bg)',
        borderColor: isHovered ? color : 'var(--card-border)',
        boxShadow: isHovered
          ? `0 20px 60px ${color}30, 0 0 0 1px ${color}40`
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        order,
        cursor: isReorderMode ? 'move' : 'pointer',
        padding: isHovered ? '1.5rem' : '1rem',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Glow effect */}
      {isHovered && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}

      <Link href={href} className="block" onClick={onClick}>
        {/* Header - Always visible */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl transition-transform duration-500" style={{ 
              transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
            }}>
              {icon}
            </span>
            <div>
              <h3 
                className="text-base sm:text-lg font-bold transition-all duration-500"
                style={{ 
                  color: isHovered ? color : 'var(--secondary)',
                  fontSize: isHovered ? '1.25rem' : '1rem'
                }}
              >
                {title}
              </h3>
              <p 
                className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                style={{ color: 'var(--text-secondary)' }}
              >
                {shortDescription}
              </p>
            </div>
          </div>
          <span 
            className="text-sm opacity-60 transition-all duration-500"
            style={{ 
              color: 'var(--text-secondary)',
              opacity: isHovered ? 0 : 0.6
            }}
          >
            {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
          </span>
        </div>

        {/* Expanded Content - Fades in on hover */}
        <div
          className="overflow-hidden transition-all duration-500"
          style={{
            maxHeight: isHovered ? '500px' : '0px',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div className="pt-4 space-y-4 border-t" style={{ borderColor: `${color}20` }}>
            {/* Full Description */}
            <p 
              className="text-sm leading-relaxed transition-all duration-500 delay-100"
              style={{ 
                color: 'var(--text-secondary)',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
              }}
            >
              {fullDescription}
            </p>

            {/* Features List */}
            <div 
              className="space-y-2 transition-all duration-500 delay-200"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: color }}>
                Key Features
              </p>
              <ul className="space-y-1.5">
                {features.map((feature, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-center gap-2 text-sm"
                    style={{
                      transitionDelay: `${300 + idx * 50}ms`,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
                    }}
                  >
                    <span 
                      className="text-xs font-bold"
                      style={{ color: color }}
                    >
                      ✓
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div 
              className="pt-2 transition-all duration-500 delay-300"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(-5px)',
              }}
            >
              <Button
                className="w-full font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: color,
                  color: 'white',
                  border: 'none',
                }}
              >
                Explore {title} →
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}




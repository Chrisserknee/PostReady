"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

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
      className="rounded-2xl transition-all duration-400 relative group"
      style={{
        marginBottom: '0.75rem',
        backgroundColor: 'var(--card-bg)',
        border: `1px solid ${isHovered ? 'rgba(6, 182, 212, 0.4)' : 'var(--card-border)'}`,
        // Subtle, refined glow - much more subtle than before
        boxShadow: isHovered
          ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(6, 182, 212, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        order,
        cursor: isReorderMode ? 'move' : 'pointer',
        padding: isHovered ? '1.5rem' : '1.25rem',
      }}
    >
      {/* Very subtle gradient overlay on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-400 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, transparent 60%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      <Link href={href} className="block relative z-10" onClick={onClick}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon Container - Rounded with subtle styling */}
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-400 flex-shrink-0"
              style={{
                background: isHovered 
                  ? 'linear-gradient(135deg, var(--primary), var(--secondary))' 
                  : 'var(--background-tertiary)',
                boxShadow: isHovered ? '0 4px 12px rgba(6, 182, 212, 0.2)' : 'none',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span className="text-xl">{icon}</span>
            </div>
            
            <div className="min-w-0">
              <h3 
                className="text-base font-semibold transition-colors duration-300 truncate"
                style={{ 
                  color: isHovered ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                {title}
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] truncate">
                {shortDescription}
              </p>
            </div>
          </div>
          
          <ChevronRight 
            className="w-5 h-5 text-[var(--foreground-subtle)] transition-all duration-300 flex-shrink-0 ml-2"
            style={{
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              opacity: isHovered ? 0 : 0.4,
            }}
          />
        </div>

        {/* Expanded Content */}
        <div
          className="overflow-hidden transition-all duration-400"
          style={{
            maxHeight: isHovered ? '320px' : '0px',
            opacity: isHovered ? 1 : 0,
            marginTop: isHovered ? '1rem' : '0',
          }}
        >
          <div className="pt-4 space-y-4 border-t border-[var(--card-border)]">
            {/* Description */}
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
              {fullDescription}
            </p>

            {/* Features */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                Features
              </p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {features.slice(0, 4).map((feature, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] transition-all duration-300"
                    style={{
                      transitionDelay: `${50 + idx * 30}ms`,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button - Subtle styling */}
            <Button
              className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
            >
              Open {title}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}

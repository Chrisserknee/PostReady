"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface ToolPageLayoutProps {
  title: string;
  description: string;
  icon?: string;
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function ToolPageLayout({
  title,
  description,
  icon,
  children,
  backTo = '/',
  backLabel = 'Back to Home'
}: ToolPageLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Subtle Glow Overlay */}
      <div className="glow-overlay" />
      
      {/* Floating Particles/Stars */}
      <div className="particles-bg">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: `rgba(6, 182, 212, ${Math.random() * 0.4 + 0.2})`,
              boxShadow: `0 0 ${Math.random() * 4 + 2}px rgba(6, 182, 212, ${Math.random() * 0.3 + 0.1})`,
              animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
        {/* Back Button */}
        <Link href={backTo} className="inline-block">
          <Button
            variant="ghost"
            className="mb-6 text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-transparent hover:bg-[var(--hover-bg)] border border-transparent hover:border-[var(--card-border)] transition-all duration-200 rounded-xl group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {backLabel}
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {icon && (
              <div className="icon-circle">
                <span className="text-2xl">{icon}</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient">
              {title}
            </h1>
          </div>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl">
            {description}
          </p>
        </div>

        {/* Tool Content Card */}
        <div className="card-premium p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

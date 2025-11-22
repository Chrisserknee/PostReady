"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Tiny Glowing Stars Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.3})`,
              boxShadow: `0 0 ${Math.random() * 6 + 3}px rgba(255, 255, 255, ${Math.random() * 0.2 + 0.2})`,
              animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 relative" style={{ zIndex: 1 }}>
        {/* Back Button */}
        <Link href={backTo}>
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {icon && <span className="text-4xl">{icon}</span>}
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Tool Content */}
        <Card className="border-2 shadow-lg">
          {children}
        </Card>
      </div>
    </div>
  );
}


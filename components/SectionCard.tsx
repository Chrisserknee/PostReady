import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  isPro?: boolean;
}

export function SectionCard({ children, className = "", isPro = false }: SectionCardProps) {
  return (
    <div 
      className={`rounded-2xl shadow-lg border p-8 space-y-6 transition-all duration-300 ${className} ${
        isPro ? 'hover:shadow-2xl' : ''
      }`}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        ...(isPro && {
          boxShadow: '0 10px 40px rgba(41, 121, 255, 0.08), 0 0 1px rgba(111, 255, 210, 0.1)',
          borderWidth: '2px',
        })
      }}
    >
      {children}
    </div>
  );
}


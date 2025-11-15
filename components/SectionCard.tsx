import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  isPro?: boolean;
}

export function SectionCard({ children, className = "", isPro = false }: SectionCardProps) {
  return (
    <div 
      className={`rounded-2xl shadow-lg border p-8 space-y-6 animate-fade-in ${className}`}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, box-shadow',
        ...(isPro && {
          boxShadow: '0 10px 40px rgba(41, 121, 255, 0.08), 0 0 1px rgba(111, 255, 210, 0.1)',
          borderWidth: '2px',
        })
      }}
      onMouseEnter={(e) => {
        if (isPro) {
          e.currentTarget.style.boxShadow = '0 20px 60px rgba(41, 121, 255, 0.15), 0 0 2px rgba(111, 255, 210, 0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (isPro) {
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(41, 121, 255, 0.08), 0 0 1px rgba(111, 255, 210, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}


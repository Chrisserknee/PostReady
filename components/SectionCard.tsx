import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}


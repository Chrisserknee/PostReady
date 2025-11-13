import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 space-y-4 ${className}`}>
      {children}
    </div>
  );
}


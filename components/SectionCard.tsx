import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  isPro?: boolean;
}

export function SectionCard({ children, className = "", isPro = false }: SectionCardProps) {
  return (
    <div 
      className={cn(
        "card-premium p-6 sm:p-8 animate-fade-in",
        isPro && "border-[var(--primary)]/30 shadow-[0_0_40px_rgba(6,182,212,0.1)]",
        className
      )}
    >
      {children}
    </div>
  );
}

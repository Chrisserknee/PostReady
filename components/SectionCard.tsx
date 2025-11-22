import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  isPro?: boolean;
}

export function SectionCard({ children, className = "", isPro = false }: SectionCardProps) {
  return (
    <Card 
      className={cn(
        "rounded-2xl shadow-lg border p-2 space-y-6 animate-fade-in transition-all duration-300",
        isPro && "border-2 shadow-[0_10px_40px_rgba(41,121,255,0.08)] hover:shadow-[0_20px_60px_rgba(41,121,255,0.15)] hover:-translate-y-0.5",
        className
      )}
      style={{
        willChange: 'transform, box-shadow',
        ...(isPro && {
             borderColor: 'var(--card-border)', // Fallback if needed, though Card uses bg-card
        })
      }}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}


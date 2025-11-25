import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "funny" | "behind_the_scenes" | "educational" | "testimonial" | "offer" | "pro";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border-[var(--card-border)]",
    funny: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    behind_the_scenes: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    educational: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    testimonial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    offer: "bg-red-500/10 text-red-400 border-red-500/30",
    pro: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_0_20px_rgba(6,182,212,0.3)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border transition-all",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}

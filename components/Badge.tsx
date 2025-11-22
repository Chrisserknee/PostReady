import React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "funny" | "behind_the_scenes" | "educational" | "testimonial" | "offer";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-transparent",
    funny: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-transparent",
    behind_the_scenes: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-transparent",
    educational: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-transparent",
    testimonial: "bg-green-100 text-green-700 hover:bg-green-100/80 border-transparent",
    offer: "bg-red-100 text-red-700 hover:bg-red-100/80 border-transparent",
  };

  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "inline-block px-2 py-1 text-xs font-medium rounded-full",
        variantStyles[variant]
      )}
    >
      {children}
    </ShadcnBadge>
  );
}



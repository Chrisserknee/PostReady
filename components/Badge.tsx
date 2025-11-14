import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "funny" | "behind_the_scenes" | "educational" | "testimonial" | "offer";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    funny: "bg-yellow-100 text-yellow-700",
    behind_the_scenes: "bg-purple-100 text-purple-700",
    educational: "bg-blue-100 text-blue-700",
    testimonial: "bg-green-100 text-green-700",
    offer: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}



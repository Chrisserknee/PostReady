import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  isPro?: boolean;
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  isPro = false,
}: PrimaryButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl px-6 py-3 h-auto font-bold transition-all duration-200",
        "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
        "shadow-sm hover:shadow-md",
        "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </Button>
  );
}

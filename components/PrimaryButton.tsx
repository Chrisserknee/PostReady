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
        "rounded-xl px-6 py-3 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 h-auto",
        "bg-[#2979FF] hover:bg-[#1e5dd9] text-white",
        isPro && !disabled && "shadow-[0_4px_20px_rgba(41,121,255,0.3),0_0_40px_rgba(111,255,210,0.1)] hover:shadow-[0_6px_30px_rgba(41,121,255,0.4),0_0_60px_rgba(111,255,210,0.15)]",
        className
      )}
    >
      {children}
    </Button>
  );
}


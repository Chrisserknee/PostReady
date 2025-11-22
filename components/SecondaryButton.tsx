import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: SecondaryButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className={cn(
        "border-2 rounded-xl px-6 py-3 font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 h-auto",
        "bg-background border-[#2979FF] text-[#2979FF] hover:bg-[rgba(41,121,255,0.05)] hover:text-[#2979FF]",
        className
      )}
    >
      {children}
    </Button>
  );
}


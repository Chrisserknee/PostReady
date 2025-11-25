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
        "rounded-xl px-6 py-3 h-auto font-bold transition-all duration-200",
        "bg-[var(--background-secondary)] text-[var(--foreground)]",
        "border border-[var(--card-border)]",
        "hover:border-[var(--primary)] hover:bg-[var(--hover-bg)]",
        "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </Button>
  );
}

import React from "react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`text-white rounded-xl px-6 py-3 font-bold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 ${className}`}
      style={{ backgroundColor: disabled ? undefined : '#2979FF' }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#1e5dd9')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#2979FF')}
    >
      {children}
    </button>
  );
}


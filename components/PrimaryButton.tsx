import React from "react";

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
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`text-white rounded-xl px-6 py-3 font-bold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 ${className}`}
      style={{ 
        backgroundColor: disabled ? undefined : '#2979FF',
        ...(isPro && !disabled && {
          boxShadow: '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)',
        })
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#1e5dd9';
          if (isPro) {
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(41, 121, 255, 0.4), 0 0 60px rgba(111, 255, 210, 0.15)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#2979FF';
          if (isPro) {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)';
          }
        }
      }}
    >
      {children}
    </button>
  );
}


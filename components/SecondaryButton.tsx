import React from "react";

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
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-white border-2 rounded-xl px-6 py-3 font-bold transition-all disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:scale-105 ${className}`}
      style={{ 
        borderColor: disabled ? undefined : '#2979FF',
        color: disabled ? undefined : '#2979FF'
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'rgba(41, 121, 255, 0.05)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'white')}
    >
      {children}
    </button>
  );
}


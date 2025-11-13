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
      className={`bg-white border-2 border-indigo-600 text-indigo-600 rounded-md px-6 py-3 font-medium hover:bg-indigo-50 transition-colors disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}


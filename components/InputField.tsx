import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-card text-foreground border-input focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  );
}


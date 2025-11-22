import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  required = false,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full bg-card text-foreground border-input resize-vertical focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  );
}


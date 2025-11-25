import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[var(--foreground-muted)]">
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} required={required}>
        <SelectTrigger className="w-full h-11 rounded-xl bg-[var(--background-secondary)] text-[var(--foreground)] border-[var(--card-border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)]">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--card-bg)] border-[var(--card-border)] rounded-xl">
          {options.map((option) => (
            <SelectItem 
              key={option} 
              value={option}
              className="rounded-lg focus:bg-[var(--hover-bg)] focus:text-[var(--foreground)]"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

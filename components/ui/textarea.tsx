import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border bg-[var(--background-secondary)] px-4 py-3 text-base transition-all duration-200",
        "border-[var(--card-border)] text-[var(--foreground)]",
        "placeholder:text-[var(--foreground-subtle)]",
        "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-muted)] focus:shadow-[0_0_20px_var(--primary-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

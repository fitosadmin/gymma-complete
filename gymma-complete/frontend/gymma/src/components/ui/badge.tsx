import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

const variants: Record<Variant, string> = {
  primary: "bg-primary-50 text-primary-700",
  secondary: "bg-secondary-50 text-secondary-700",
  success: "bg-secondary-50 text-secondary-700",
  warning: "bg-[#fefce8] text-[#854d0e]",
  error: "bg-[#fef2f2] text-error",
  neutral: "bg-neutral-100 text-neutral-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

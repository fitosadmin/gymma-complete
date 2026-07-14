import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconLeft, iconRight, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 text-neutral-400">{iconLeft}</span>
          )}
          <input
            ref={ref}
            aria-invalid={!!error}
            className={cn(
              "h-11 w-full rounded-sm border bg-white text-body text-neutral-900",
              "placeholder:text-neutral-400",
              "transition-colors focus:outline-none focus-visible:border-primary-500",
              iconLeft ? "pl-10" : "pl-3",
              iconRight ? "pr-10" : "pr-3",
              error ? "border-error" : "border-neutral-200",
              className
            )}
            {...props}
          />
          {iconRight && <span className="absolute right-3 text-neutral-400">{iconRight}</span>}
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

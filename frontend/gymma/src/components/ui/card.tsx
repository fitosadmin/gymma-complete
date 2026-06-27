import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-white shadow-card",
          hover &&
            "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

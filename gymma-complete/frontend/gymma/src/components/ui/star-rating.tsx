"use client";

import * as React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

const px: Record<NonNullable<StarRatingProps["size"]>, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

export interface StarRatingProps {
  value: number; // 0–5
  size?: "sm" | "md" | "lg";
  /** When set, renders clickable stars and reports the chosen value. */
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({ value, size = "md", onChange, className }: StarRatingProps) {
  const dim = px[size];
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const interactive = !!onChange;

  return (
    <div className={cn("inline-flex items-center", className)} role={interactive ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const half = i === full && hasHalf;
        const star = filled ? (
          <Star width={dim} height={dim} className="fill-rating text-rating" />
        ) : half ? (
          <StarHalf width={dim} height={dim} className="fill-rating text-rating" />
        ) : (
          <Star width={dim} height={dim} className="text-neutral-300" />
        );

        if (!interactive) return <span key={i}>{star}</span>;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1} star${i ? "s" : ""}`}
            onClick={() => onChange?.(i + 1)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

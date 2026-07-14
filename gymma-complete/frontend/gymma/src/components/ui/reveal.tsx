"use client";

import * as React from "react";
import { m, LazyMotion, domAnimation, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  /** Delay in seconds (useful for stagger patterns). */
  delay?: number;
  /** Rise distance in px (default 16). */
  y?: number;
  /** Duration in seconds (default 0.6). */
  duration?: number;
  /** Additional class names on the wrapper. */
  className?: string;
  /** Render as a specific element. Default: div. */
  as?: "div" | "section" | "li" | "span";
}

/**
 * Scroll-triggered reveal wrapper built on framer-motion.
 * Fades in + rises once when the element enters the viewport.
 * Automatically degrades to instant render when prefers-reduced-motion is set.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.6,
  className,
  as = "div",
}: RevealProps) {
  const prefersReduced = useReducedMotion();

  const MotionTag = m[as];

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <LazyMotion features={domAnimation}>
      <MotionTag
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1], // --ease-out
        }}
        className={className}
      >
        {children}
      </MotionTag>
    </LazyMotion>
  );
}

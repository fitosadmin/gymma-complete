"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

/** Shown when the gym API is unreachable (e.g. Render cold start, 30-60s).
    Friendly retry screen — never a raw stack trace. */
export default function GymError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-32 text-center">
      <span className="text-4xl" aria-hidden>🏋️</span>
      <h1 className="text-2xl font-bold text-neutral-900">Warming up the machines…</h1>
      <p className="text-sm leading-relaxed text-neutral-500">
        Our gym data service is taking a moment to wake up. It usually responds
        within a minute — try again shortly.
      </p>
      <button
        onClick={() => reset()}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
      >
        <RefreshCw size={15} aria-hidden /> Try again
      </button>
      <Link href="/explore" className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900">
        Back to explore
      </Link>
    </div>
  );
}

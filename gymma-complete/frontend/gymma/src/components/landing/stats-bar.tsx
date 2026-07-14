"use client";

import * as React from "react";
import { PLATFORM_STATS } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";

/** Animated stat that counts up when visible. */
function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="text-center">
        <p className="text-h2 text-neutral-900">{value}</p>
        <p className="mt-1 text-body-sm text-neutral-500">{label}</p>
      </div>
    </Reveal>
  );
}

export function StatsBar() {
  return (
    <section className="border-y border-neutral-200 bg-surface-subtle">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
        {PLATFORM_STATS.map((s, i) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

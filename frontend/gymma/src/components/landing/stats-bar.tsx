import * as React from "react";
import { PLATFORM_STATS } from "@/lib/api";

export function StatsBar() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-8 sm:grid-cols-4">
        {PLATFORM_STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-semibold text-neutral-900">{s.value}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

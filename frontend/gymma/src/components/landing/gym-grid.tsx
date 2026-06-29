"use client";

import * as React from "react";
import type { GymSummary } from "@/types/gym";
import { GymCard } from "@/components/gym/gym-card";
import { Reveal } from "@/components/ui/reveal";

export function GymGrid({ gyms }: { gyms: GymSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {gyms.map((g, i) => (
        <Reveal key={g.id} delay={i * 0.06} y={20}>
          <GymCard gym={g} priority={i === 0} />
        </Reveal>
      ))}
    </div>
  );
}

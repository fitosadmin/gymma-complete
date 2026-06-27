import * as React from "react";
import { ArrowRight } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymCardCompact } from "@/components/gym/gym-card-compact";

export function FeaturedRow({ title, gyms }: { title: string; gyms: GymSummary[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h4 text-neutral-900">{title}</h3>
        <button className="inline-flex items-center gap-1 text-button font-semibold text-primary-600 hover:text-primary-700">
          See all
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {gyms.map((g) => (
          <div key={g.id} className="snap-start">
            <GymCardCompact gym={g} />
          </div>
        ))}
      </div>
    </section>
  );
}

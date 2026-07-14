import * as React from "react";
import { Clock } from "lucide-react";
import type { GymClass } from "@/types/gym";

export function ClassesList({ classes }: { classes: GymClass[] }) {
  return (
    <section>
      <h2 className="text-h3 text-neutral-900">Classes</h2>
      <div className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-md border border-neutral-200">
        {classes.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-body font-medium text-neutral-900">{c.name}</p>
              <p className="mt-0.5 text-body-sm text-neutral-500">
                {c.schedule} · with {c.trainerName}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-body-sm text-neutral-500">
              <Clock className="h-4 w-4" />
              {c.durationMin} min
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

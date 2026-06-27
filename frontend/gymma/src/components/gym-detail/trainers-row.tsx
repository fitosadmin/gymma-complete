import * as React from "react";
import type { Trainer } from "@/types/gym";
import { formatINR } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TrainersRow({ trainers }: { trainers: Trainer[] }) {
  return (
    <section>
      <h2 className="text-h3 text-neutral-900">Trainers</h2>
      <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
        {trainers.map((t) => (
          <div key={t.id} className="w-40 shrink-0 rounded-md border border-neutral-200 bg-white p-3">
            <div className="flex aspect-square w-full items-center justify-center rounded-md bg-gradient-to-br from-primary-100 to-secondary-100 text-h3 font-bold text-primary-700">
              {initials(t.name)}
            </div>
            <p className="mt-2 truncate text-body-sm font-semibold text-neutral-900">{t.name}</p>
            <p className="mt-0.5 text-caption text-neutral-500">
              {t.yearsExperience} yrs exp · {t.languages.join(", ")}
            </p>
            <p className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-700">
              {t.specialization}
            </p>
            <p className="mt-2 text-body-sm font-semibold text-neutral-900">
              {formatINR(t.pricePerSession)}
              <span className="font-normal text-neutral-500">/session</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

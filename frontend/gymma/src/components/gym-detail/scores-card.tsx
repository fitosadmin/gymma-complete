import * as React from "react";
import type { CategoryScores } from "@/types/gym";

const LABELS: { key: keyof CategoryScores; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "equipment", label: "Equipment" },
  { key: "trainers", label: "Trainers" },
  { key: "value", label: "Value" },
  { key: "crowd", label: "Crowd" },
];

export function ScoresCard({ scores }: { scores: CategoryScores }) {
  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {LABELS.map(({ key, label }) => {
        const v = scores[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-body-sm text-neutral-600">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-neutral-900" style={{ width: `${(v / 5) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-body-sm font-semibold text-neutral-900">{v.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

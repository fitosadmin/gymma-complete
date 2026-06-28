"use client";

import * as React from "react";
import Link from "next/link";
import { Star, Check, Minus, X, Plus, GitCompare } from "lucide-react";
import type { GymDetail, CategoryScores } from "@/types/gym";
import { GymImage } from "@/components/gym/gym-image";
import { formatINR, formatDistance, cn } from "@/lib/utils";

const MAX = 4;

const SCORE_ROWS: { key: keyof CategoryScores; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "equipment", label: "Equipment" },
  { key: "trainers", label: "Trainers" },
  { key: "value", label: "Value" },
  { key: "crowd", label: "Crowd" },
];

function YesNo({ on }: { on: boolean }) {
  return on ? (
    <Check className="h-4 w-4 text-secondary-600" />
  ) : (
    <Minus className="h-4 w-4 text-neutral-300" />
  );
}

export function CompareTool({ gyms }: { gyms: GymDetail[] }) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() => gyms.slice(0, 3).map((g) => g.id));

  const selected = selectedIds
    .map((id) => gyms.find((g) => g.id === id))
    .filter(Boolean) as GymDetail[];
  const remaining = gyms.filter((g) => !selectedIds.includes(g.id));

  const minPrice = Math.min(...selected.map((g) => g.pricePerMonth));
  const maxRating = Math.max(...selected.map((g) => g.rating));

  const add = (id: string) => setSelectedIds((s) => (s.length < MAX ? [...s, id] : s));
  const remove = (id: string) => setSelectedIds((s) => s.filter((x) => x !== id));

  const AddPicker = remaining.length > 0 && selected.length < MAX && (
    <select
      value=""
      onChange={(e) => e.target.value && add(e.target.value)}
      className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-500 focus:outline-none focus-visible:border-primary-500"
      aria-label="Add a gym to compare"
    >
      <option value="">+ Add a gym…</option>
      {remaining.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name} - {g.area}
        </option>
      ))}
    </select>
  );

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <GitCompare className="h-6 w-6" />
        </span>
        <p className="text-body text-neutral-600">Add gyms to start comparing them side by side.</p>
        {AddPicker}
      </div>
    );
  }

  const cols = `minmax(140px,180px) repeat(${selected.length}, minmax(180px,1fr))`;
  const cell = "border-b border-neutral-100 px-4 py-3 text-sm";
  const label = cn(cell, "sticky left-0 z-10 bg-white font-medium text-neutral-500");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Comparing {selected.length} of {MAX} gyms
        </p>
        {AddPicker}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <div className="grid min-w-max" style={{ gridTemplateColumns: cols }}>
          {/* Header */}
          <div className="sticky left-0 z-10 border-b border-neutral-200 bg-white px-4 py-4" />
          {selected.map((g) => (
            <div key={g.id} className="relative border-b border-l border-neutral-100 p-4">
              <button
                onClick={() => remove(g.id)}
                aria-label={`Remove ${g.name}`}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-neutral-400 shadow-sm transition-colors hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
              <GymImage name={g.name} src={g.coverImage} className="aspect-video w-full rounded-lg" />
              <h3 className="mt-3 text-sm font-semibold leading-snug text-neutral-900">{g.name}</h3>
              <p className="text-caption text-neutral-500">{g.area}, {g.city}</p>
            </div>
          ))}

          {/* Price */}
          <div className={label}>Monthly price</div>
          {selected.map((g) => (
            <div key={g.id} className={cn(cell, "border-l")}>
              <span className={cn("font-semibold text-neutral-900", g.pricePerMonth === minPrice && "rounded-md bg-secondary-50 px-1.5 py-0.5 text-secondary-700")}>
                {formatINR(g.pricePerMonth)}
              </span>
              <span className="text-neutral-400">/mo</span>
            </div>
          ))}

          {/* Rating */}
          <div className={label}>Rating</div>
          {selected.map((g) => (
            <div key={g.id} className={cn(cell, "border-l")}>
              <span className={cn("inline-flex items-center gap-1 font-semibold text-neutral-900", g.rating === maxRating && "rounded-md bg-secondary-50 px-1.5 py-0.5 text-secondary-700")}>
                <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                {g.rating.toFixed(1)}
              </span>
            </div>
          ))}

          {/* Reviews */}
          <div className={label}>Reviews</div>
          {selected.map((g) => (
            <div key={g.id} className={cn(cell, "border-l text-neutral-700")}>{g.reviewCount}</div>
          ))}

          {/* Distance */}
          <div className={label}>Distance</div>
          {selected.map((g) => (
            <div key={g.id} className={cn(cell, "border-l text-neutral-700")}>{formatDistance(g.distanceKm) ?? "-"}</div>
          ))}

          {/* Booleans */}
          {([
            ["Open now", (g: GymDetail) => g.isOpenNow],
            ["Premium", (g: GymDetail) => g.isPremium],
            ["Women friendly", (g: GymDetail) => g.womenFriendly],
            ["Parking", (g: GymDetail) => g.hasParking],
          ] as const).map(([rowLabel, get]) => (
            <React.Fragment key={rowLabel}>
              <div className={label}>{rowLabel}</div>
              {selected.map((g) => (
                <div key={g.id} className={cn(cell, "border-l")}>
                  <YesNo on={get(g)} />
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Scores */}
          {SCORE_ROWS.map(({ key, label: rowLabel }) => (
            <React.Fragment key={key}>
              <div className={label}>{rowLabel}</div>
              {selected.map((g) => (
                <div key={g.id} className={cn(cell, "border-l")}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-neutral-900" style={{ width: `${(g.scores[key] / 5) * 100}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-caption font-medium text-neutral-700">{g.scores[key].toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Amenities */}
          <div className={cn(label, "self-start")}>Amenities</div>
          {selected.map((g) => (
            <div key={g.id} className={cn(cell, "border-l")}>
              <div className="flex flex-wrap gap-1.5">
                {g.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{a}</span>
                ))}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className={cn(label, "border-b-0")} />
          {selected.map((g) => (
            <div key={g.id} className="border-l border-neutral-100 px-4 py-4">
              <Link
                href={`/gym/${g.slug}`}
                className="inline-flex w-full items-center justify-center rounded-md bg-ink py-2 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      </div>

      {selected.length < MAX && (
        <p className="flex items-center gap-1.5 text-sm text-neutral-400">
          <Plus className="h-4 w-4" /> You can compare up to {MAX} gyms at once.
        </p>
      )}
    </div>
  );
}

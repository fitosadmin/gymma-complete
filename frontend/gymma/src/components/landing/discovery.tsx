"use client";

import * as React from "react";
import { List, Map as MapIcon } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymCard } from "@/components/gym/gym-card";
import { GymMap } from "@/components/map/gym-map";
import { sortGyms, type SortKey } from "@/lib/api";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "price_asc", label: "Price: Low → High" },
];

export function Discovery({ gyms, heading = "Gyms near you" }: { gyms: GymSummary[]; heading?: string }) {
  const [sort, setSort] = React.useState<SortKey>("relevance");
  const [selectedId, setSelectedId] = React.useState<string>();
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");

  const sorted = React.useMemo(() => sortGyms(gyms, sort), [gyms, sort]);

  return (
    <section id="discovery" className="bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[55%_45%]">
          {/* LIST PANE */}
          <div className={cn(mobileView === "map" && "hidden lg:block")}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-h3 text-neutral-900">{heading}</h2>
              <label className="flex items-center gap-2 text-body-sm text-neutral-500">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-sm border border-neutral-200 bg-white px-3 py-2 text-body-sm font-medium text-neutral-900 focus:outline-none focus-visible:border-primary-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-5">
              {sorted.map((gym, i) => (
                <div key={gym.id} onMouseEnter={() => setSelectedId(gym.id)}>
                  <GymCard gym={gym} priority={i === 0} />
                </div>
              ))}
            </div>
          </div>

          {/* MAP PANE */}
          <div className={cn(mobileView === "list" && "hidden lg:block")}>
            <div className="lg:sticky lg:top-20">
              <GymMap
                gyms={sorted}
                selectedId={selectedId}
                onSelect={setSelectedId}
                className="h-[420px] w-full lg:h-[calc(100vh-7rem)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LIST/MAP TOGGLE (floating segmented control) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center lg:hidden">
        <div className="pointer-events-auto inline-flex rounded-full bg-neutral-900 p-1 shadow-lg">
          {(["list", "map"] as const).map((view) => {
            const Icon = view === "list" ? List : MapIcon;
            return (
              <button
                key={view}
                onClick={() => setMobileView(view)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-button font-semibold capitalize transition-colors",
                  mobileView === view ? "bg-white text-neutral-900" : "text-neutral-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {view}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { Search, MapPin, LayoutGrid, Map as MapIcon, ChevronDown, Loader2, Navigation } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymCard } from "@/components/gym/gym-card";
import { GymRow } from "@/components/search/gym-row";
import { GymMap } from "@/components/map/gym-map";
import { sortGyms, type SortKey } from "@/lib/api";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "price_asc", label: "Price: Low → High" },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: "< 1 km" },
  { value: 3, label: "1–3 km" },
  { value: 5, label: "3–5 km" },
  { value: 10, label: "5–10 km" },
  { value: 0, label: "Any" },
] as const;

const PRICE_OPTIONS = [
  { value: "budget", label: "Budget (< ₹1,500)", min: 0, max: 1500 },
  { value: "mid", label: "Mid-range (₹1,500–₹3,000)", min: 1500, max: 3000 },
  { value: "premium", label: "Premium (₹3,000+)", min: 3000, max: Infinity },
] as const;

type Status = "open" | "closed" | null;
type PriceKey = (typeof PRICE_OPTIONS)[number]["value"] | null;
type View = "grid" | "map";

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200 py-5">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
      )}
    >
      {children}
    </button>
  );
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export function SearchExperience({
  gyms,
  initialQuery = "",
  locationLabel = "Bengaluru, Karnataka",
}: {
  gyms: GymSummary[];
  initialQuery?: string;
  locationLabel?: string;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [applied, setApplied] = React.useState(initialQuery);
  const [sort, setSort] = React.useState<SortKey>("relevance");
  const [view, setView] = React.useState<View>("grid");
  const [selectedId, setSelectedId] = React.useState<string>();

  // Location logic
  const [locationObj, setLocationObj] = React.useState<{ lat: number; lng: number } | null>(() => {
    if (locationLabel && /^-?\d+\.\d+,-?\d+\.\d+$/.test(locationLabel)) {
      const [lat, lng] = locationLabel.split(',').map(Number);
      return { lat, lng };
    }
    return null;
  });
  const [locationStatus, setLocationStatus] = React.useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [displayLocation, setDisplayLocation] = React.useState(locationLabel);

  // If locationLabel is lat,lng, we should also try to reverse geocode it to get a nice name on mount
  React.useEffect(() => {
    if (locationLabel && /^-?\d+\.\d+,-?\d+\.\d+$/.test(locationLabel)) {
      const [lat, lng] = locationLabel.split(',').map(Number);
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.address) {
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.village || "";
            const city = data.address.city || data.address.town || "Bengaluru";
            setDisplayLocation(suburb ? `${suburb}, ${city}` : city);
          }
        })
        .catch(() => {});
    }
  }, [locationLabel]);

  // Filters
  const [status, setStatus] = React.useState<Status>(null);
  const [womenOnly, setWomenOnly] = React.useState(false);
  const [distance, setDistance] = React.useState<number>(0);
  const [price, setPrice] = React.useState<PriceKey>(null);

  // Reset when initialQuery changes (e.g. clicking 'Discover')
  React.useEffect(() => {
    setQuery(initialQuery);
    setApplied(initialQuery);
    setStatus(null);
    setWomenOnly(false);
    setDistance(0);
    setPrice(null);
    setSort("relevance");
    setLocationStatus("idle");
    
    if (locationLabel && /^-?\d+\.\d+,-?\d+\.\d+$/.test(locationLabel)) {
      const [lat, lng] = locationLabel.split(',').map(Number);
      setLocationObj({ lat, lng });
    } else {
      setLocationObj(null);
      setDisplayLocation(locationLabel);
    }
  }, [initialQuery, locationLabel]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.village || "";
            const city = data.address?.city || data.address?.town || "Bengaluru";
            label = suburb ? `${suburb}, ${city}` : city;
          }
        } catch {}
        setLocationObj({ lat, lng });
        setDisplayLocation(label);
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied")
    );
  }

  const filtered = React.useMemo(() => {
    const q = applied.trim().toLowerCase();
    let list = gyms.filter((g) => {
      if (q && !(`${g.name} ${g.area} ${g.city}`.toLowerCase().includes(q))) return false;
      if (status === "open" && !g.isOpenNow) return false;
      if (status === "closed" && g.isOpenNow) return false;
      if (womenOnly && !g.womenFriendly) return false;
      if (distance > 0 && (g.distanceKm ?? Infinity) > distance) return false;
      if (price) {
        const band = PRICE_OPTIONS.find((p) => p.value === price)!;
        if (g.pricePerMonth < band.min || g.pricePerMonth > band.max) return false;
      }
      return true;
    });
    return sortGyms(list, sort);
  }, [gyms, applied, status, womenOnly, distance, price, sort]);

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* ===== TOP CONTROL BAR ===== */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          {/* Location pill */}
          <button
            onClick={requestLocation}
            disabled={locationStatus === "loading"}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-neutral-200 px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary-400 hover:text-primary-600 disabled:opacity-60 text-neutral-700"
          >
            {locationStatus === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : locationStatus === "granted" ? (
              <Navigation className="h-4 w-4 text-primary-500" />
            ) : (
              <MapPin className="h-4 w-4 text-primary-500" />
            )}
            <span className="max-w-[12rem] truncate">
              {locationStatus === "loading" ? "Locating…" : displayLocation}
            </span>
            {locationStatus === "denied" && (
              <span className="ml-auto text-xs text-red-500">Denied</span>
            )}
          </button>

          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setApplied(query)}
              placeholder="Search gyms..."
              className="w-full rounded-md border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus-visible:border-primary-500"
            />
          </div>

          {/* Search button */}
          <button
            onClick={() => setApplied(query)}
            className="shrink-0 rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-hover"
          >
            Search
          </button>

          {/* View toggle */}
          <div className="inline-flex shrink-0 rounded-md border border-neutral-200 p-0.5">
            {([
              { v: "grid" as View, Icon: LayoutGrid },
              { v: "map" as View, Icon: MapIcon },
            ]).map(({ v, Icon }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={v === "grid" ? "Grid view" : "Map view"}
                className={cn(
                  "flex h-9 w-10 items-center justify-center rounded-[5px] transition-colors",
                  view === v ? "bg-ink text-white" : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BODY: SIDEBAR + RESULTS ===== */}
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        {/* ----- FILTERS SIDEBAR ----- */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <h2 className="text-lg font-bold text-neutral-900">Filters</h2>

          <FilterSection title="Status">
            <div className="flex flex-wrap gap-2">
              <Chip active={status === "open"} onClick={() => setStatus(status === "open" ? null : "open")}>
                Open
              </Chip>
              <Chip active={status === "closed"} onClick={() => setStatus(status === "closed" ? null : "closed")}>
                Closed
              </Chip>
            </div>
          </FilterSection>

          <FilterSection title="Women Friendly">
            <label className="flex cursor-pointer items-center gap-3">
              <button
                role="switch"
                aria-checked={womenOnly}
                onClick={() => setWomenOnly((v) => !v)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  womenOnly ? "bg-ink" : "bg-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    womenOnly ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </button>
              <span className="text-sm text-neutral-600">Only show women-friendly gyms</span>
            </label>
          </FilterSection>

          <FilterSection title="Distance">
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((d) => (
                <Chip key={d.label} active={distance === d.value} onClick={() => setDistance(d.value)}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="flex flex-col gap-2">
              {PRICE_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPrice(price === p.value ? null : p.value)}
                  className={cn(
                    "rounded-md border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    price === p.value
                      ? "border-ink bg-ink text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FilterSection>
        </aside>

        {/* ----- RESULTS ----- */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-base text-neutral-900">
              <span className="font-bold">{filtered.length}</span>{" "}
              <span className="text-neutral-500">gym{filtered.length === 1 ? "" : "s"} found</span>
            </p>

            <label className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="hidden sm:inline">Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none rounded-md border border-neutral-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-900 focus:outline-none focus-visible:border-primary-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
            </label>
          </div>

          {view === "grid" ? (
            filtered.length > 0 ? (
              <div className="flex flex-col">
                {(() => {
                  const groupsMap = new Map<string, { area: string; gyms: GymSummary[]; minDist: number }>();
                  filtered.forEach(gym => {
                    if (!groupsMap.has(gym.area)) {
                      groupsMap.set(gym.area, { area: gym.area, gyms: [], minDist: Infinity });
                    }
                    const group = groupsMap.get(gym.area)!;
                    group.gyms.push(gym);
                    
                    if (locationObj) {
                      const dist = getDistance(locationObj.lat, locationObj.lng, gym.lat, gym.lng);
                      if (dist < group.minDist) {
                        group.minDist = dist;
                      }
                    }
                  });

                  let groups = Array.from(groupsMap.values());
                  
                  if (locationObj) {
                    groups.sort((a, b) => a.minDist - b.minDist);
                  } else {
                    groups.sort((a, b) => b.gyms.length - a.gyms.length || a.area.localeCompare(b.area));
                  }

                  groups = groups.slice(0, 6);

                  return groups.map((g) => (
                    <GymRow key={g.area} title={`Gyms in ${g.area}`} gyms={g.gyms} />
                  ));
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
                <p className="text-base font-semibold text-neutral-900">No gyms match your filters</p>
                <p className="mt-1 text-sm text-neutral-500">Try widening the distance or clearing the price range.</p>
              </div>
            )
          ) : (
            <GymMap
              gyms={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="h-[calc(100vh-12rem)] w-full overflow-hidden rounded-xl border border-neutral-200"
            />
          )}
        </div>
      </div>
    </div>
  );
}

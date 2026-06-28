"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, Navigation, Loader2 } from "lucide-react";
import { MOCK_GYMS } from "@/lib/mock-data";

const RECENT_KEY = "gymma:recent-searches";
const TAGS = ["Near me", "Open now", "Budget", "With pool", "24/7 access", "Women's section"];

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export function Hero({ onLocationChange }: { onLocationChange?: (loc: UserLocation) => void }) {
  const router = useRouter();
  const [location, setLocation] = React.useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = React.useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [debounced, setDebounced] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode using nominatim (free, no key)
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
        const loc = { lat, lng, label };
        setLocation(loc);
        setLocationStatus("granted");
        onLocationChange?.(loc);
      },
      () => setLocationStatus("denied")
    );
  }

  const suggestions = React.useMemo(() => {
    if (debounced.length < 2) return [];
    const q = debounced.toLowerCase();
    return MOCK_GYMS.filter((g) => g.name.toLowerCase().includes(q) || g.area.toLowerCase().includes(q)).slice(0, 5);
  }, [debounced]);

  function submit(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 10);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    const locParam = location ? `${location.lat},${location.lng}` : "Bengaluru";
    router.push(`/search?q=${encodeURIComponent(t)}&location=${encodeURIComponent(locParam)}`);
  }

  const showDrop = focused && (suggestions.length > 0 || (query.length < 2 && recent.length > 0));

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:pt-20">
      <div className="max-w-3xl">
        <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-caption font-semibold text-primary-700">
          India&apos;s most trusted gym discovery platform
        </span>

        <h1 className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-6xl">
          Find your
          <br />
          <span className="text-primary-500">perfect</span> gym.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
          Discover, compare, and join gyms near you. Real photos, honest ratings, and transparent pricing - all in one place.
        </p>

        {/* Search */}
        <div className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
          {/* Location button */}
          <button
            onClick={requestLocation}
            disabled={locationStatus === "loading"}
            className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm transition-colors hover:border-primary-400 hover:text-primary-600 disabled:opacity-60"
            style={{ minWidth: "180px" }}
          >
            {locationStatus === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : locationStatus === "granted" ? (
              <Navigation className="h-4 w-4 text-primary-500" />
            ) : (
              <MapPin className="h-4 w-4 text-neutral-400" />
            )}
            <span className="truncate text-left text-neutral-700">
              {locationStatus === "loading"
                ? "Locating…"
                : location
                ? location.label
                : "Use my location"}
            </span>
            {locationStatus === "denied" && (
              <span className="ml-auto text-xs text-red-500">Denied</span>
            )}
          </button>

          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => e.key === "Enter" && submit(query)}
              placeholder="Gym name, area, or amenity"
              aria-label="Search gyms"
              className="h-12 w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
            />
            {showDrop && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg">
                {suggestions.length > 0
                  ? suggestions.map((g) => (
                      <button
                        key={g.id}
                        onMouseDown={() => submit(g.name)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                      >
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-900">{g.name}</span>
                        <span className="ml-auto text-caption text-neutral-400">{g.area}</span>
                      </button>
                    ))
                  : recent.map((r) => (
                      <button
                        key={r}
                        onMouseDown={() => submit(r)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                      >
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700">{r}</span>
                      </button>
                    ))}
              </div>
            )}
          </div>

          <button
            onClick={() => submit(query || "gyms near me")}
            className="h-12 shrink-0 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
          >
            Search gyms
          </button>
        </div>

        {/* Quick tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => submit(tag)}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-caption text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

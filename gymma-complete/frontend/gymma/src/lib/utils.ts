import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "h4", "body", "body-sm", "caption", "button"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ₹2,500 — Indian grouping, no decimals (spec is India-first, INR). */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "1.2 km away" / "850 m away" */
export function formatDistance(km?: number): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/** Parses "HH:MM:SS" into minutes since midnight. */
function parseTimeStr(t?: string): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/** Returns true if current local time is between opensAt and closesAt. */
export function checkIsOpenNow(opensAt?: string, closesAt?: string, fallback: boolean = true): boolean {
  if (!opensAt || !closesAt) return fallback;
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  
  const openMins = parseTimeStr(opensAt);
  const closeMins = parseTimeStr(closesAt);
  
  if (openMins === null || closeMins === null) return fallback;
  
  if (closeMins < openMins) {
    // Overnight gym (e.g. 05:00 to 01:00)
    return currentMins >= openMins || currentMins <= closeMins;
  }
  return currentMins >= openMins && currentMins <= closeMins;
}

/** Formats "14:30:00" -> "2:30 PM" */
export function formatTimeShort(t?: string): string | null {
  if (!t) return null;
  const mins = parseTimeStr(t);
  if (mins === null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

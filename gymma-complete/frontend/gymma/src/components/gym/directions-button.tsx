"use client";

import * as React from "react";
import { Navigation } from "lucide-react";

export function DirectionsButton({ mapsUrl }: { mapsUrl: string }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(mapsUrl, "_blank");
      }}
      aria-label="Get directions"
      className="rounded-md border border-neutral-200 px-3 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
    >
      <Navigation className="h-4 w-4" />
    </button>
  );
}

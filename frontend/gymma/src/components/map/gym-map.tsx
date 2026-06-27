"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { cn } from "@/lib/utils";

const LeafletMap = dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
      <MapPin className="h-5 w-5 animate-pulse" />
    </div>
  ),
});

export interface GymMapProps {
  gyms: GymSummary[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
}

export function GymMap({ gyms, selectedId, onSelect, className, userLocation }: GymMapProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-neutral-200", className)}>
      <LeafletMap gyms={gyms} selectedId={selectedId} onSelect={onSelect} userLocation={userLocation} />
    </div>
  );
}

"use client";

import * as React from "react";
import { GymMap } from "@/components/map/gym-map";
import { SectionHeader } from "@/components/landing/section-header";
import { MOCK_GYMS } from "@/lib/mock-data";

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export function MapPreview({ userLocation }: { userLocation?: UserLocation | null }) {
  return (
    <section className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-20">
      <SectionHeader eyebrow="On the map" title="Explore gyms nearby" cta="Open full map" href="/search" />
      <GymMap
        gyms={MOCK_GYMS}
        className="h-[440px] w-full"
        userLocation={userLocation ?? null}
      />
    </section>
  );
}

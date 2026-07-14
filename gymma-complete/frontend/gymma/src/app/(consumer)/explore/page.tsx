"use client";

import * as React from "react";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { SectionHeader } from "@/components/landing/section-header";
import { GymGrid } from "@/components/landing/gym-grid";
import { MapPreview } from "@/components/landing/map-preview";
import { WhyChooseUs } from "@/components/landing/why-choose-us";
import { OwnerCTA } from "@/components/landing/owner-cta";
import { ContactSection } from "@/components/landing/contact-section";
import { GymGridSkeleton } from "@/components/ui/skeleton";
import { getFeatured } from "@/lib/api";
import type { GymSummary } from "@/types/gym";

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}
interface FeaturedGymsResponse {
  topRated: GymSummary[];
  nearby: GymSummary[];
  affordable: GymSummary[];
}

export default function ExplorePage() {
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [f, setF] = React.useState<FeaturedGymsResponse | null>(null);

  React.useEffect(() => {
    getFeatured().then(setF).catch(console.error);
  }, []);

  return (
    <>
      <Hero onLocationChange={setUserLocation} />
      <StatsBar />

      {/* Map moved above all gym sections */}
      <MapPreview userLocation={userLocation} />

      {/* Top rated — first section, white bg */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeader eyebrow="Editor's pick" title="Top rated gyms" cta="View all" href="/search?sort=rating" />
        {f ? <GymGrid gyms={f.topRated} /> : <GymGridSkeleton />}
      </section>

      {/* Nearby — subtle background for rhythm */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeader eyebrow="Closest to you" title="Gyms nearby" cta="See more" href="/search?sort=distance" />
          {f ? <GymGrid gyms={f.nearby} /> : <GymGridSkeleton />}
        </div>
      </section>

      {/* Affordable — back to white */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeader eyebrow="Best value" title="Affordable gyms" cta="See all" href="/search?sort=price_asc" />
        {f ? <GymGrid gyms={f.affordable} /> : <GymGridSkeleton />}
      </section>

      <WhyChooseUs />

      <OwnerCTA />
      <ContactSection />
    </>
  );
}

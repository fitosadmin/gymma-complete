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
import { getFeatured } from "@/lib/api";

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export default function ExplorePage() {
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [f, setF] = React.useState<any>(null);

  React.useEffect(() => {
    getFeatured().then(setF).catch(console.error);
  }, []);

  if (!f) {
    return <div className="flex h-screen items-center justify-center">Loading gyms...</div>;
  }

  return (
    <>
      <Hero onLocationChange={setUserLocation} />
      <StatsBar />

      {/* Map moved above all gym sections */}
      <MapPreview userLocation={userLocation} />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeader eyebrow="Editor's pick" title="Top rated gyms" cta="View all" href="/search?sort=rating" />
        <GymGrid gyms={f.topRated} />
      </section>

      <section className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-20">
        <SectionHeader eyebrow="Closest to you" title="Gyms nearby" cta="See more" href="/search?sort=distance" />
        <GymGrid gyms={f.nearby} />
      </section>

      <section className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-20">
        <SectionHeader eyebrow="Best value" title="Affordable gyms" cta="See all" href="/search?sort=price_asc" />
        <GymGrid gyms={f.affordable} />
      </section>

      <WhyChooseUs />

      <OwnerCTA />
      <ContactSection />
    </>
  );
}

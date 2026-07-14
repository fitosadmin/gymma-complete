import * as React from "react";
import type { Metadata } from "next";
import { CompareTool } from "@/components/compare/compare-tool";
import { getAllGymDetails } from "@/lib/api";

export const metadata: Metadata = {
  title: "Compare gyms",
  description: "Put gyms side by side on price, rating, amenities, and category scores before you decide.",
};

export default async function ComparePage() {
  const gyms = await getAllGymDetails();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="mb-1 text-caption font-semibold uppercase tracking-widest text-neutral-500">Decide with confidence</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Compare gyms</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Put gyms side by side on price, rating, amenities, and category scores. The best price and rating in each
          comparison are highlighted.
        </p>
      </header>

      <CompareTool gyms={gyms} />
    </div>
  );
}

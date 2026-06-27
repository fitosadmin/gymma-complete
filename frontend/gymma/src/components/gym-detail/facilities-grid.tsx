import * as React from "react";
import type { Amenity } from "@/types/gym";
import { amenityIcon } from "@/lib/amenity-icons";

export function FacilitiesGrid({ amenities }: { amenities: Amenity[] }) {
  return (
    <section>
      <h2 className="text-h3 text-neutral-900">Facilities &amp; equipment</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((a) => {
          const Icon = amenityIcon(a);
          return (
            <div
              key={a}
              className="flex items-center gap-2.5 rounded-md border border-neutral-200 bg-white px-3 py-2.5"
            >
              <Icon className="h-5 w-5 text-neutral-700" />
              <span className="text-body-sm text-neutral-700">{a}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

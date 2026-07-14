import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymImage } from "@/components/gym/gym-image";
import { formatINR } from "@/lib/utils";

export function GymCardCompact({ gym }: { gym: GymSummary }) {
  return (
    <div
      className="group relative block w-[280px] shrink-0 overflow-hidden rounded-lg bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <GymImage name={gym.name} src={gym.coverImage} className="aspect-[4/3] w-full" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 text-body font-semibold text-neutral-900">
            <Link href={`/gym/${gym.slug}`} className="focus:outline-none after:absolute after:inset-0">
              {gym.name}
            </Link>
          </h4>
          <span className="flex shrink-0 items-center gap-0.5 text-body-sm font-semibold text-neutral-900">
            <Star className="h-3.5 w-3.5 fill-rating text-rating" />
            {gym.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-body-sm text-neutral-500">
          {gym.area}, {gym.city}
        </p>
        <p className="mt-2 text-body font-semibold text-neutral-900">
          {formatINR(gym.pricePerMonth)}
          <span className="text-body-sm font-normal text-neutral-500">/mo</span>
        </p>
      </div>
    </div>
  );
}

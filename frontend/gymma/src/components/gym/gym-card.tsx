import * as React from "react";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymImage } from "@/components/gym/gym-image";
import { DirectionsButton } from "@/components/gym/directions-button";
import { formatINR, formatDistance, cn, checkIsOpenNow, formatTimeShort } from "@/lib/utils";

export interface GymCardProps {
  gym: GymSummary;
  /** First card above the fold should set this for LCP (spec §10). */
  priority?: boolean;
  className?: string;
}

export function GymCard({ gym, priority, className }: GymCardProps) {
  const distance = formatDistance(gym.distanceKm);
  const shown = gym.amenities.slice(0, 3);
  const more = gym.amenities.length - shown.length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`;

  const localIsOpen = React.useMemo(() => checkIsOpenNow(gym.opensAt, gym.closesAt, gym.isOpenNow), [gym.opensAt, gym.closesAt, gym.isOpenNow]);
  const closesAtFormatted = formatTimeShort(gym.closesAt);
  const opensAtFormatted = formatTimeShort(gym.opensAt);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        <GymImage
          name={gym.name}
          src={gym.coverImage}
          priority={priority}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-caption font-medium shadow-sm">
          <span
            className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", localIsOpen ? "bg-secondary-500" : "bg-neutral-400")}
          />
          <span className={localIsOpen ? "text-secondary-700" : "text-neutral-500"}>
            {localIsOpen
              ? closesAtFormatted ? `Open · Closes ${closesAtFormatted}` : "Open"
              : opensAtFormatted ? `Closed · Opens ${opensAtFormatted}` : "Closed"}
          </span>
        </span>
        {gym.isPremium && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-caption font-medium text-white">
            Premium
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug text-neutral-900 group-hover:text-neutral-700">
            <Link href={`/gym/${gym.slug}`} className="focus:outline-none after:absolute after:inset-0">
              {gym.name}
            </Link>
          </h3>
          <span className="flex shrink-0 items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-rating text-rating" />
            <span className="text-sm font-semibold text-neutral-900">{gym.rating.toFixed(1)}</span>
            <span className="text-caption text-neutral-400">({gym.reviewCount})</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm text-neutral-500">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {gym.area}
              {distance && <span className="text-neutral-400"> · {distance.replace(" away", "")}</span>}
            </span>
          </span>
          <span className="shrink-0 font-medium text-neutral-900">
            {formatINR(gym.pricePerMonth)}
            <span className="font-normal text-neutral-400">/mo</span>
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {shown.map((a) => (
            <span key={a} className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">
              {a}
            </span>
          ))}
          {more > 0 && <span className="text-caption text-neutral-400">+{more} more</span>}
        </div>

        <div className="relative z-10 mt-auto flex gap-2 border-t border-neutral-100 pt-3">
          <Link href={`/gym/${gym.slug}`} className="flex-1 rounded-md bg-ink py-2 text-center text-sm font-medium text-white transition-colors group-hover:bg-ink-hover">
            View details
          </Link>
          <DirectionsButton mapsUrl={mapsUrl} />
        </div>
      </div>
    </div>
  );
}

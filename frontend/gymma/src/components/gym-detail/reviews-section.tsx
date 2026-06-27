"use client";

import * as React from "react";
import { Star, ThumbsUp } from "lucide-react";
import type { Review, CategoryScores } from "@/types/gym";
import { ScoresCard } from "@/components/gym-detail/scores-card";

type Filter = "recent" | "helpful" | "highest" | "lowest";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "helpful", label: "Most Helpful" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export function ReviewsSection({
  reviews,
  rating,
  reviewCount,
  scores,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  scores: CategoryScores;
}) {
  const [filter, setFilter] = React.useState<Filter>("recent");

  // 5→1 star distribution from the loaded reviews
  const dist = React.useMemo(() => {
    const d = [0, 0, 0, 0, 0]; // index 0 = 5 stars
    reviews.forEach((r) => {
      const bucket = 5 - Math.round(r.rating);
      if (d[bucket] !== undefined) d[bucket]++;
    });
    return d;
  }, [reviews]);
  const maxBar = Math.max(1, ...dist);

  const sorted = React.useMemo(() => {
    const copy = [...reviews];
    switch (filter) {
      case "helpful":
        return copy.sort((a, b) => b.helpfulCount - a.helpfulCount);
      case "highest":
        return copy.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return copy.sort((a, b) => a.rating - b.rating);
      case "recent":
      default:
        return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [reviews, filter]);

  return (
    <section>
      <h2 className="text-h3 text-neutral-900">Reviews &amp; ratings</h2>

      {/* Summary */}
      <div className="mt-4 grid gap-6 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center sm:border-r sm:border-neutral-200 sm:pr-6">
          <span className="text-display font-bold text-neutral-900">{rating.toFixed(1)}</span>
          <div className="mt-1 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={i < Math.round(rating) ? "h-4 w-4 fill-rating text-rating" : "h-4 w-4 text-neutral-300"}
              />
            ))}
          </div>
          <span className="mt-1 text-body-sm text-neutral-500">{reviewCount} reviews</span>
        </div>

        <div className="space-y-1.5">
          {dist.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 text-caption text-neutral-500">{5 - i}</span>
              <Star className="h-3 w-3 fill-rating text-rating" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full rounded-full bg-rating" style={{ width: `${(count / maxBar) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category scores */}
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-5">
        <ScoresCard scores={scores} />
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-body-sm text-neutral-500">{reviews.length} member reviews</span>
        <label className="flex items-center gap-2 text-body-sm text-neutral-500">
          Sort
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="rounded-sm border border-neutral-200 bg-white px-3 py-2 text-body-sm font-medium text-neutral-900 focus:outline-none focus-visible:border-primary-500"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {sorted.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < Math.round(r.rating) ? "h-3.5 w-3.5 fill-rating text-rating" : "h-3.5 w-3.5 text-neutral-300"}
                />
              ))}
            </div>
            <p className="mt-2 text-body text-neutral-700">{r.body}</p>
            <div className="mt-2 flex items-center gap-3 text-caption text-neutral-400">
              <span className="font-medium text-neutral-500">Verified Member</span>
              <span>·</span>
              <span>{timeAgo(r.createdAt)}</span>
              <span className="ml-auto inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful ({r.helpfulCount})
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import * as React from "react";
import { MapPin, Star, ShieldCheck, Users, GitCompare, Award, BadgeCheck, BarChart3 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   ITEMS DATA
───────────────────────────────────────────────────────────────────────────── */
const ITEMS = [
  {
    icon: MapPin,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "GPS-powered discovery",
    desc: "Find gyms near home, work, or anywhere. Filter by distance, price, and amenities.",
    showRatingBadges: false,
  },
  {
    icon: Star,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Verified reviews & Gymma rating",
    desc: "Verified reviews from real members on cleanliness, trainers, equipment, and value - plus a Gymma rating that aggregates quality signals into a single trusted score.",
    showRatingBadges: true,
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Transparent pricing",
    desc: "See membership plans upfront. No hidden fees, no guesswork - just clear info.",
    showRatingBadges: false,
  },
  {
    icon: Users,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Detailed profiles",
    desc: "Trainer backgrounds, equipment, gallery, class schedules, and FAQs in one place.",
    showRatingBadges: false,
  },
  {
    icon: GitCompare,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Compare side by side",
    desc: "Shortlist gyms and compare them on the parameters that matter before deciding.",
    showRatingBadges: false,
  },
  {
    icon: Award,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    title: "Curated lists",
    desc: "Browse Top Rated, Trending, Nearby, and Affordable collections, updated regularly.",
    showRatingBadges: false,
  },
];

function RatingBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <BadgeCheck className="h-3.5 w-3.5" />
        Verified
      </span>
      <span className="text-xs text-neutral-400">+</span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
        <BarChart3 className="h-3.5 w-3.5" />
        Gymma Rating
      </span>
    </div>
  );
}

export function WhyChooseUs() {
  return (
    <section id="about" className="border-t border-neutral-200 bg-neutral-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* ── Header ── */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Why Gymma</p>
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900">
            Everything you need to choose the right gym.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
            Discover gyms smarter with trusted reviews, clear info,
            <br className="hidden sm:block" />
            and tools that help you make the best choice.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ icon: Icon, iconBg, iconColor, title, desc, showRatingBadges }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-sm transition-all duration-200 hover:border-primary-400 hover:ring-1 hover:ring-primary-400"
              style={{ minHeight: "220px" }}
            >
              <div className="flex flex-col gap-4 p-6">
                {/* Icon badge */}
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </span>

                {/* Title */}
                <h3 className="text-base font-bold text-neutral-900">{title}</h3>

                {/* Rating badges */}
                {showRatingBadges && <RatingBadges />}

                {/* Description */}
                <p className="text-sm leading-relaxed text-neutral-500">
                  {showRatingBadges ? (
                    <>
                      Verified reviews from real members on cleanliness, trainers, equipment, and value - plus a{" "}
                      <span className="font-semibold text-primary-600">Gymma rating</span> that aggregates quality signals into a single trusted score.
                    </>
                  ) : (
                    desc
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

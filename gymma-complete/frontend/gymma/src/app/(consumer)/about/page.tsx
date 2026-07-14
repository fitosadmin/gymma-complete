import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Star, ShieldCheck, Users, Target, Heart, Zap, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About Gymma — India's Gym Discovery Platform",
  description: "Gymma helps people across India find, compare, and join the right gym with verified reviews, transparent pricing, and real photos.",
};

const STATS = [
  { value: "500+", label: "Gyms listed" },
  { value: "50,000+", label: "Active members" },
  { value: "4.7★", label: "Average rating" },
  { value: "40+", label: "Cities" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Transparency first",
    desc: "We show you real pricing, real photos, and real reviews — no hidden fees, no paid rankings. Every gym is listed on its own merits.",
  },
  {
    icon: Star,
    title: "Honest reviews",
    desc: "Reviews on Gymma are verified. Only people who've actually visited or been members can leave ratings, so you know what you're reading is real.",
  },
  {
    icon: Users,
    title: "Community-driven",
    desc: "Our ratings are built by the fitness community — people who care about the same things you do: cleanliness, equipment quality, trainer expertise, and value.",
  },
  {
    icon: Zap,
    title: "Fast decisions",
    desc: "We give you every data point upfront — scores by category, side-by-side comparisons, gallery photos — so you can make the right choice without wasting time.",
  },
];

const TEAM = [
  { initials: "DK", name: "Dhanush K", role: "Founder & CEO", color: "from-primary-400 to-primary-600" },
  { initials: "AS", name: "Arjun S", role: "Head of Product", color: "from-secondary-400 to-secondary-600" },
  { initials: "PR", name: "Priya R", role: "Head of Growth", color: "from-blue-400 to-blue-600" },
  { initials: "VM", name: "Vikram M", role: "Lead Engineer", color: "from-purple-400 to-purple-600" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "We source gym data",
    desc: "Our team sources gym listings from across India — verifying addresses, photos, pricing, amenities, and trainer credentials before anything goes live.",
  },
  {
    step: "02",
    title: "Real members review",
    desc: "Only verified gym-goers can leave reviews. We score each gym across five dimensions: cleanliness, equipment, trainers, value, and crowd levels.",
  },
  {
    step: "03",
    title: "Gymma rating is computed",
    desc: "Beyond raw star scores, we compute a Gymma Rating that weighs recency, volume, and category scores to give you a single reliable signal.",
  },
  {
    step: "04",
    title: "You make the right call",
    desc: "Compare gyms side by side, filter by what matters to you, check schedules and plans — then walk into any gym with full confidence.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-700">
            About Gymma
          </span>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-neutral-900">
            We help India find the
            <br />
            <span className="text-primary-500">right gym.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
            Gymma is India's most trusted gym discovery platform. We believe finding a gym should be as easy as booking a hotel — with real photos, honest ratings, and transparent pricing all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Find a gym near you
            </Link>
            <Link
              href="/explore#contact"
              className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-500"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-neutral-100 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-bold text-neutral-900">{value}</p>
                <p className="mt-1 text-sm text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Our mission</p>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Making fitness accessible through better information.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-neutral-500">
                Millions of people across India want to start or level up their fitness journey, but choosing the wrong gym — one with outdated equipment, poor hygiene, or misleading pricing — can set them back months.
              </p>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Gymma exists to solve that. We aggregate the data that matters — verified reviews, accurate pricing, real photos — and present it in a way that helps you make a confident decision in minutes, not weeks.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary-500" />
                <span className="text-sm font-medium text-neutral-700">Built in Bengaluru, for India.</span>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Our vision</p>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                A gym in every neighbourhood, trusted by everyone.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-neutral-500">
                We're building towards a future where every gym in India — from a boutique studio in Indiranagar to a budget gym in Yelahanka — has a verified, accurate, and up-to-date presence on Gymma.
              </p>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                And where every person looking for a gym can find one they love, close to home, at a price that works for them — without second-guessing a single decision.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary-500" />
                <span className="text-sm font-medium text-neutral-700">Expanding to 100+ cities by 2027.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">The Gymma difference</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4">
                <span className="text-4xl font-bold text-neutral-200">{step}</span>
                <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">What we stand for</p>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Our values</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mb-2 text-base font-bold text-neutral-900">{title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">The team</p>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Built by fitness enthusiasts</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
              We're a small team of engineers, designers, and fitness people who got tired of finding gyms the hard way.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {TEAM.map(({ initials, name, role, color }) => (
              <div key={name} className="flex flex-col items-center gap-3 text-center">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-2xl font-bold text-white shadow-sm`}>
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{name}</p>
                  <p className="text-sm text-neutral-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-neutral-100 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Target className="mx-auto mb-6 h-10 w-10 text-primary-500" />
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Ready to find your gym?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
            Over 500 gyms across Bengaluru and growing. Start your search today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="rounded-xl bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Discover gyms
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-neutral-300 px-8 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-500"
            >
              Compare gyms
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

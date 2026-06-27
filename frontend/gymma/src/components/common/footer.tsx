import * as React from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

const COLUMNS: Record<string, { label: string; href: string }[]> = {
  Discover: [
    { label: "Find a gym", href: "/search" },
    { label: "Compare gyms", href: "/compare" },
    { label: "Top rated", href: "/search?sort=rating" },
    { label: "Budget gyms", href: "/search?sort=price_asc" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/explore#contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/explore" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm">
                <Dumbbell className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold lowercase tracking-tight text-neutral-900">gymma</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              India&apos;s gym discovery platform. Find, compare, and join gyms near you.
            </p>
            <p className="mt-4 text-xs text-neutral-400">© 2026 Gymma. All rights reserved.</p>
          </div>

          {Object.entries(COLUMNS).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-900">{group}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-6 sm:flex-row">
          <p className="max-w-2xl text-xs text-neutral-400">
            Ratings and reviews are submitted by users. Visit gyms personally before purchasing a membership.
          </p>
          <span className="text-xs text-neutral-400">Made in India 🧡</span>
        </div>
      </div>
    </footer>
  );
}

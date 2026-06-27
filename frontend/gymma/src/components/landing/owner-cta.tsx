import * as React from "react";
import Link from "next/link";
import { TrendingUp, Zap, ArrowRight } from "lucide-react";

export function OwnerCTA() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-ink px-8 py-14 sm:px-10 md:flex-row">
          <div>
            <span className="text-caption font-semibold uppercase tracking-widest text-neutral-400">For gym owners</span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Grow your gym.
              <br />
              Retain more members.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
              Get a free auto-generated profile page and member-engagement tools — at a fraction of typical market costs.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-secondary-500" /> Free marketing exposure
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-secondary-500" /> Member engagement app
              </span>
            </div>
          </div>
          <Link
            href="/partner-with-us"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Partner with us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

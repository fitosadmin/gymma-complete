"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { MembershipPlan } from "@/types/gym";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { useInquiry } from "@/components/gym-detail/inquiry";
import { cn } from "@/lib/utils";

export function PlansSection({ plans }: { plans: MembershipPlan[] }) {
  const { open } = useInquiry();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <section>
      <h2 className="text-h3 text-neutral-900">Membership plans</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {plans.map((p) => {
          const isHighlighted = hoveredId ? hoveredId === p.id : p.recommended;

          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "relative flex flex-col rounded-lg bg-white p-5 transition-all duration-200",
                isHighlighted ? "border-2 border-primary-500 shadow-card scale-[1.02]" : "border border-neutral-200"
              )}
            >
              {p.recommended && (
                <span className="absolute -top-3 left-5 rounded-full bg-primary-500 px-3 py-1 text-caption font-semibold text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-h4 text-neutral-900">{p.name}</h3>
                <span className="text-body-sm text-neutral-500">
                  {p.durationMonths} {p.durationMonths === 1 ? "month" : "months"}
                </span>
              </div>
              <p className="mt-2 text-h2 font-bold text-neutral-900">{formatINR(p.price)}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {p.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-body-sm text-neutral-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
                    {b}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-5 transition-colors"
                fullWidth
                variant={isHighlighted ? "primary" : "secondary"}
                onClick={() => open(p.name)}
              >
                Join now
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-caption text-neutral-400">
        Inquiry only — no payment is taken here. The gym confirms your plan directly.
      </p>
    </section>
  );
}

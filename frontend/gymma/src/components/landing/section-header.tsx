"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function SectionHeader({
  eyebrow,
  title,
  cta,
  href,
}: {
  eyebrow: string;
  title: string;
  cta?: string;
  href?: string;
}) {
  return (
    <Reveal>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-2 text-caption font-semibold uppercase tracking-widest text-primary-500">{eyebrow}</p>
          <h2 className="text-h2 tracking-tight text-neutral-900">{title}</h2>
        </div>
        {cta && href && (
          <Link
            href={href}
            className="hidden items-center gap-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 sm:flex"
          >
            {cta} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}

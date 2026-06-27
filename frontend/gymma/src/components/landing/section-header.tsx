import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
    <div className="mb-8 flex items-end justify-between">
      <div>
        <p className="mb-1 text-caption font-semibold uppercase tracking-widest text-neutral-500">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h2>
      </div>
      {cta && href && (
        <Link
          href={href}
          className="hidden items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900 sm:flex"
        >
          {cta} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

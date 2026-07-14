"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export function AboutSection({
  description,
  yearsOperating,
  certifications,
}: {
  description: string;
  yearsOperating: number;
  certifications: string[];
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <section>
      <h2 className="text-h3 text-neutral-900">About</h2>
      <p className={expanded ? "mt-3 text-body text-neutral-600" : "mt-3 line-clamp-3 text-body text-neutral-600"}>
        {description}
      </p>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-1 text-button font-semibold text-primary-600 hover:text-primary-700"
      >
        {expanded ? "Read less" : "Read more"}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{yearsOperating} years operating</Badge>
        {certifications.map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
      </div>
    </section>
  );
}

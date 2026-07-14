"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-neutral-200 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
      {items.map((it) => {
        const isOpen = openId === it.id;
        return (
          <div key={it.id}>
            <button
              onClick={() => setOpenId(isOpen ? null : it.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
            >
              <span className="text-body font-medium text-neutral-900">{it.title}</span>
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 text-neutral-400 transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && <div className="px-4 pb-4 text-body-sm leading-relaxed text-neutral-600">{it.content}</div>}
          </div>
        );
      })}
    </div>
  );
}

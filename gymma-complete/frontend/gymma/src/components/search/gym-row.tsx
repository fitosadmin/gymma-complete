"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GymSummary } from "@/types/gym";
import { GymCard } from "@/components/gym/gym-card";

export function GymRow({ title, gyms }: { title: string; gyms: GymSummary[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 10);
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  if (gyms.length === 0) return null;

  return (
    <div className="mb-10 group relative w-full">
      <h3 className="mb-4 text-h4 font-bold text-neutral-900 px-1">{title}</h3>
      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all sm:-left-5 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {gyms.map((gym, i) => (
            <div key={gym.id} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
              <GymCard gym={gym} priority={i < 3} />
            </div>
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all sm:-right-5 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}

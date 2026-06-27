"use client";

import * as React from "react";
import { Phone, Navigation, Share2, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/components/gym-detail/inquiry";
import { cn } from "@/lib/utils";

function useShareSave() {
  const [saved, setSaved] = React.useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else await navigator.clipboard.writeText(location.href);
    } catch {
      /* user dismissed */
    }
  };
  return { saved, toggleSave: () => setSaved((s) => !s), share };
}

/** Desktop action row in the hero (spec §5.4.1). */
export function HeroActions({ mapsUrl }: { mapsUrl: string }) {
  const { open } = useInquiry();
  const { saved, toggleSave, share } = useShareSave();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => open()}>
        <Phone className="h-4 w-4" />
        Contact
      </Button>
      <a href={mapsUrl} target="_blank" rel="noreferrer">
        <Button variant="secondary">
          <Navigation className="h-4 w-4" />
          Directions
        </Button>
      </a>
      <Button variant="ghost" size="sm" onClick={share} aria-label="Share">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleSave} aria-label="Save">
        {saved ? <BookmarkCheck className="h-4 w-4 text-primary-600" /> : <Bookmark className="h-4 w-4" />}
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}

/** Fixed bottom bar on mobile (spec §5.4.11). */
export function BottomBar({ mapsUrl }: { mapsUrl: string }) {
  const { open } = useInquiry();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 shadow-lg lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="secondary" fullWidth>
            <Navigation className="h-4 w-4" />
            Directions
          </Button>
        </a>
        <Button className={cn("flex-1")} onClick={() => open()}>
          <Phone className="h-4 w-4" />
          Contact
        </Button>
      </div>
    </div>
  );
}

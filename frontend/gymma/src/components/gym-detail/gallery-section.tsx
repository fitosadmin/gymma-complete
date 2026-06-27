"use client";

import * as React from "react";
import { GymImage } from "@/components/gym/gym-image";
import { Lightbox } from "@/components/ui/lightbox";

export function GallerySection({
  gymName,
  slug,
  gallery,
}: {
  gymName: string;
  slug: string;
  gallery: string[];
}) {
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-h3 text-neutral-900">Gallery</h2>
        <button
          onClick={() => setLightbox(0)}
          className="text-button font-semibold text-primary-600 hover:text-primary-700"
        >
          View all
        </button>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
        {gallery.map((entry, i) => {
          const isUrl = entry.startsWith("http");
          const caption = isUrl ? `Photo ${i + 1}` : entry;
          return (
            <button
              key={`${slug}-${i}`}
              onClick={() => setLightbox(i)}
              className="group relative shrink-0 snap-start overflow-hidden rounded-lg"
              aria-label={`Open ${caption}`}
            >
              <GymImage name={gymName} src={isUrl ? entry : undefined} seed={`${slug}-${i}`} className="h-40 w-60" />
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-left text-caption font-medium text-white">
                {caption}
              </span>
            </button>
          );
        })}
      </div>

      {lightbox !== null && (
        <Lightbox
          gymName={gymName}
          slug={slug}
          gallery={gallery}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { GymImage } from "@/components/gym/gym-image";

export interface LightboxProps {
  gymName: string;
  slug: string;
  gallery: string[]; // category captions; images are placeholders for now
  startIndex: number;
  onClose: () => void;
}

export function Lightbox({ gymName, slug, gallery, startIndex, onClose }: LightboxProps) {
  const [mounted, setMounted] = React.useState(false);
  const [i, setI] = React.useState(startIndex);
  const prev = React.useCallback(() => setI((p) => (p - 1 + gallery.length) % gallery.length), [gallery.length]);
  const next = React.useCallback(() => setI((p) => (p + 1) % gallery.length), [gallery.length]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-black/90">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-body-sm text-white/80">
          {gallery[i]?.startsWith("http") ? `Photo ${i + 1}` : gallery[i]} · {i + 1}/{gallery.length}
        </span>
        <button onClick={onClose} aria-label="Close" className="rounded-sm p-1 hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-10">
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <GymImage
          name={gymName}
          src={gallery[i]?.startsWith("http") ? gallery[i] : undefined}
          seed={`${slug}-${i}`}
          className="aspect-video w-full max-w-3xl rounded-lg"
        />
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>,
    document.body
  );
}

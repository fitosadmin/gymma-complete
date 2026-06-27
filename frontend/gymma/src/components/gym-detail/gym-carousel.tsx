"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function GymCarousel({ images, name }: { images: string[]; name: string }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [prevIndex, setPrevIndex] = React.useState<number | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [mode, setMode] = React.useState<"slide" | "fade">("slide");

  const inlineTrackRef = React.useRef<HTMLDivElement>(null);
  const fullTrackRef = React.useRef<HTMLDivElement>(null);

  // ── The ONLY function that ever touches transform on the track ─────────────
  // React's render never sets transform — only this function does.
  const setTrackPosition = React.useCallback(
    (el: HTMLDivElement | null, index: number, withTransition: boolean) => {
      if (!el) return;
      el.style.transition = withTransition
        ? "transform 0.52s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      el.style.transform = `translateX(-${index * (100 / images.length)}%)`;
    },
    [images.length]
  );

  // Set initial position on mount (index 0, no transition)
  React.useEffect(() => {
    setTrackPosition(inlineTrackRef.current, 0, false);
    setTrackPosition(fullTrackRef.current, 0, false);
  }, [setTrackPosition]);

  // Slide track on user navigation
  React.useEffect(() => {
    if (mode !== "slide") return;
    setTrackPosition(inlineTrackRef.current, currentIndex, true);
    setTrackPosition(fullTrackRef.current, currentIndex, true);
  }, [currentIndex, mode, setTrackPosition]);

  // Auto-play — fade mode
  React.useEffect(() => {
    if (isHovered || isFullScreen || images.length <= 1) return;
    const timer = setInterval(() => {
      setMode("fade");
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % images.length;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [isHovered, isFullScreen, images.length]);

  // After fade: snap track silently, clear prev
  React.useEffect(() => {
    if (mode !== "fade") return;
    // Snap without transition — track is hidden under the crossfade overlay
    setTrackPosition(inlineTrackRef.current, currentIndex, false);
    setTrackPosition(fullTrackRef.current, currentIndex, false);
    const timeout = setTimeout(() => setPrevIndex(null), 750);
    return () => clearTimeout(timeout);
  }, [currentIndex, mode, setTrackPosition]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = (index: number) => {
    setMode("slide");
    setPrevIndex(null);
    setCurrentIndex(index);
  };

  const paginate = (dir: 1 | -1) => {
    goTo((currentIndex + dir + images.length) % images.length);
  };

  // ── Touch / drag ───────────────────────────────────────────────────────────
  const dragStartX = React.useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { dragStartX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 40) paginate(delta < 0 ? 1 : -1);
    dragStartX.current = null;
  };

  if (images.length === 0) return null;

  // ── Shared track styles — NO transform here, ever ─────────────────────────
  const trackStyle: React.CSSProperties = {
    width: `${images.length * 100}%`,
    willChange: "transform",
    // transform is set imperatively by setTrackPosition only
  };

  const slideStyle = (i: number): React.CSSProperties => ({
    width: `${100 / images.length}%`,
  });

  return (
    <>
      {/* ── Inline carousel ── */}
      <div
        className="relative aspect-[16/7] w-full overflow-hidden sm:rounded-xl bg-neutral-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Track — transform never in JSX */}
        <div ref={inlineTrackRef} className="absolute inset-0 flex" style={trackStyle}>
          {images.map((src, i) => (
            <div key={src} className="relative h-full flex-shrink-0" style={slideStyle(i)}>
              <Image
                src={src}
                alt={`${name} photo ${i + 1}`}
                fill
                priority={i <= 1}
                className="object-cover select-none"
                sizes="(max-width:768px) 100vw, 860px"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Crossfade overlay — old image fades out, new image already on track */}
        <AnimatePresence>
          {mode === "fade" && prevIndex !== null && (
            <motion.div
              key={`fade-${prevIndex}`}
              className="absolute inset-0 z-10 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              <Image
                src={images[prevIndex]}
                alt={`${name} photo ${prevIndex + 1}`}
                fill
                className="object-cover select-none"
                sizes="(max-width:768px) 100vw, 860px"
                draggable={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vignette */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/0 to-transparent pointer-events-none" />

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); paginate(1); }}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Fullscreen */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
          className={cn(
            "absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          aria-label="Open full screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 ease-out",
                  i === currentIndex
                    ? "w-5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    : "w-1.5 bg-white/45 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen modal ── */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div className="relative w-full h-full overflow-hidden">
              {/* Track */}
              <div ref={fullTrackRef} className="absolute inset-0 flex" style={trackStyle}>
                {images.map((src, i) => (
                  <div key={src} className="relative h-full flex-shrink-0" style={slideStyle(i)}>
                    <Image
                      src={src}
                      alt={`${name} photo ${i + 1}`}
                      fill
                      priority={i <= 1}
                      className="object-contain select-none"
                      sizes="100vw"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Crossfade overlay */}
              <AnimatePresence>
                {mode === "fade" && prevIndex !== null && (
                  <motion.div
                    key={`fade-fs-${prevIndex}`}
                    className="absolute inset-0 z-10 pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                  >
                    <Image
                      src={images[prevIndex]}
                      alt={`${name} photo ${prevIndex + 1}`}
                      fill
                      className="object-contain select-none"
                      sizes="100vw"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close */}
              <button
                onClick={() => setIsFullScreen(false)}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95"
                aria-label="Close full screen"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Prev */}
              {images.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next */}
              {images.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); paginate(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm ring-1 ring-white/15 transition-all duration-200 hover:bg-black/60 hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 ease-out",
                        i === currentIndex
                          ? "w-5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                          : "w-1.5 bg-white/45 hover:bg-white/70"
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
import * as React from "react";
import Image from "next/image";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

// Deep, photo-like gradients so white "Open Now"/"Premium" badges stay legible.
// When Cloudinary URLs arrive, the `src` branch takes over — nothing else changes.
const GRADIENTS = [
  "linear-gradient(135deg,#1f2937 0%,#ea580c 100%)",
  "linear-gradient(135deg,#0f172a 0%,#15803d 100%)",
  "linear-gradient(135deg,#27272a 0%,#c2410c 100%)",
  "linear-gradient(135deg,#1e293b 0%,#16a34a 100%)",
  "linear-gradient(135deg,#171717 0%,#f97316 100%)",
  "linear-gradient(135deg,#0c0a09 0%,#525252 100%)",
];

function pick(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export interface GymImageProps {
  name: string;
  src?: string;
  className?: string;
  /** Override the gradient seed (e.g. gallery index) so repeats look distinct. */
  seed?: string;
  /** Pass true only for above-the-fold images (LCP) — spec §10. */
  priority?: boolean;
}

export function GymImage({ name, src, className, seed, priority }: GymImageProps) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-neutral-200", className)}>
        <Image src={src} alt={name} fill priority={priority} className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
      </div>
    );
  }
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ background: pick(seed ?? name) }}
      role="img"
      aria-label={`${name} photo`}
    >
      <Dumbbell className="h-10 w-10 text-white/25" aria-hidden strokeWidth={1.5} />
    </div>
  );
}

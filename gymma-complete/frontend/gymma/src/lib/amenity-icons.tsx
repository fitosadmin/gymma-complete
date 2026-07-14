import * as React from "react";
import {
  Dumbbell,
  Waves,
  Snowflake,
  ShowerHead,
  Lock,
  Users,
  Wifi,
  Coffee,
  Flame,
  Droplets,
  HeartPulse,
  UserRound,
  Car,
} from "lucide-react";
import type { Amenity } from "@/types/gym";

type IconType = React.ComponentType<{ className?: string }>;

const MAP: Partial<Record<Amenity, IconType>> = {
  Weights: Dumbbell,
  CrossFit: Dumbbell,
  PT: Dumbbell,
  Cardio: HeartPulse,
  Swimming: Waves,
  Steam: Droplets,
  Sauna: Flame,
  Shower: ShowerHead,
  Lockers: Lock,
  AC: Snowflake,
  "Women's Section": UserRound,
  "Group Classes": Users,
  Parking: Car,
  "Wi-Fi": Wifi,
  Cafeteria: Coffee,
};

export function amenityIcon(a: Amenity): IconType {
  return MAP[a] ?? Dumbbell;
}

// ===========================================================================
// Gym domain model. GymSummary powers cards/lists; GymDetail powers /gym/[slug].
// These map to the §12 endpoints: GET /gyms -> GymSummary, GET /gyms/:slug ->
// GymDetail, GET /gyms/:id/reviews -> Review.
// ===========================================================================

export type Amenity =
  | "Cardio"
  | "Weights"
  | "CrossFit"
  | "Swimming"
  | "Steam"
  | "Sauna"
  | "Shower"
  | "Lockers"
  | "AC"
  | "Women's Section"
  | "PT"
  | "Group Classes"
  | "Parking"
  | "Wi-Fi"
  | "Cafeteria";

export type CrowdLevel = "Low" | "Medium" | "High";

/** Per-category scores shown on cards, filters, and comparison (spec §5.4.9). */
export interface CategoryScores {
  cleanliness: number; // 0–5
  equipment: number;
  trainers: number;
  value: number;
  crowd: number;
}

/** Lightweight shape for cards and lists (GET /gyms). */
export interface GymSummary {
  id: string;
  slug: string;
  name: string;
  /** Cloudinary URL later; undefined now -> branded gradient placeholder. */
  coverImage?: string;
  area: string;
  city: string;
  rating: number; // 0–5
  reviewCount: number;
  /** Monthly price in INR (paise-free, whole rupees). */
  pricePerMonth: number;
  /** Straight-line distance in km from the user, when location is known. */
  distanceKm?: number;
  amenities: Amenity[];
  isOpenNow: boolean;
  isPremium: boolean;
  womenFriendly: boolean;
  hasParking: boolean;
  lat: number;
  lng: number;
}

export interface Trainer {
  id: string;
  name: string;
  photo?: string;
  yearsExperience: number;
  languages: string[];
  specialization: string;
  pricePerSession: number; // INR
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number; // INR
  benefits: string[];
  recommended?: boolean;
}

export interface GymClass {
  id: string;
  name: string;
  schedule: string; // e.g. "Mon, Wed, Fri · 6:00 AM"
  durationMin: number;
  trainerName: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  rating: number; // 0–5
  body: string;
  /** Anonymous to owners — no real names surfaced (spec §5.4.9). */
  authorLabel: "Verified Member";
  createdAt: string; // ISO
  helpfulCount: number;
}

/** Full shape for the gym detail page (GET /gyms/:slug). */
export interface GymDetail extends GymSummary {
  description: string;
  yearsOperating: number;
  certifications: string[];
  scores: CategoryScores;
  trainers: Trainer[];
  plans: MembershipPlan[];
  classes: GymClass[];
  faqs: Faq[];
  gallery: string[];
  phone: string;
  whatsapp: string;
  addressLine: string;
}

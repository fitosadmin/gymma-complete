// src/modules/gyms/gyms.types.ts

export type GymSort = 'relevance' | 'distance' | 'rating' | 'price_asc';

export interface GymListFilters {
  q?: string;
  city: string;
  area?: string;
  amenities?: string[];
  womenFriendly?: boolean;
  hasParking?: boolean;
  isOpenNow?: boolean;
  priceMin?: number; // rupees
  priceMax?: number; // rupees
  lat?: number;
  lng?: number;
  distanceKm?: number;
  sort: GymSort;
  page: number;
  limit: number;
}

/** Raw row shape returned by the list query (prices in paise). */
export interface GymSummaryRow {
  id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  area: string;
  city: string;
  price_per_month: number;
  is_premium: boolean;
  women_friendly: boolean;
  has_parking: boolean;
  lat: string;
  lng: string;
  is_open_now: boolean | null;
  distance_km: string | null;
  rating: string;
  review_count: string;
  amenities: string[];
  total_count: string;
}

/** Frontend-facing summary (prices in rupees). */
export interface GymSummary {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  area: string;
  city: string;
  pricePerMonth: number; // rupees
  isPremium: boolean;
  womenFriendly: boolean;
  hasParking: boolean;
  lat: number;
  lng: number;
  isOpenNow: boolean | null;
  distanceKm: number | null;
  rating: number;
  reviewCount: number;
  amenities: string[];
}

export interface GymDetail extends GymSummary {
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  website: string | null;
  opensAt: string | null;
  closesAt: string | null;
  yearsOperating: number | null;
  profileScore: number;
  scores: {
    cleanliness: number;
    equipment: number;
    trainers: number;
    value: number;
    crowd: number;
  } | null;
  trainers: TrainerDto[];
  membershipPlans: MembershipPlanDto[];
  classes: GymClassDto[];
  faqs: FaqDto[];
  gallery: GalleryDto[];
  certifications: string[];
}

export interface TrainerDto {
  id: string;
  name: string;
  photoUrl: string | null;
  yearsExperience: number;
  specialization: string;
  pricePerSession: number; // rupees
  languages: string[];
}

export interface MembershipPlanDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number; // rupees
  benefits: string[];
  isRecommended: boolean;
}

export interface GymClassDto {
  id: string;
  name: string;
  schedule: string;
  durationMin: number;
  trainerName: string;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryDto {
  id: string;
  url: string;
  caption: string | null;
}

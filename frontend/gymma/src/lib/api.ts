import type { ApiResponse, Paginated } from "@/types/api";
import type { GymSummary, GymDetail, Review } from "@/types/gym";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export type SortKey = "relevance" | "distance" | "rating" | "price_asc";

export function sortGyms(gyms: GymSummary[], sort: SortKey): GymSummary[] {
  const copy = [...gyms];
  switch (sort) {
    case "distance":
      return copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "price_asc":
      return copy.sort((a, b) => a.pricePerMonth - b.pricePerMonth);
    case "relevance":
    default:
      return copy;
  }
}

function mapGym(backendGym: any) {
  if (!backendGym) return backendGym;
  return {
    ...backendGym,
    opensAt: backendGym.opensAt || undefined,
    closesAt: backendGym.closesAt || undefined,
    coverImage: backendGym.coverImageUrl,
    whatsapp: backendGym.whatsapp || "",
    phone: backendGym.phone || "",
    addressLine: backendGym.addressLine || "",
    description: backendGym.description || "",
    gallery: (backendGym.gallery || []).map((g: any) => g.url),
    plans: (backendGym.membershipPlans || []).map((p: any) => ({
      ...p,
      recommended: p.isRecommended
    })),
    trainers: (backendGym.trainers || []).map((t: any) => ({
      ...t,
      photo: t.photoUrl
    })),
    scores: backendGym.scores || {
      cleanliness: backendGym.rating || 4.5,
      equipment: backendGym.rating || 4.5,
      trainers: backendGym.rating || 4.5,
      value: backendGym.rating || 4.5,
      crowd: backendGym.rating || 4.5,
    }
  };
}

/** GET /gyms — paginated list. */
export async function getGyms(params?: { limit?: number }): Promise<Paginated<GymSummary>> {
  const url = new URL(`${API_URL}/gyms`);
  if (params?.limit) url.searchParams.set("limit", params.limit.toString());
  
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch gyms");
  const json = await res.json();
  return { ...json, data: (json.data || []).map(mapGym) };
}

/** Curated rails for the landing page. */
export async function getFeatured() {
  // Fetch from the actual API instead of slicing mocks.
  // Using limit=3 for each curated rail.
  const [topRatedRes, nearbyRes, affordableRes, trendingRes] = await Promise.all([
    fetch(`${API_URL}/gyms?sort=rating&limit=3`),
    fetch(`${API_URL}/gyms?sort=distance&limit=3`),
    fetch(`${API_URL}/gyms?sort=price_asc&limit=3`),
    fetch(`${API_URL}/gyms?limit=3`) // Default sort / trending proxy
  ]);

  if (!topRatedRes.ok || !nearbyRes.ok || !affordableRes.ok || !trendingRes.ok) {
    throw new Error("Failed to fetch featured gyms");
  }

  const topRated = await topRatedRes.json();
  const nearby = await nearbyRes.json();
  const affordable = await affordableRes.json();
  const trending = await trendingRes.json();
  
  // Women friendly proxy for now: just filter a large fetch or use another param
  const womenFriendlyRes = await fetch(`${API_URL}/gyms?women_friendly=true&limit=3`);
  const womenFriendly = womenFriendlyRes.ok ? await womenFriendlyRes.json() : { data: [] };

  return {
    topRated: (topRated.data || []).map(mapGym),
    nearby: (nearby.data || []).map(mapGym),
    affordable: (affordable.data || []).map(mapGym),
    womenFriendly: (womenFriendly.data || []).map(mapGym),
    trending: (trending.data || []).map(mapGym),
  };
}

/** Headline marketing stats (placeholder figures). */
export const PLATFORM_STATS = [
  { value: "500+", label: "Gyms listed" },
  { value: "50k+", label: "Active members" },
  { value: "4.7★", label: "Avg. rating" },
  { value: "40+", label: "Cities" },
];

/** GET /gyms/:slug — full detail for the gym page. */
export async function getGymBySlug(slug: string): Promise<ApiResponse<GymDetail>> {
  const res = await fetch(`${API_URL}/gyms/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return { success: false, error: { code: "NOT_FOUND", message: "Gym not found" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch gym details" } };
  }
  const json = await res.json();
  return { ...json, data: mapGym(json.data) };
}

/** GET /gyms/:id/reviews — paginated reviews. */
export async function getReviews(gymId: string): Promise<Paginated<Review>> {
  // Use slug as the ID/slug param
  const res = await fetch(`${API_URL}/gyms/${gymId}/reviews`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

/** All slugs for static generation of gym pages. */
export async function getAllSlugs(): Promise<string[]> {
  const res = await fetch(`${API_URL}/gyms?limit=50`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map((g: any) => g.slug);
}

/** All gyms enriched with detail (scores, etc.) — used by the compare tool. */
export async function getAllGymDetails(): Promise<GymDetail[]> {
  const res = await fetch(`${API_URL}/gyms?limit=50`);
  if (!res.ok) return [];
  const json = await res.json();
  
  // Since compare needs full detail, we might have to fetch details for each
  // But for performance just map the summaries or fetch detail route for each.
  // Usually this is a heavy op. Let's just fetch details for all gyms returned.
  const details = await Promise.all(
    (json.data || []).map(async (g: any) => {
      const d = await getGymBySlug(g.slug);
      return d.success ? mapGym(d.data) : null;
    })
  );
  
  return details.filter(Boolean) as GymDetail[];
}

export async function loginWithGoogleForOwner(idToken: string) {
  const res = await fetch(`${API_URL}/auth/google-owner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Login failed");
  return json.data;
}

export async function listOwnerGyms(token: string) {
  const res = await fetch(`${API_URL}/owner/gyms`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch gyms");
  return json.data;
}

export async function listMembers(gymId: string, token: string) {
  const res = await fetch(`${API_URL}/owner/gyms/${gymId}/members`, {
    headers: { "Authorization": `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to fetch members");
  return json.data;
}

export async function addMember(gymId: string, token: string, data: { fullName: string; phone: string; email?: string; planId?: string }) {
  const res = await fetch(`${API_URL}/owner/gyms/${gymId}/members`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to add member");
  return json.data;
}

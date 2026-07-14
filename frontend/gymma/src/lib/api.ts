import type { ApiResponse, Paginated } from "@/types/api";
import type { GymSummary, GymDetail, Review } from "@/types/gym";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// The API sleeps on Render's free tier (30-60s cold starts) and may be down
// entirely at build time. Every read in this module goes through apiFetch so
// neither `next build` nor a server render can crash on an unreachable API —
// callers get null and degrade to an empty/failure value instead.
const API_TIMEOUT_MS = 10_000;

async function apiFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS), ...init });
  } catch (err) {
    console.warn(`[api] unreachable: ${url} (${err instanceof Error ? err.message : err})`);
    return null;
  }
}

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
  
  const res = await apiFetch(url.toString(), { next: { revalidate: 60 } });
  if (!res?.ok) return { success: false, data: [] };
  const json = await res.json();
  return { ...json, data: (json.data || []).map(mapGym) };
}

/** One curated rail; empty on any failure so the landing page always renders. */
async function fetchRail(query: string) {
  const res = await apiFetch(`${API_URL}/gyms?${query}`);
  if (!res?.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapGym);
}

/** Curated rails for the landing page. */
export async function getFeatured() {
  const [topRated, nearby, affordable, trending, womenFriendly] = await Promise.all([
    fetchRail("sort=rating&limit=3"),
    fetchRail("sort=distance&limit=3"),
    fetchRail("sort=price_asc&limit=3"),
    fetchRail("limit=3"), // Default sort / trending proxy
    fetchRail("women_friendly=true&limit=3"),
  ]);
  return { topRated, nearby, affordable, womenFriendly, trending };
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
  const res = await apiFetch(`${API_URL}/gyms/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
  // Unreachable ≠ not found: the page throws to its error boundary for this
  // code instead of rendering a 404 for a gym that likely exists.
  if (!res) return { success: false, error: { code: "API_UNREACHABLE", message: "Gym service is unreachable" } };
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
  const res = await apiFetch(`${API_URL}/gyms/${encodeURIComponent(gymId)}/reviews`, { next: { revalidate: 60 } });
  if (!res?.ok) return { success: false, data: [] };
  return res.json();
}

/** All gyms enriched with detail (scores, etc.) — used by the compare tool. */
export async function getAllGymDetails(): Promise<GymDetail[]> {
  const res = await apiFetch(`${API_URL}/gyms?limit=50`);
  if (!res?.ok) return [];
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

export async function removeMember(gymId: string, token: string, memberId: string) {
  const res = await fetch(`${API_URL}/owner/gyms/${gymId}/members/${memberId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Failed to remove member");
  return json.data;
}

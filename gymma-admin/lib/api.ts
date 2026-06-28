// lib/api.ts — all calls to the Gymma backend

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8085/api/v1";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "super_admin";
  avatarUrl: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export interface DemoRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  gymName: string;
  city: string | null;
  area: string | null;
  memberCount: string | null;
  notes: string | null;
  status: "pending" | "contacted" | "converted" | "rejected";
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  status: string;
  gymName: string;
  gymSlug: string;
  createdAt: string;
}

export type DemoStatus = "pending" | "contacted" | "converted" | "rejected";

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const res = await fetch(`${API}/auth/google-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Login failed");
  }
  return json.data as AuthResult;
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export async function listDemoRequests(
  token: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<{ data: DemoRequest[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  const res = await fetch(`${API}/admin/demo-requests?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to fetch leads");
  return { data: json.data, meta: json.meta };
}

export async function updateDemoRequest(
  token: string,
  id: string,
  status: DemoStatus
): Promise<void> {
  const res = await fetch(`${API}/admin/demo-requests/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error?.message ?? "Update failed");
  }
}

export async function listInquiries(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<{ data: Inquiry[]; meta: { total: number; page: number; limit: number } }> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const res = await fetch(`${API}/admin/inquiries?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to fetch inquiries");
  return { data: json.data, meta: json.meta };
}

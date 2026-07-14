const ACCESS_KEY = "gymma_owner_access";
const REFRESH_KEY = "gymma_owner_refresh";
const USER_KEY = "gymma_owner_user";

export interface OwnerUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
}

export function saveSession(accessToken: string, refreshToken: string, user: OwnerUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getUser(): OwnerUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as OwnerUser; } catch { return null; }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getUser();
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ExternalLink, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembersTab } from "@/components/owner/members-tab";
import { listOwnerGyms } from "@/lib/api";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [isAuth, setIsAuth] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [gym, setGym] = React.useState<any>(null);
  const [gymId, setGymId] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    import("@/lib/auth").then(({ isAuthenticated, getAccessToken, getUser }) => {
      if (!isAuthenticated()) {
        router.replace("/owner/login");
      } else {
        const t = getAccessToken() || "";
        const u = getUser();
        setToken(t);
        setUser(u);
        setIsAuth(true);
        listOwnerGyms(t).then((gyms: any[]) => {
          if (gyms.length > 0) {
            setGymId(gyms[0].id);
            setGym(gyms[0]);
          } else {
            setGymId("no-gym");
          }
        }).catch(() => setGymId("no-gym"));
      }
    });
  }, [router]);

  const handleSignOut = () => {
    import("@/lib/auth").then(({ clearSession }) => {
      clearSession();
      router.replace("/owner/login");
    });
  };

  if (!isAuth) return null;

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Top Navbar */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <LayoutDashboard className="h-5 w-5 text-primary-600" />
            Owner Portal
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm font-medium text-neutral-600">
              {user?.fullName || user?.email}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-neutral-500 hover:text-neutral-900">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-6 shadow-sm border border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" /> Live
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              {gym ? gym.name : (gymId === "no-gym" ? "No Gym Found" : "Loading...")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {gym ? `${gym.city}, ${gym.area}` : "Manage your gym and members."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {gym && (
              <Link href={`/gym/${gym.slug}`}>
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View public page
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-700" />
            <h2 className="text-xl font-semibold text-neutral-900">Member Management</h2>
          </div>
          
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {gymId ? (
              <MembersTab gymId={gymId} token={token} />
            ) : (
              <div className="p-8 text-center text-neutral-500">Loading gym data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

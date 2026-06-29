"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, MessageSquare, Star, Users, ArrowUpRight, ExternalLink,
  ImagePlus, Bell, Pencil, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementComposer } from "@/components/owner/announcement-composer";
import { cn } from "@/lib/utils";

const GYM = { name: "Iron Temple Fitness", area: "Indiranagar, Bengaluru", slug: "iron-temple-indiranagar", completion: 80 };

const STATS = [
  { icon: Eye, label: "Profile views", value: "2,418", delta: "+12%", sub: "this month" },
  { icon: MessageSquare, label: "Inquiries", value: "63", delta: "+8%", sub: "this month" },
  { icon: Star, label: "Avg. rating", value: "4.7", delta: "+0.1", sub: "vs last month" },
  { icon: Users, label: "Members", value: "312", delta: "+19", sub: "active" },
];

const INQUIRIES = [
  { name: "Rahul S.", plan: "Annual", time: "2h ago", status: "New" },
  { name: "Meghna R.", plan: "Quarterly", time: "5h ago", status: "New" },
  { name: "Aditya K.", plan: "Monthly", time: "1d ago", status: "Contacted" },
  { name: "Priya N.", plan: "Half-Yearly", time: "2d ago", status: "Contacted" },
  { name: "Sameer P.", plan: "Annual", time: "3d ago", status: "Joined" },
];

const statusStyle: Record<string, string> = {
  New: "bg-primary-50 text-primary-700",
  Contacted: "bg-neutral-100 text-neutral-600",
  Joined: "bg-secondary-50 text-secondary-700",
};

const ACTIONS = [
  { icon: Pencil, label: "Edit profile" },
  { icon: ImagePlus, label: "Upload photos" },
  { icon: Bell, label: "Push notification" },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [isAuth, setIsAuth] = React.useState(false);

  React.useEffect(() => {
    import("@/lib/auth").then(({ isAuthenticated }) => {
      if (!isAuthenticated()) {
        router.replace("/owner/login");
      } else {
        setIsAuth(true);
      }
    });
  }, [router]);

  if (!isAuth) return null;

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-caption font-semibold uppercase tracking-widest text-neutral-500">Owner dashboard</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-0.5 text-caption font-medium text-secondary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" /> Live
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{GYM.name}</h1>
            <p className="text-sm text-neutral-500">{GYM.area}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/gym/${GYM.slug}`}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                View public page
              </Button>
            </Link>
            <Button size="sm">
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          </div>
        </div>

        {/* Profile completion */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">Profile completion</p>
              <p className="text-sm font-semibold text-neutral-900">{GYM.completion}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${GYM.completion}%` }} />
            </div>
            <p className="mt-2 text-caption text-neutral-500">Add 2 more photos and a class schedule to reach 100%.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, label, value, delta, sub }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="inline-flex items-center gap-0.5 text-caption font-medium text-secondary-700">
                  <ArrowUpRight className="h-3 w-3" />
                  {delta}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-neutral-900">{value}</p>
              <p className="text-caption text-neutral-500">{label} · {sub}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Recent inquiries */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Recent inquiries</h3>
              <button className="text-sm text-neutral-500 hover:text-neutral-900">View all</button>
            </div>
            <div className="mt-4 divide-y divide-neutral-100">
              {INQUIRIES.map((q) => (
                <div key={q.name} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-caption font-semibold text-neutral-600">
                      {q.name.split(" ").map((p) => p[0]).join("")}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{q.name}</p>
                      <p className="text-caption text-neutral-500">Interested in {q.plan} · {q.time}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-caption font-medium", statusStyle[q.status])}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="flex flex-col gap-6">
            <AnnouncementComposer />

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-neutral-900">Quick actions</h3>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {ACTIONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left text-sm text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                  >
                    <Icon className="h-4 w-4 text-neutral-500" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              <p className="text-sm text-neutral-600">
                Your profile views are up <span className="font-semibold text-neutral-900">12%</span> this month. Keep
                photos fresh to rank higher.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-caption text-neutral-400">
          Preview dashboard with sample data. Full owner tooling (auth, real analytics, member management) is on the roadmap.
        </p>
      </div>
    </div>
  );
}

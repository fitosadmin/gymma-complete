"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Dumbbell, Search, X, MapPin, ArrowRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_GYMS } from "@/lib/mock-data";

const NAV = [
  { label: "Discover", href: "/search" },
  { label: "Compare", href: "/compare" },
  { label: "About", href: "/about" },
];

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    // Close on Escape
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return MOCK_GYMS.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.area.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q)
    ).slice(0, 7);
  }, [query]);

  function go(slug: string) {
    onClose();
    router.push(`/gym/${slug}`);
  }

  function searchAll() {
    if (!query.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative mx-auto mt-20 w-full max-w-xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-neutral-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchAll()}
              placeholder="Search gyms by name, area…"
              className="flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => go(g.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{g.name}</p>
                      <p className="text-xs text-neutral-500">
                        {g.area} · ★ {g.rating.toFixed(1)} · ₹{(g.pricePerMonth / 1000).toFixed(1)}k/mo
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
                  </button>
                </li>
              ))}

              {/* See all results */}
              <li className="border-t border-neutral-100">
                <button
                  onClick={searchAll}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <span>See all results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </li>
            </ul>
          ) : query.length > 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              No gyms found for &ldquo;{query}&rdquo;
              <br />
              <button onClick={searchAll} className="mt-2 text-primary-600 font-semibold hover:underline">
                Search anyway →
              </button>
            </div>
          ) : (
            <div className="px-4 py-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Quick picks</p>
              <div className="flex flex-wrap gap-2">
                {["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Jayanagar"].map((area) => (
                  <button
                    key={area}
                    onClick={() => setQuery(area)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 flex flex-col",
          scrolled || mobileMenuOpen
            ? "border-b border-neutral-200/60 shadow-sm"
            : "border-b border-transparent bg-transparent"
        )}
        style={scrolled || mobileMenuOpen ? {
          background: "var(--glass-bg)",
          backdropFilter: `blur(var(--glass-blur))`,
          WebkitBackdropFilter: `blur(var(--glass-blur))`,
        } : undefined}
      >
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/explore" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold tracking-tight text-neutral-900 lowercase">gymma</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm transition-colors hover:text-neutral-900",
                  pathname === item.href ? "font-semibold text-neutral-900" : "text-neutral-500"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search gyms"
              className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              href="/partner-with-us"
              className={cn(
                "hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium transition-colors",
                pathname === "/partner-with-us"
                  ? "bg-ink text-white"
                  : "border border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:text-neutral-900"
              )}
            >
              For gym owners
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white px-6 py-4 shadow-sm">
            <nav className="flex flex-col gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-base transition-colors",
                    pathname === item.href ? "font-semibold text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2 border-neutral-100" />
              <Link
                href="/partner-with-us"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-primary-600 hover:text-primary-700"
              >
                For gym owners
              </Link>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

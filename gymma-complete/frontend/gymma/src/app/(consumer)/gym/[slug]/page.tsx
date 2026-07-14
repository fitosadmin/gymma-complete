import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, MapPin, Phone, MessageCircle, ChevronRight, Share2, Bookmark, Navigation } from "lucide-react";
import { getGymBySlug, getReviews, getAllSlugs } from "@/lib/api";
import { GymImage } from "@/components/gym/gym-image";
import { GymCarousel } from "@/components/gym-detail/gym-carousel";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import { InquiryProvider } from "@/components/gym-detail/inquiry";
import { HeroActions, BottomBar } from "@/components/gym-detail/actions";
import { AboutSection } from "@/components/gym-detail/about-section";
import { GallerySection } from "@/components/gym-detail/gallery-section";
import { TrainersRow } from "@/components/gym-detail/trainers-row";
import { PlansSection } from "@/components/gym-detail/plans-section";
import { FacilitiesGrid } from "@/components/gym-detail/facilities-grid";
import { ClassesList } from "@/components/gym-detail/classes-list";
import { ReviewsSection } from "@/components/gym-detail/reviews-section";
import { formatINR } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const res = await getGymBySlug(params.slug);
  if (!res.success || !res.data) return { title: "Gym not found" };
  const g = res.data;
  return {
    title: `${g.name} — ${g.area}, ${g.city}`,
    description: `${g.name} in ${g.area}, ${g.city}. ${g.rating.toFixed(1)}★ from ${g.reviewCount} members. From ${formatINR(g.pricePerMonth)}/mo.`,
  };
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default async function GymDetailPage({ params }: { params: { slug: string } }) {
  const [gymRes, reviewRes] = await Promise.all([getGymBySlug(params.slug), getReviews(params.slug)]);
  if (!gymRes.success || !gymRes.data) notFound();

  const g = gymRes.data;
  const reviews = reviewRes.data ?? [];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${g.name}, ${g.addressLine}, ${g.city}`)}`;

  const chips = [
    g.isOpenNow && { label: "Open Now", variant: "success" as const },
    g.womenFriendly && { label: "Women Friendly", variant: "secondary" as const },
    g.hasParking && { label: "Parking", variant: "neutral" as const },
    g.amenities.includes("AC") && { label: "AC", variant: "neutral" as const },
  ].filter(Boolean) as { label: string; variant: "success" | "secondary" | "neutral" }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: g.name,
    address: { "@type": "PostalAddress", streetAddress: g.addressLine, addressLocality: g.city, addressRegion: "Karnataka", addressCountry: "IN" },
    telephone: g.phone,
    aggregateRating: { "@type": "AggregateRating", ratingValue: g.rating, reviewCount: g.reviewCount },
    geo: { "@type": "GeoCoordinates", latitude: g.lat, longitude: g.lng },
  };

  return (
    <InquiryProvider gym={{ name: g.name, phone: g.phone, whatsapp: g.whatsapp }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto w-full max-w-[860px] pb-28 lg:pb-12">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1 px-4 pt-5 text-sm text-neutral-500 sm:px-6">
          <Link href="/explore" className="hover:text-neutral-900">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/search?q=${encodeURIComponent(g.area)}`} className="hover:text-neutral-900">{g.area}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-neutral-900">{g.name}</span>
        </nav>

        {/* ── Cover image ── */}
        <div className="relative mt-4">
          <GymCarousel
            name={g.name}
            images={[g.coverImage, ...(g.gallery || [])].filter(Boolean) as string[]}
          />
        </div>

        {/* ── Identity block: avatar + name + actions ── */}
        <div className="relative z-10 px-4 sm:px-6">
          {/* Avatar row */}
          <div className="mt-4 flex items-end justify-between">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-primary-500 to-primary-600 text-xl font-bold text-white shadow-md">
              {initials(g.name)}
            </div>
            {/* Desktop actions */}
            <div className="hidden items-center gap-2 sm:flex">
              <HeroActions mapsUrl={mapsUrl} />
            </div>
          </div>

          {/* Gym name */}
          <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-neutral-900 sm:text-3xl">
            {g.name}
          </h1>

          {/* Meta row: rating · location · call · whatsapp */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-600">
            <span className="flex items-center gap-1 font-semibold text-neutral-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {g.rating.toFixed(1)}
              <span className="font-normal text-neutral-500">({g.reviewCount})</span>
            </span>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-neutral-900">
              <MapPin className="h-3.5 w-3.5" />
              {g.area}, {g.city}
            </a>
            <a href={`tel:${g.phone}`} className="flex items-center gap-1 hover:text-neutral-900">
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
            <a
              href={`https://wa.me/${g.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-green-600 hover:text-green-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>

          {/* Chips + price */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Badge key={c.label} variant={c.variant}>
                {c.label}
              </Badge>
            ))}
            <span className="ml-auto text-xl font-bold text-neutral-900">
              {formatINR(g.pricePerMonth)}
              <span className="text-sm font-normal text-neutral-500">/mo</span>
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mt-8 border-t border-neutral-100" />

        {/* ── Body sections ── */}
        <div className="mt-8 space-y-12 px-4 sm:px-6">
          <AboutSection description={g.description} yearsOperating={g.yearsOperating} certifications={g.certifications} />
          <GallerySection gymName={g.name} slug={g.slug} gallery={g.gallery} />
          <TrainersRow trainers={g.trainers} />
          <PlansSection plans={g.plans} />
          <FacilitiesGrid amenities={g.amenities} />
          <ClassesList classes={g.classes} />
          <ReviewsSection reviews={reviews} rating={g.rating} reviewCount={g.reviewCount} scores={g.scores} />

          <section>
            <h2 className="text-xl font-bold text-neutral-900">FAQs</h2>
            <div className="mt-4">
              <Accordion items={g.faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))} />
            </div>
          </section>
        </div>
      </article>

      {/* Mobile bottom bar */}
      <BottomBar mapsUrl={mapsUrl} />
    </InquiryProvider>
  );
}

import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, TrendingUp, Bell, BarChart2, ImageIcon, MessageSquare, Award } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { DemoForm } from "@/components/owner/demo-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "For gym owners — list your gym",
  description:
    "Get a free auto-generated profile page and a white-label member engagement app — at a fraction of typical market costs.",
};

const PILLAR_1 = [
  "Auto-generated gym profile page",
  "Appear in local gym searches",
  "Verified photos and ratings",
  "SEO visibility on Gymma",
  "Lead generation from members",
  "Comparison listings with competitors",
];
const PILLAR_2 = [
  "Broadcast announcements to members",
  "Push notifications",
  "Member workout tracking",
  "Diet plans & progress monitoring",
  "Social leaderboards within your gym",
  "Analytics dashboard",
];

const FEATURES = [
  { icon: TrendingUp, title: "More footfall", desc: "Show up when someone searches for gyms in your area. Turn discovery into memberships." },
  { icon: Bell, title: "Push notifications", desc: "Send targeted announcements, offers, and updates directly to your members." },
  { icon: BarChart2, title: "Analytics", desc: "Track profile views, member activity, and engagement — all from one dashboard." },
  { icon: ImageIcon, title: "Rich profile", desc: "Showcase equipment, trainers, gallery, and plans in a structured, professional page." },
  { icon: MessageSquare, title: "Member communication", desc: "Chat, announcements, and alerts in one place — no WhatsApp group chaos." },
  { icon: Award, title: "Gamification", desc: "Challenges, streaks, and badges that keep members engaged and reduce churn." },
];

const STEPS = [
  { step: "01", title: "Request demo", desc: "Fill the form below. A Gymma advisor reaches out within 24 hours." },
  { step: "02", title: "Onboarding", desc: "Complete the gym setup — photos, trainers, plans, and facilities." },
  { step: "03", title: "Go live", desc: "Your auto-generated profile page goes live. Members start finding you." },
  { step: "04", title: "Engage", desc: "Use the owner dashboard to broadcast updates and monitor analytics." },
];

const TIERS = [
  {
    name: "Starter", desc: "For new gyms just getting started.", priceLabel: "Free", priceSub: "Standard listing, always free",
    features: ["Auto-generated profile page", "Appear in search listings", "Basic analytics", "Up to 6 photos"],
    cta: "Get started free", highlighted: false,
  },
  {
    name: "Growth", desc: "The full member-engagement suite.", priceLabel: "₹X,XXX", priceSub: "per month · white-label SaaS",
    features: ["Everything in Starter", "White-label member app", "Push notifications", "Workout & diet plans", "Challenges & gamification", "Advanced analytics", "Priority placement"],
    cta: "Request pricing", highlighted: true,
  },
  {
    name: "Enterprise", desc: "For chains and multi-location operators.", priceLabel: "Custom", priceSub: "Contact our team",
    features: ["Everything in Growth", "Multi-location management", "Dedicated account manager", "Custom integrations", "SLA & priority support"],
    cta: "Contact sales", highlighted: false,
  },
];

const FAQS = [
  { id: "f1", q: "Is my profile page really free?", a: "Yes. Every gym that partners with us gets a fully auto-generated profile page at no cost — it's how we help you get discovered." },
  { id: "f2", q: "How does the white-label member app work?", a: "Your members access a branded app (or web) connected to your gym. You control announcements, content, and challenges from the owner dashboard." },
  { id: "f3", q: "How long does onboarding take?", a: "Most gyms are live within 48 hours of completing the onboarding form. A team member guides you through setup." },
  { id: "f4", q: "What does the engagement app cost per member?", a: "Our B2B model makes the effective cost roughly ₹10–20/member/month — versus ₹300–500/month for standalone apps." },
  { id: "f5", q: "Are reviews real, and can I see who wrote them?", a: "Reviews are exclusively from verified paying members using credentials you generate. To keep them honest, all reviews are anonymous to both you and us." },
];

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={cn("mb-2 text-caption font-semibold uppercase tracking-widest", light ? "text-neutral-400" : "text-neutral-500")}>
      {children}
    </p>
  );
}

export default function PartnerWithUsPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-28">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-caption font-semibold text-primary-700">
            For gym owners
          </span>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-6xl">
            Grow your gym.
            <br />
            Retain your members.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
            Gymma gives you a free marketing platform to get discovered, plus a white-label member-engagement app that
            typically costs ₹300–500/member/month — at a fraction of that.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-sm font-medium text-white transition-colors hover:bg-ink-hover">
              Request a demo
            </a>
            <a href="#pricing" className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 px-8 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-500 hover:text-neutral-900">
              See pricing
            </a>
          </div>
        </div>
      </section>

      {/* Market comparison */}
      <section className="border-y border-neutral-200 bg-neutral-50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 text-center sm:flex-row sm:gap-16">
          <div>
            <p className="mb-1 text-caption uppercase tracking-widest text-neutral-400">Typical market cost</p>
            <p className="text-2xl font-semibold text-neutral-900 line-through decoration-error">₹300–500/user</p>
            <p className="mt-0.5 text-caption text-neutral-400">per month on similar apps</p>
          </div>
          <div className="hidden text-3xl text-neutral-300 sm:block">→</div>
          <div>
            <p className="mb-1 text-caption uppercase tracking-widest text-neutral-400">Effective cost with Gymma</p>
            <p className="text-2xl font-semibold text-secondary-700">₹10–20/member</p>
            <p className="mt-0.5 text-caption text-neutral-400">per month, B2B pricing</p>
          </div>
        </div>
      </section>

      {/* Two pillars */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <Eyebrow>What you get</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">Two pillars. One platform.</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 p-8">
            <div>
              <span className="text-caption font-semibold uppercase tracking-widest text-neutral-500">Pillar 1</span>
              <h3 className="mt-1 text-xl font-semibold text-neutral-900">Free marketing platform</h3>
              <p className="mt-2 text-sm text-neutral-500">Get discovered by thousands of gym seekers — no ad spend required.</p>
            </div>
            <ul className="flex flex-col gap-3">
              {PILLAR_1.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl bg-neutral-900 p-8">
            <div>
              <span className="text-caption font-semibold uppercase tracking-widest text-neutral-400">Pillar 2</span>
              <h3 className="mt-1 text-xl font-semibold text-white">Member engagement app</h3>
              <p className="mt-2 text-sm text-neutral-400">A white-label fitness app for your members — branded to your gym.</p>
            </div>
            <ul className="flex flex-col gap-3">
              {PILLAR_2.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">Everything a modern gym needs.</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-200 text-neutral-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-neutral-900">{title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <Eyebrow>Onboarding</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">Live in under 48 hours.</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.step} className="flex flex-col gap-3">
              <span className="text-caption font-semibold tracking-widest text-primary-500">{s.step}</span>
              <h3 className="font-semibold text-neutral-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-neutral-200 bg-neutral-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">Simple, transparent pricing.</h2>
            <p className="mt-3 text-sm text-neutral-500">
              Exact pricing is being finalised. Register interest to be notified first and receive early-bird rates.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div key={tier.name} className={cn("flex flex-col gap-6 rounded-2xl p-8", tier.highlighted ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white")}>
                <div>
                  <h3 className={cn("font-semibold", tier.highlighted ? "text-white" : "text-neutral-900")}>{tier.name}</h3>
                  <p className={cn("mt-1 text-sm", tier.highlighted ? "text-neutral-400" : "text-neutral-500")}>{tier.desc}</p>
                </div>
                <div>
                  <p className={cn("text-4xl font-semibold", tier.highlighted ? "text-white" : "text-neutral-900")}>{tier.priceLabel}</p>
                  <p className={cn("mt-1 text-caption", tier.highlighted ? "text-neutral-500" : "text-neutral-400")}>{tier.priceSub}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className={cn("flex items-start gap-2 text-sm", tier.highlighted ? "text-neutral-300" : "text-neutral-600")}>
                      <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tier.highlighted ? "text-secondary-400" : "text-secondary-600")} /> {f}
                    </li>
                  ))}
                </ul>
                <a href="#demo" className={cn("inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition-colors", tier.highlighted ? "bg-white text-neutral-900 hover:bg-neutral-100" : "border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white")}>
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl border-t border-neutral-100 px-6 py-24">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-3">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Common questions</h2>
          </div>
          <div className="md:col-span-2">
            <Accordion items={FAQS.map((f) => ({ id: f.id, title: f.q, content: f.a }))} />
          </div>
        </div>
      </section>

      {/* Demo form */}
      <section id="demo" className="bg-neutral-900 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-14 px-6 md:grid-cols-2">
          <div>
            <Eyebrow light>Get started</Eyebrow>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white">Request a demo.</h2>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-neutral-400">
              Tell us about your gym and we&apos;ll reach out within 24 hours to set up a personalised walkthrough.
            </p>
            <div className="flex flex-col gap-2 text-sm text-neutral-400">
              {["No commitment required", "Free profile regardless", "Early-bird pricing for signups"].map((t) => (
                <p key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-secondary-500" /> {t}
                </p>
              ))}
            </div>
            <p className="mt-8 text-sm text-neutral-400">
              Already partnered?{" "}
              <Link href="/owner/dashboard" className="font-medium text-white underline underline-offset-4">
                Go to your dashboard
              </Link>
            </p>
          </div>
          <DemoForm />
        </div>
      </section>
    </>
  );
}

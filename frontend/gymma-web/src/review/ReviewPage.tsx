import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dumbbell, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import {
  Accordion,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  EmptyState,
  ErrorState,
  Eyebrow,
  Input,
  Section,
  Select,
  Sheet,
  Skeleton,
  StatusBadge,
  SuccessState,
  Textarea,
  TierBadge,
  Toggle,
  VerifiedBadge,
} from '../components/ui'

/* ============================================================
   Phase 1 exit criterion: a review page that matches D8 exactly.
   Every token, every primitive, every 8.20 state — verifiable
   by eye and keyboard. This page never ships to production.
   ============================================================ */

function Swatch({ name, hex, dark }: { name: string; hex: string; dark?: boolean }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-card">
      <div className="h-16" style={{ backgroundColor: hex }} />
      <div className="px-3 py-2">
        <p className="font-display text-[13px] font-bold text-ink">{name}</p>
        <p className="text-caption text-muted">{hex}{dark ? ' · dark ramp' : ''}</p>
      </div>
    </div>
  )
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-display text-[13px] font-bold uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  )
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="border-t border-line pt-10">
      <h2 className="text-h2 text-navy">{title}</h2>
      {note && <p className="mt-1 max-w-[65ch] text-[15px] text-muted">{note}</p>}
      <div className="mt-8 space-y-10">{children}</div>
    </div>
  )
}

export function ReviewPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <main>
      {/* ---------- Header ---------- */}
      <Section size="utility">
        <Container>
          <Eyebrow>Gymma design system · Phase 1</Eyebrow>
          <h1 className="mt-3 text-display text-navy">Foundation review</h1>
          <p className="mt-4 max-w-[65ch] text-body-l text-muted">
            Every token and primitive from Blueprint D8, in one place. Verify against the poster;
            walk it keyboard-only. When in doubt: calmer, quieter, fewer.
          </p>
        </Container>
      </Section>

      <Section size="utility" className="pt-0 md:pt-0">
        <Container className="space-y-16">

          {/* ---------- D8.1 Colors ---------- */}
          <Group title="Color tokens" note="Locked from the poster (D8.1). Functional colors appear in form/system states only — never marketing.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              <Swatch name="navy" hex="#1f2d3d" />
              <Swatch name="navy-deep" hex="#141f2b" />
              <Swatch name="navy-raised" hex="#1a2735" />
              <Swatch name="copper" hex="#c46a4a" />
              <Swatch name="copper-soft" hex="#d98d6a" />
              <Swatch name="copper-dark" hex="#9c4f33" />
              <Swatch name="paper" hex="#faf8f5" />
              <Swatch name="card" hex="#ffffff" />
              <Swatch name="ink" hex="#22303f" />
              <Swatch name="muted" hex="#65717e" />
              <Swatch name="line" hex="#e9e4de" />
              <Swatch name="skeleton" hex="#f1ede8" />
              <Swatch name="dark-1" hex="#eef1f4" dark />
              <Swatch name="dark-2" hex="#c3ccd6" dark />
              <Swatch name="dark-3" hex="#93a1b0" dark />
              <Swatch name="success" hex="#3d8168" />
              <Swatch name="error" hex="#b3483d" />
              <Swatch name="warning" hex="#b07a2e" />
            </div>
            <Spec label="Gradients (rationed — D8.15)">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-brand">
                  <span className="font-display text-[13px] font-extrabold uppercase tracking-widest text-white">Brand gradient</span>
                </div>
                <div className="flex h-24 items-center justify-center rounded-lg border border-line bg-card">
                  <span className="text-numeric text-[40px] text-gradient-copper">₹6,899</span>
                </div>
              </div>
            </Spec>
          </Group>

          {/* ---------- D8.2 / D4 Typography ---------- */}
          <Group title="Typography" note="Archivo Expanded 900 for display and numerals, Archivo for headings and labels, Inter for body. Display is always uppercase; body never justified; 65ch max.">
            <div className="space-y-6">
              <div>
                <p className="text-caption text-muted">Display-XL · Archivo Expanded 900 · clamp 56–104</p>
                <p className="text-display-xl text-gradient-brand">96×</p>
              </div>
              <div>
                <p className="text-caption text-muted">Display · clamp 40–64 (dark-section H2s)</p>
                <p className="text-display text-navy">Earned. Never bought.</p>
              </div>
              <div>
                <p className="text-caption text-muted">H2 · Archivo 800 · 32–40</p>
                <p className="text-h2 text-navy">Know before you join.</p>
              </div>
              <div>
                <p className="text-caption text-muted">H3 · Archivo 700 · 19–24</p>
                <p className="text-h3 text-ink">Verified member reviews</p>
              </div>
              <div>
                <p className="text-caption text-muted">Eyebrow · Archivo 800 · 12 · 3.5px tracking</p>
                <Eyebrow>02 · The Gymma idea</Eyebrow>
              </div>
              <div>
                <p className="text-caption text-muted">Body-L · Inter · 17.5/1.85 (dark sections)</p>
                <p className="max-w-[65ch] text-body-l">
                  On Gymma, a review can only come from a real, paying member of that gym.
                  No competitors. No bots. No strangers.
                </p>
              </div>
              <div>
                <p className="text-caption text-muted">Body · Inter · 16/1.6</p>
                <p className="max-w-[65ch]">
                  Gymma gives every gym its own premium page, its own branded member app, and
                  ratings that only real, paying members can write.
                </p>
              </div>
              <div>
                <p className="text-caption text-muted">Small 14 · Caption 12.5</p>
                <p className="text-[14px] text-muted">Live in 48 hours · No setup fees</p>
                <p className="text-caption text-muted">Ratings reflect verified member reviews at the time of publication.</p>
              </div>
            </div>
          </Group>

          {/* ---------- Radius, shadows, icon tile ---------- */}
          <Group title="Radius · shadows · icons" note="Radius: 14 buttons/inputs · 20 cards · 28 CTA boxes · pill. Shadow-lg is copper-tinted and reserved for brand moments (D8.10).">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex h-28 items-center justify-center rounded-sm border border-line bg-card shadow-sm text-[13px] text-muted">radius-sm 14 · shadow-sm</div>
              <div className="flex h-28 items-center justify-center rounded-md border border-line bg-card shadow-md text-[13px] text-muted">radius-md 20 · shadow-md</div>
              <div className="flex h-28 items-center justify-center rounded-lg border border-line bg-card shadow-lg text-[13px] text-muted">radius-lg 28 · shadow-lg</div>
              <div className="flex h-28 items-center justify-center gap-3 rounded-md border border-line bg-card">
                <span className="icon-tile"><Dumbbell size={22} aria-hidden /></span>
                <span className="icon-tile"><MapPin size={22} aria-hidden /></span>
                <span className="text-[13px] text-muted">icon tile 46</span>
              </div>
            </div>
          </Group>

          {/* ---------- D6 Motion tokens ---------- */}
          <Group title="Motion tokens" note="“Weighted calm” (D6). One spring in the whole system (260/28). Reduced-motion collapses everything site-wide via one switch.">
            <div className="grid gap-3 text-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['t-fast 150ms', 'buttons, inputs, chips'],
                ['t-base 250ms', 'hover lifts, accordions, transitions'],
                ['t-slow 400ms', 'section reveals (Level 3)'],
                ['t-story 700ms', 'storytelling moments (Level 2)'],
                ['t-cine 1200ms', 'hard ceiling — nothing longer'],
                ['spring-settle 260/28', 'the only spring (sheets, success morphs)'],
                ['ease-out-soft', 'default enter · cubic-bezier(.22,1,.36,1)'],
                ['ease-in-out-smooth', 'movement · cubic-bezier(.65,0,.35,1)'],
                ['ease-exit', 'leave · cubic-bezier(.4,0,1,1)'],
              ].map(([token, use]) => (
                <div key={token} className="rounded-md border border-line bg-card px-4 py-3">
                  <p className="font-display text-[13px] font-bold text-ink">{token}</p>
                  <p className="text-caption text-muted">{use}</p>
                </div>
              ))}
            </div>
          </Group>

          {/* ---------- D8.5 Buttons ---------- */}
          <Group title="Buttons" note="All six states (D8.20): hover and focus-visible are live — tab through them. Loading locks width.">
            <Spec label="Primary">
              <div className="flex flex-wrap items-center gap-4">
                <Button>Find a gym near you</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Find a gym near you</Button>
              </div>
            </Spec>
            <Spec label="Secondary">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary">Get your gym on Gymma</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </Spec>
            <Spec label="Tertiary">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="tertiary">See full pricing</Button>
              </div>
            </Spec>
            <Spec label="Destructive (builder only)">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="destructive">Remove trainer</Button>
              </div>
            </Spec>
            <Spec label="On dark (poster CTA)">
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gradient-brand p-8">
                <Button variant="on-dark">Start your free trial</Button>
              </div>
            </Spec>
            <Spec label="Mobile block CTA (52px)">
              <div className="max-w-xs">
                <Button block>Join now</Button>
              </div>
            </Spec>
          </Group>

          {/* ---------- D8.6 Cards ---------- */}
          <Group title="Cards" note="Hover lift only on interactive cards. Ghost = “Your gym could be here”.">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card interactive>
                <p className="text-h3 text-ink">Default</p>
                <p className="mt-1 text-[14px] text-muted">White · 1px line · radius 20 · hover lift</p>
              </Card>
              <Card variant="featured">
                <StatusBadge status="popular" />
                <p className="mt-3 text-h3 text-ink">Featured</p>
                <p className="mt-1 text-[14px] text-muted">2px copper border — POPULAR tier card</p>
              </Card>
              <Card variant="dark">
                <p className="text-h3 text-dark-1">Dark</p>
                <p className="mt-1 text-[14px] text-dark-3">navy-raised · copper-alpha border</p>
              </Card>
              <Card variant="ghost" className="grid place-items-center text-center">
                <p className="text-[15px] font-semibold text-muted">Your gym could be here</p>
              </Card>
            </div>
          </Group>

          {/* ---------- D8.7 Forms ---------- */}
          <Group title="Forms" note="Labels always visible. Inline validation with aria-describedby. Focus = copper border + 3px copper/12 ring.">
            <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
              <Input label="Your name" placeholder="Priya Sharma" />
              <Input label="Phone" placeholder="95912 76584" error="Enter a 10-digit mobile number" defaultValue="9591" />
              <Input label="Gym name" defaultValue="Fit District" success readOnly />
              <Select label="Interested plan" defaultValue="">
                <option value="" disabled>Choose a plan</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annual</option>
              </Select>
              <div className="sm:col-span-2">
                <Textarea label="Message (optional)" placeholder="Anything the gym should know?" />
              </div>
              <div className="flex flex-wrap items-center gap-8 sm:col-span-2">
                <Checkbox label="Women-friendly only" defaultChecked />
                <Checkbox label="Open now" />
                <Toggle label="Show distance" defaultChecked />
                <Toggle label="Disabled toggle" disabled />
              </div>
            </div>
          </Group>

          {/* ---------- D8.8 Badges ---------- */}
          <Group title="Badges" note="Tier plaques ascend in copper richness A → Elite; Elite carries the one rotating border. Verified Member is the trust mark.">
            <Spec label="Tier plaques (md · 32px)">
              <div className="flex flex-wrap items-center gap-4">
                <TierBadge tier="A" />
                <TierBadge tier="AA" />
                <TierBadge tier="AAA" />
                <TierBadge tier="Elite" />
              </div>
            </Spec>
            <Spec label="Showcase (lg · 64px) and card (sm · 24px)">
              <div className="flex flex-wrap items-center gap-4">
                <TierBadge tier="Elite" size="lg" />
                <TierBadge tier="AA" size="sm" />
              </div>
            </Spec>
            <Spec label="Status + verified">
              <div className="flex flex-wrap items-center gap-4">
                <StatusBadge status="open" />
                <StatusBadge status="closed" />
                <StatusBadge status="popular" />
                <VerifiedBadge />
              </div>
            </Spec>
          </Group>

          {/* ---------- D8.9 Chips ---------- */}
          <Group title="Chips" note="Filter chips carry count suffixes; selected = navy fill.">
            <div className="flex flex-wrap items-center gap-3">
              <Chip selected>AC</Chip>
              <Chip count={12}>Shower</Chip>
              <Chip count={4}>Steam</Chip>
              <Chip>Women’s section</Chip>
              <Chip disabled>Sauna</Chip>
            </div>
          </Group>

          {/* ---------- Accordion ---------- */}
          <Group title="Accordion" note="Single-open, 250ms height ease, real buttons + regions (P7 / PR5 pattern).">
            <div className="max-w-2xl">
              <Accordion
                items={[
                  {
                    id: 'expensive',
                    title: '“It’s too expensive.”',
                    content:
                      'One saved member covers most of a month. Growth is ₹6,899/month — a custom app alone starts at ₹2,00,000.',
                  },
                  {
                    id: 'apps',
                    title: '“My members don’t use apps.”',
                    content:
                      'They check their phone 96 times a day. The app carries your gym’s name, logo, and colors — it’s your brand in their pocket.',
                  },
                  {
                    id: 'reviews',
                    title: '“What if I get bad reviews?”',
                    content:
                      'Only paying members who trained 14 days and logged 5 workouts can review — and you see improvement priorities before anyone else does.',
                  },
                ]}
              />
            </div>
          </Group>

          {/* ---------- Sheet ---------- */}
          <Group title="Bottom sheet" note="Spring-in dialog with focus trap, Esc, scrim tap. The mobile filter surface (G2).">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden className="mr-1" />
              Open filters
            </Button>
            <Sheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              title="Filters"
              footer={<Button block onClick={() => setSheetOpen(false)}>Show 24 gyms</Button>}
            >
              <div className="flex flex-col items-start gap-5">
                <div className="flex flex-wrap gap-2.5">
                  <Chip selected>Budget</Chip>
                  <Chip>Mid</Chip>
                  <Chip>Premium</Chip>
                </div>
                <Checkbox label="Open now" />
                <Checkbox label="Women-friendly" />
                <Toggle label="Only 4★ and above" />
              </div>
            </Sheet>
          </Group>

          {/* ---------- D8.22 Skeletons ---------- */}
          <Group title="Skeletons" note="Geometry-true, #f1ede8, 1.2s shimmer, 300ms-delayed. One shimmer region per viewport.">
            <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
              <div className="space-y-3 rounded-md border border-line bg-card p-5">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-5 w-2/3" delayed={false} />
                <Skeleton className="h-4 w-1/3" delayed={false} />
              </div>
              <div className="space-y-3 rounded-md border border-line bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" delayed={false} />
                  <Skeleton className="h-4 w-32" delayed={false} />
                </div>
                <Skeleton className="h-4 w-full" delayed={false} />
                <Skeleton className="h-4 w-5/6" delayed={false} />
              </div>
            </div>
          </Group>

          {/* ---------- D8.21/23/24 States ---------- */}
          <Group title="Empty · error · success" note="One honest sentence + one recovery action. The no-reviews empty state teaches the eligibility gate.">
            <div className="grid gap-6 lg:grid-cols-3">
              <EmptyState
                icon={Search}
                title="No gyms match yet"
                message="Try widening your radius or clearing a filter."
                actionLabel="Clear filters"
                onAction={() => {}}
              />
              <ErrorState
                message="We couldn’t load this gym’s page. Give it another try."
                onRetry={() => {}}
                callFallback
              />
              <SuccessState
                title="Inquiry sent"
                message="The gym will reach out within 24 hours."
                actionLabel="Get directions"
                onAction={() => {}}
              />
            </div>
          </Group>
        </Container>
      </Section>

      {/* ---------- D8.18 Dark section ---------- */}
      <Section tone="dark" glow="tr" size="gravity">
        <Container>
          <Eyebrow>Dark section · D8.18</Eyebrow>
          <h2 className="mt-3 max-w-[16ch] text-display text-dark-1">
            A rating you can’t buy. <span className="text-gradient-copper">Only earn.</span>
          </h2>
          <p className="mt-5 max-w-[56ch] text-body-l text-dark-2">
            navy-deep, one corner-anchored copper glow, the dark text ramp, Body-L at 17.5/1.85.
            Dark sections must earn their darkness — drama or gravity, never variety.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <TierBadge tier="Elite" size="lg" />
            <Card variant="dark" className="max-w-sm">
              <div className="flex items-center justify-between">
                <VerifiedBadge />
                <span className="text-caption text-dark-3">March 2026</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-dark-2">
                “Cleanest gym I’ve trained at in Indiranagar. Equipment is genuinely maintained.”
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-line bg-paper py-8">
        <Container>
          <p className="text-caption text-muted">
            GYMMA · A home for your gym — design system foundation, Blueprint v1.0
          </p>
        </Container>
      </footer>
    </main>
  )
}

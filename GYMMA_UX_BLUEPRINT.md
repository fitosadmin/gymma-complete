# GYMMA — COMPLETE UX BLUEPRINT
**Version 1.0 · July 2026 · Single Source of Truth for Frontend Implementation**

This document is derived strictly from the Gymma documentation set (`gymma_doc/`): the Master Strategic Analysis, the Unified Product Specification, the Master Marketing Document Part 1, the FITOS specifications, the Customer Poster (brand system source), and the GM logo. No branding, pricing, feature, or claim in this blueprint is invented.

**Locked facts used throughout:**
- Tagline: *"Where Every Rep Builds Trust"* · Footer signature: *"GYMMA · A home for your gym"*
- Pricing (poster, authoritative): Starter ₹4,449/mo (≤50 members) · Growth ₹6,899/mo (≤100, POPULAR) · Pro ₹9,799/mo (≤200) · Scale ₹10,799/mo (≤300) · +₹1,000 per extra 100 members · 1-month free trial · live in 48 hours · no setup fees · no credit card · contact 95912 76584
- Review system: credential-based (only paying members), eligibility = 14 days membership + 5 logged workouts, 90-day review cycle, anonymous forever, Bayesian scoring, 6 dimensions (Equipment, Cleanliness, Staff, Environment, Value, Safety), 14-day tier stabilization
- Tier system: GYMM-A → GYMM-AA → GYMM-AAA → GYMM-Elite ("Michelin Guide for Fitness")
- Comparison: up to 3 gyms, 14+ parameters
- Brand palette and typography: exactly as extracted from the poster (§D8.1)

---

# DELIVERABLE 1 — COMPLETE WEBSITE MAP

```
                                   ┌──────────────────────┐
                                   │      /  HOME          │
                                   │  (the Gymma story)    │
                                   └──────────┬───────────┘
              ┌───────────────┬───────────────┼────────────────┬──────────────┐
              ▼               ▼               ▼                ▼              ▼
      /gyms            /partner         /pricing          /contact       /legal/*
   DISCOVER GYMS    PARTNER WITH      PRICING &           CONTACT      privacy · terms
   (search, list,      GYMMA          PLANS                            cookies · disclaimer
    compare tray)   (owner pitch)        │
        │                │               │
        ▼                └──────┬────────┘
   /gym/:slug                   ▼
   PUBLISHED GYM         /partner/start
   WEBSITE               WEBSITE BUILDER
   (fixed template,      (owner onboarding wizard
    per-gym content)      with live gym-page preview)
                                │
                                ▼
                          /gym/:slug  (the owner's own published page — the "reveal")

   /404  — reachable from anywhere; styled dead-end recovery page
```

### Why every page exists

| Route | Why it exists (doc justification) |
|---|---|
| `/` Home | The QR-scan entry point. A stranger who knows nothing must understand Gymma in seconds and be routed to their audience path (seeker → /gyms, owner → /partner). Docs: "Landing Page (Primary)" §5.1 Strategic Analysis; homepage strategy must serve dual audiences. |
| `/gyms` Discover | The seeker's core job: "find a reliable gym near home/office, compare before committing" (Persona Rahul/Neha). Docs: screen W1 "Gym search / landing" P0; filters taxonomy §6.3; comparison tool (V1 recommendation #1). |
| `/gym/:slug` Published Gym Website | The second QR entry point (scanned inside a gym) and the product itself — every gym's auto-generated premium profile. Docs: "Gym Detail Page (Auto-Generated Template)" §6.4; screen W2 P0. Same template for all gyms, only content changes. |
| `/partner` Partner With Gymma | The B2B revenue engine. Priya needs the pitch: white-label app, verified reviews, ROI. Docs: "Gym Owner Portal → Landing Page (For Gym Owners)" §5.1; sales playbook messaging §5 Marketing Doc. |
| `/pricing` | Priya is cost-sensitive and ROI-driven — pricing must be findable, transparent, and defensible in one page. Docs: poster pricing; "Pricing & Plans" page in owner portal sitemap. |
| `/partner/start` Website Builder | The onboarding flow: "Fills gym details, uploads photos, adds trainers, sets membership plans → receives auto-generated profile page" (§7.1 Strategic Analysis). Designed as a live-preview builder because the auto-generated page IS the product demo. |
| `/contact` | Support + demo requests. Docs: "Support → Contact Form" §5.1; demo request flow in sales funnel. |
| `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/disclaimer` | Mandatory compliance: Privacy Policy, ToS, Cookie Policy, and the Rating Disclaimer are all "Required" (§9.2 Strategic Analysis; DPDP Act 2023). Disclaimer text verbatim from §9.1. |
| `/404` | Every dead QR code, mistyped slug, or unpublished gym page must recover the visitor instead of losing them. |

**Deliberately NOT pages:** gym comparison (it's a tray inside `/gyms`, not a page — keeps the flow continuous), owner dashboard & member app (separate products, out of scope per brief), demo request (a modal/section, not a page).

---

# DELIVERABLE 2 — EVERY PAGE BREAKDOWN

### `/` — Home
- **Purpose:** Convert a cold visitor into either a gym seeker (→ /gyms or a featured gym page) or a gym owner lead (→ /partner) by telling the trust story once, for both.
- **Target user:** QR-scanning stranger; secondary: researching owner, curious member.
- **Mindset:** "What is this? Why should I care? Can I trust it?" Attention span: seconds. Skeptical.
- **Primary CTA:** `Find a gym near you` (seeker path — highest volume).
- **Secondary CTA:** `Get your gym on Gymma` (owner path — highest value).
- **Exit paths:** /gyms, /gym/:slug (featured), /partner, /pricing, footer legal.
- **Success metric:** ≥60% scroll past the Problem section; CTA click-through ≥8%; bounce <40%.

### `/gyms` — Discover Gyms
- **Purpose:** Let Neha find, filter, and compare gyms with verified ratings; feed traffic into gym pages.
- **Target user:** Gym seeker (Neha/Rahul).
- **Mindset:** Task-focused research: "show me good gyms near me, prove they're good."
- **Primary CTA:** Gym card → `/gym/:slug`.
- **Secondary CTA:** `Compare` (add up to 3 gyms to tray) · `Get directions`.
- **Exit paths:** gym pages; back to home via nav.
- **Success metric:** ≥50% of sessions open at least one gym page; compare tray usage; filter engagement.

### `/gym/:slug` — Published Gym Website
- **Purpose:** Be the gym's premium digital home: convert a visitor into a membership inquiry, and make every owner who sees it want one.
- **Target user:** Seeker evaluating this gym (incl. in-gym QR scanner); secondary: the owner showing it off.
- **Mindset:** "Is THIS gym good? What does it cost? Can I trust these reviews?"
- **Primary CTA:** `Join Now` (membership inquiry form).
- **Secondary CTA:** `Call` / `WhatsApp` / `Get Directions`.
- **Exit path:** Back to /gyms (breadcrumb + browser back with preserved scroll); subtle "Powered by Gymma" → home.
- **Success metric:** inquiry submissions per view; call/WhatsApp taps; ≥45% reach the reviews section.

### `/partner` — Partner With Gymma
- **Purpose:** Sell Priya the three engines: white-label app (engagement), verified reviews (trust), dashboard (growth). Book the outcome: free trial / demo.
- **Target user:** Independent gym owner (Priya), boutique studio owner (Rajesh).
- **Mindset:** Skeptical, ROI-obsessed, worried about chains: "Is this worth my money? Will my members use it?"
- **Primary CTA:** `Start free trial` → /partner/start.
- **Secondary CTA:** `See a live gym page` (→ featured /gym/:slug) · `Talk to us` (call/WhatsApp).
- **Exit paths:** /partner/start, /pricing, /gym/:slug demo, /contact.
- **Success metric:** trial starts; demo requests; pricing views from this page.

### `/pricing` — Pricing
- **Purpose:** Transparent per-slot pricing that survives Priya's scrutiny; anchor value vs. custom app development (₹2,00,000+) per marketing doc §7.2.
- **Target user:** Gym owner comparing options.
- **Mindset:** "What does it cost, what's the catch, what do I get?"
- **Primary CTA:** `Start free trial` (on every tier card) → /partner/start.
- **Secondary CTA:** `Talk to sales` for 300+ members.
- **Exit paths:** /partner/start, /contact, /partner.
- **Success metric:** tier card CTA clicks; FAQ engagement; <25% exit without any interaction.

### `/partner/start` — Gym Owner Website Builder
- **Purpose:** The onboarding wizard that turns gym details into a live premium page — the moment of magic ("I can have your app live in 48 hours").
- **Target user:** Committed or trial-curious owner. Low-to-moderate tech literacy (per persona) — must feel effortless.
- **Mindset:** "Don't waste my time. Show me what I'm getting."
- **Primary CTA:** `Publish my gym page` (final step).
- **Secondary CTA:** `Save & continue later` (every step).
- **Exit path:** On publish → their live /gym/:slug (the reveal). Abandon → save-progress prompt.
- **Success metric:** wizard completion rate ≥60% of starters; time-to-publish <15 min; step drop-off tracked per step.

### `/contact` — Contact
- **Purpose:** Human reassurance for a relationship-driven market; demo requests; support.
- **Target user:** Owners pre-sale; anyone with questions.
- **Mindset:** "I want to talk to a person before I commit."
- **Primary CTA:** Submit contact/demo form.
- **Secondary CTA:** Call `95912 76584` · WhatsApp.
- **Exit path:** Success state routes owners to /partner, seekers to /gyms.
- **Success metric:** form submissions; call taps.

### `/legal/*` — Privacy, Terms, Cookies, Disclaimer
- **Purpose:** DPDP Act 2023 compliance, mandated rating disclaimer, trust-through-transparency.
- **Target user:** Diligent owners/seekers; regulators.
- **Mindset:** Scanning for specific answers.
- **Primary CTA:** none (reading pages). **Secondary:** contact link for data requests.
- **Exit path:** persistent nav/footer.
- **Success metric:** findability (≤2 clicks from anywhere); zero dead anchors.

### `/404`
- **Purpose:** Recover lost visitors (dead gym slug is the most likely case — gym unpublished/renamed).
- **Target user:** Anyone; often a QR scanner hitting a stale link.
- **Mindset:** Confused, one thumb-tap from leaving.
- **Primary CTA:** `Find gyms near you` → /gyms.
- **Secondary CTA:** `Go home`.
- **Success metric:** ≥40% recovery click-through instead of exit.

---

# DELIVERABLE 3 — SECTION-BY-SECTION BREAKDOWN

> Format per section: **Purpose · Content · Visual · Animation · Desktop · Tablet · Mobile · A11y · Perf · Why it exists.**
> Global rules that apply to every section (stated once): all reveal animations are transform/opacity only, trigger at 15–20% viewport intersection, run once, and are disabled under `prefers-reduced-motion` (content shown static). Dark sections always follow ≥1 light section (never two consecutive darks). Eyebrow labels ("01 · …") number the homepage acts only.

---

## 3.1 GLOBAL SHELL (all pages)

### Navigation bar
- **Purpose:** Persistent orientation + the two conversion paths always one tap away.
- **Content:** GM monogram (→ home) · links: Find a Gym, For Gym Owners, Pricing · CTA button `Get your gym on Gymma` (owner path; on /partner pages it swaps to `Start free trial`).
- **Visual:** Transparent over hero; after 80px scroll becomes `paper` at 88% opacity + `backdrop-blur(12px)` + 1px `line` bottom border (the ONLY glass surface in the system — see D8.16). Height 72px desktop / 60px mobile.
- **Animation:** Background/blur fades in over 250ms as scroll passes 80px. Hides on scroll-down >200px velocity, reveals on any scroll-up (translateY, 300ms).
- **Desktop:** Full links + CTA. Active route indicated by copper 2px underline offset 6px.
- **Tablet:** Same as desktop (links fit at 768px+).
- **Mobile:** Monogram + hamburger (44×44). Menu = full-screen overlay in `navy-deep`, links in Archivo 800 28px stacked, staggered 40ms fade-up, CTA pinned at overlay bottom. Body scroll locked while open.
- **A11y:** Skip-to-content link first in DOM. Overlay traps focus, closes on Esc. `aria-expanded` on hamburger. 4.5:1 contrast in both nav states.
- **Perf:** Scroll listener passive + rAF-throttled; blur only while nav visible.
- **Why:** Continuous-experience principle — the nav is the one element that never changes, anchoring all transitions.

### Footer
- **Purpose:** Terminal trust block + sitemap + legal compliance.
- **Content:** Column 1: GM logo, "A home for your gym", contact 95912 76584, WhatsApp. Column 2: Explore (Find a Gym, Pricing, Partner). Column 3: Company (About/Contact). Column 4: Legal (Privacy, Terms, Cookies, Rating Disclaimer). Bottom bar: © Gymma 2026 · "Made in India" · the mandated one-line rating disclaimer with link to full text.
- **Visual:** `navy-deep` background, copper radial glow bottom-left at 8% opacity, text `#c3ccd6`, headings Archivo 800 12px letterspaced uppercase copper.
- **Animation:** None (footers should be still).
- **Desktop/Tablet:** 4 columns → 2×2 at tablet.
- **Mobile:** Single column, accordion NOT used (all links visible — short list), contact block first.
- **A11y:** `<footer>` landmark; links ≥44px tap height on mobile.
- **Perf:** Static; zero JS.
- **Why:** The rating disclaimer is legally required on review-bearing surfaces; the footer carries it site-wide.

---

## 3.2 HOME `/` — 11 sections

### H1. Hero — "Where Every Rep Builds Trust"
- **Purpose:** Answer "what is this?" in 3 seconds and split the two audiences.
- **Content:** Eyebrow: `INDIA'S GYM TRUST PLATFORM`. H1 (Archivo Expanded 900, gradient text): "WHERE EVERY REP BUILDS TRUST". Sub (Inter, muted, max 56ch): "Gymma gives every gym its own premium page, its own branded member app, and ratings that only real, paying members can write." CTAs: primary `Find a gym near you`, secondary (outline) `Get your gym on Gymma`. Below: trust strip — "Verified member reviews · Live in 48 hours · Made for India".
- **Visual:** `paper` background. Copper radial glow (poster's `rgba(196,106,74,.14)` ellipse) behind the headline, slowly drifting. Right of center at desktop: a floating phone mockup at 8° tilt showing a gym's branded app home screen, soft `lg` shadow. GM monogram watermark at 3% opacity, oversized, top-left.
- **Animation:** Entrance choreography on load (once fonts ready): logo mark 0ms → headline lines mask-reveal upward staggered 80ms → sub + CTAs fade-up 400ms → phone slides up 24px + settles 700ms. Glow drifts ±30px on a 12s loop. Phone has ±6px parallax on mouse move (desktop only, lerped).
- **Desktop:** 2-column: text 7/12, phone 5/12. Min-height 92vh, content vertically centered.
- **Tablet:** Same split until 900px; below, phone moves under text at 60% scale.
- **Mobile:** Single column, text-first, phone image static (no parallax) and cropped to top half to save height; hero = ~85vh; CTAs full-width stacked (primary first).
- **A11y:** H1 is real text (gradient via background-clip). Reduced-motion: all entrance animation replaced by simple 200ms fade. Phone mockup `aria-hidden` (decorative).
- **Perf:** Phone mockup is the LCP candidate — preloaded, AVIF/WebP, exact-sized. Glow is a CSS gradient, not an image. No GSAP here.
- **Why:** The brief demands 3-second comprehension; the two CTAs are the entire business model in two buttons.

### H2. The Problem — "96×" (dark)
- **Purpose:** Create tension: the gym-tech status quo is broken (from the poster's proven Challenge section, expanded with the seeker's problem).
- **Content:** Eyebrow `01 · THE PROBLEM`. Giant stat "96×" (copper gradient text) + "phone checks every single day". Copy beats: (1) "…but never for your gym." (2) "Workout plans live in notebooks. Nutrition? Forgotten by Tuesday." (3) "Announcements die in a 200-message WhatsApp group." (4) Pivot to seekers: "And if you're choosing a gym? You're signing a 12-month contract on word-of-mouth and strangers' star ratings."
- **Visual:** `navy-deep` full-bleed. Copper radial glow top-right (poster style). Text `#c3ccd6`, bold spans white, highlights `copper-soft`.
- **Animation (Level 2 — pinned, desktop only):** Section pins for 2 viewport-heights. The "96×" counter rolls 0→96 (600ms) on pin start. The 4 copy beats fade/slide in sequentially, each tied to 25% of scrubbed pin progress; previous beat dims to 40% opacity. Unpins into H3.
- **Desktop:** Pinned scrub as above. Stat left (340px col), beats right.
- **Tablet:** No pinning. Stat on top, beats reveal on scroll as normal stacked blocks.
- **Mobile:** No pinning, no scrub. Stat 88px, then 4 short beats as separate reveal blocks. Counter still rolls once on first intersection (cheap, transform-based flip).
- **A11y:** Scrubbed text also readable if JS fails (all beats rendered, no opacity trap). Reduced-motion: static section, all beats visible.
- **Perf:** Pin uses GSAP ScrollTrigger with `will-change: transform` applied only during pin; released after.
- **Why:** Story structure demands a villain before a hero. The 96× device is already validated brand material.

### H3. The Idea — Verified Reviews explained
- **Purpose:** Introduce the moat with total clarity: reviews only from real, paying members.
- **Content:** Eyebrow `02 · THE GYMMA IDEA`. H2: "What if every rating had to be earned?" Sub: "On Gymma, a review can only come from a real, paying member of that gym. No competitors. No bots. No strangers." Then the mechanic as a 4-step visual sequence: (1) Member gets credentials from their gym → (2) Trains for 14 days & logs 5 workouts → (3) Unlocks one anonymous review → (4) Rating published with Verified Member badge; identity protected forever. Caption row: "Anonymous to gyms. Anonymous to us. Verified to everyone."
- **Visual:** `paper` background (relief after dark). Steps as 4 connected nodes on a horizontal copper-gradient line (poster's steps pattern, elevated): each node a 56px gradient circle with icon, card below it.
- **Animation (Level 2):** The connecting line draws left→right (SVG stroke-dashoffset, scrubbed over 60% of section scroll on desktop); each node pops (scale .8→1, 350ms spring) as the line reaches it. The Verified badge on step 4 gets a single subtle shine sweep when revealed (800ms, once).
- **Desktop:** 4 nodes horizontal, cards 260px each.
- **Tablet:** 2×2 grid, line becomes an S-curve connecting them (same draw animation, simplified).
- **Mobile:** Vertical timeline, line draws top→down as user scrolls (IntersectionObserver per node, no scrub), cards full-width.
- **A11y:** Steps are an ordered list semantically. Line/icons `aria-hidden`.
- **Perf:** One inline SVG; stroke animation is GPU-cheap.
- **Why:** This is the single differentiator per every strategy doc; it earns the most careful explanation on the site.

### H4. The Tiers — the Michelin moment (dark)
- **Purpose:** Make quality aspirational and legible: GYMM-A → GYMM-Elite.
- **Content:** Eyebrow `03 · THE STANDARD`. H2: "A rating you can't buy. Only earn." The four tier badges with public messages (verbatim from marketing doc §5.3): GYMM-A "Entry Level — meets basic fitness standards" · GYMM-AA "Quality Certified — above average, worth recommending" · GYMM-AAA "Premium — exceptional across all dimensions" · GYMM-Elite "World Class — among the best fitness facilities globally". Support line: "Scores are Bayesian-weighted and tiers must hold for 14 days — no gaming the system with a few good reviews."
- **Visual:** `navy-deep`. Badges as engraved plaques: dark card `#1a2735`, 1px copper-alpha border, tier wordmark in Archivo Expanded, copper gradient fill increasing in richness up the tiers; Elite gets a faint animated gradient border. Michelin-guide gravity: lots of space, centered, serif-free restraint.
- **Animation:** Badges reveal one at a time, ascending, 120ms stagger, each with a 400ms rise + soft glow bloom. Elite's gradient border rotates slowly (8s loop, pausable).
- **Desktop:** 4 across, Elite slightly larger (1.06 scale).
- **Tablet:** 2×2.
- **Mobile:** Horizontal snap-scroll carousel (one badge = 78vw), scroll hint via 10% peek of next card; no loops or autoplay.
- **A11y:** Carousel is native scroll (works with keyboard/swipe); badges are headings + text, not images.
- **Perf:** Gradient border via CSS `conic-gradient` mask, not canvas.
- **Why:** The tier system converts abstract "trust" into a status object both audiences want — seekers to find, owners to earn.

### H5. For Gym Seekers — find & compare (+ Featured Gyms)
- **Purpose:** Serve the highest-volume audience AND launch the Featured Gym Flow (Deliverable 10).
- **Content:** Eyebrow `04 · FOR GYM SEEKERS`. H2: "Know before you join." Copy: verified ratings across six dimensions; compare up to 3 gyms side-by-side; find gyms near you. Then: **live featured gym cards** (3 on desktop) pulled from real data — each card: photo, name, area, tier badge, rating + review count, "2.3 km" style distance if geolocation granted. CTA row: `Explore all gyms →`.
- **Visual:** `paper`. Cards per poster card language: white, 1px `line`, radius 20, `sm` shadow → `md` on hover, 16:9 image top.
- **Animation:** Cards rise-in staggered 90ms. Hover: -4px translateY + shadow deepen (250ms). Card click triggers the shared-element route transition (D7).
- **Desktop:** 3 cards + a 4th "ghost" card (dashed border): "Your gym could be here" → /partner (dual-audience seeding).
- **Tablet:** 2 cards + ghost card below.
- **Mobile:** Horizontal snap carousel of cards (82vw each), `Explore all gyms` as full-width button after.
- **A11y:** Entire card is one link with descriptive label ("Fit District, Indiranagar — GYMM-AA, 4.8 stars, 38 reviews"). Distance omitted from label if geolocation denied.
- **Perf:** Card images lazy (this is below fold), width-capped srcset.
- **Why:** Proof beats promises — real gyms with real ratings ARE the product demo; also the bridge into gym pages.

### H6. For Members — the branded app (pinned phone)
- **Purpose:** Show the member experience that makes gyms sticky (and makes owners want it).
- **Content:** Eyebrow `05 · FOR MEMBERS`. H2: "Your gym, in your pocket." 4 feature beats (poster features, verbatim spirit): AI Workout Planner ("smart plans personalized for every fitness level"), Nutrition Tracking ("log meals & macros — roti, dal, idli, all of it"), Broadcast Messaging ("updates, events, holidays — never lost in a group chat"), Progress Tracking ("watch yourself get stronger, week by week"). Closing line: "Every gym's app carries its own name, logo, and colors — powered by Gymma underneath."
- **Visual:** `paper` → very soft warm gradient. Center/right: large phone mockup; screen contents swap per beat. Left: the 4 beats as a vertical list; active beat full-ink, inactive muted.
- **Animation (Level 2 — pinned, desktop only):** Section pins ~3 viewport-heights. Scroll scrubs through the 4 beats: active beat scales 1.02 + copper eyebrow tick; phone screen crossfades + slides (screen image swap, 350ms). Unpin transitions into H7.
- **Desktop:** As above — the only long pin on the site.
- **Tablet:** No pin. Phone sticky (position: sticky) at right while beats scroll past it — cheaper approximation.
- **Mobile:** No pin, no sticky. One static phone image, then 4 beats as compact icon-cards in a 1-col stack (icons from poster's stroke set).
- **A11y:** Beats are a list; screen images have alt describing the screen ("Workout plan screen showing today's session"). Reduced-motion: static layout, all beats shown, first screen only.
- **Perf:** All 4 phone screens preloaded as one sprite/stacked images ≤120KB total when section approaches (IO rootMargin 600px). Pin math paused when tab hidden.
- **Why:** "Your members already use apps — make it YOUR app" is the #1 owner message; showing it as a member moment sells both sides at once.

### H7. For Gym Owners — the growth engine
- **Purpose:** Convert Priya: trust → retention → growth, with numbers.
- **Content:** Eyebrow `06 · FOR GYM OWNERS`. H2: "Stop competing on price. Start competing on trust." 3 value cards (from marketing matrix): (1) See what members really think — anonymous 6-dimension feedback + improvement priorities; (2) Keep more members — engagement tools that cut churn ("12–15% higher retention with digital engagement"); (3) Win the neighborhood — your verified rating works while you sleep ("your GYMM badge vs. their generic star ratings"). Stat strip: "Live in 48 hours · No setup fees · 1-month free trial". CTA: `Partner with Gymma →` + ghost link `See pricing`.
- **Visual:** `paper`, but cards carry the poster's BOND/TRUST/SYNC/GROW chip style: gradient chip label top of each card.
- **Animation:** Standard Level 3 reveals; number "12–15%" ticks up once on reveal (500ms).
- **Desktop:** 3 cards row + stat strip beneath.
- **Tablet:** 3 cards → 1+2 wrap.
- **Mobile:** Stacked cards; stat strip becomes 3 stacked checkmark lines.
- **A11y:** Stats have full-sentence context in text, not just numbers.
- **Perf:** Zero images; pure DOM.
- **Why:** Owners fund the platform; this section is the handoff into the /partner funnel.

### H8. How It Works — 3 steps
- **Purpose:** Kill perceived complexity ("I don't have time for another tool").
- **Content:** Eyebrow `07 · GETTING STARTED`. Poster steps verbatim: 1 SUBSCRIBE — "Sign up & create your gym profile" · 2 ONBOARD — "Add coaches, upload certifications & achievements" · 3 CONNECT — "Invite members — they download the free Gymma app linked to your gym". Sub-line: "From signup to live in 48 hours."
- **Visual:** Poster's numbered gradient circles (56px) + connecting gradient line at 28% opacity.
- **Animation:** Line draws, then numbers pop sequentially (Level 3; 350ms each, 150ms stagger).
- **Desktop/Tablet:** 3 across / 3 across (fits).
- **Mobile:** Vertical stack, line hidden (poster's own mobile rule), numbers left-aligned beside text.
- **A11y:** Ordered list.
- **Perf:** Trivial.
- **Why:** Direct answer to objection #3 in the objection-handling guide.

### H9. Pricing preview
- **Purpose:** Transparency signal on the story page; route serious owners to /pricing.
- **Content:** Eyebrow `08 · PRICING`. The 4 poster tiers in compact form (name, price, member cap), Growth flagged POPULAR. Note: "₹1,000 per extra 100 members". CTA `See full pricing →`.
- **Visual:** Poster plan-card language: white cards, POPULAR card with 2px copper border + gradient price text + badge.
- **Animation:** Level 4 card reveals; POPULAR card arrives 60ms later with slightly larger rise (draws the eye).
- **Desktop:** 4 across, baseline-aligned (`align-items: end` per poster).
- **Tablet/Mobile:** 2×2 / 2×2 compact (poster's own mobile pattern — prices are short enough).
- **A11y:** Prices as text; "POPULAR" also in accessible name.
- **Perf:** Trivial.
- **Why:** Hiding pricing breaks trust with a price-sensitive market; showing it IS brand behavior.

### H10. Final CTA — the gradient box
- **Purpose:** Last conversion moment; the poster's proven closer.
- **Content:** White inverted GM logo. H2: "Get on board within 48 hours." Sub: "And get a 1-month free trial." Button: `START YOUR FREE TRIAL` (white). Fine print: "No setup fees · No credit card required · Full support included". Contact block: "Contact us for app demo — 95912 76584" + QR code motif.
- **Visual:** Full brand-gradient box (radius 28), white circle accent bottom-left at 6% opacity, exactly per poster.
- **Animation:** Box scales from .97 + fades on reveal (450ms). Button hover: lift + shadow.
- **Desktop/Tablet:** Box within container; contact row horizontal.
- **Mobile:** Box full-bleed minus 16px margins; contact stacked; phone number is `tel:` link, 20px Archivo.
- **A11y:** White-on-gradient text checked ≥4.5:1 (navy end is fine; keep text off the copper end). QR decorative `aria-hidden`.
- **Perf:** Pure CSS.
- **Why:** Every journey ends in a decision; the gradient box is Gymma's signature closing move.

### H11. Footer — (see 3.1)

---

## 3.3 DISCOVER `/gyms` — 5 sections

### G1. Search header
- **Purpose:** Immediate task entry: location or name.
- **Content:** H1 "Find your gym." Search input (name/area) + `Use my location` button + radius chips (<1km · 1–3km · 3–5km · 5–10km — from filter taxonomy §6.3).
- **Visual:** Compact hero on `paper`, copper glow faint; height ~38vh desktop.
- **Animation:** Input focus ring animates in copper (150ms). No entrance theatrics — task page.
- **Desktop:** Search bar 720px centered.
- **Tablet/Mobile:** Full-width bar; location button becomes icon-button inside the input; chips scroll horizontally.
- **A11y:** Geolocation always optional with graceful text fallback ("Showing gyms in Bengaluru"). Announce result count changes via `aria-live=polite`.
- **Perf:** Debounced search (300ms).
- **Why:** Screen W1 P0; the seeker's entire job starts here.

### G2. Filter rail + results grid
- **Purpose:** Refine and browse.
- **Content:** Filters (from §6.3 taxonomy): budget (Budget/Mid/Premium), min rating, amenities multi-select (AC, shower, steam, sauna, lockers, parking, women's section, PT, group classes…), open now, women-friendly toggle. Results: gym cards (image 16:9, open/closed badge, name, tier badge, rating ★ + count, distance, price "from ₹X/month", 1-line summary, `View` + `Compare +`) — the exact card spec from §6.2.
- **Visual:** Light rail (sticky) left 280px; cards grid right. Cards identical to H5 card language (consistency).
- **Animation:** Result changes: outgoing cards fade 150ms, incoming stagger-fade 40ms each (FLIP-free, simple). No layout animation chaos.
- **Desktop:** Rail + 3-col grid.
- **Tablet:** Rail collapses to a filter bar with `Filters (3)` button opening a slide-over panel; 2-col grid.
- **Mobile:** Filter button opens full-screen bottom sheet (spring 350ms) with big touch targets and an apply bar pinned bottom; 1-col cards.
- **A11y:** Filters are real checkboxes/radios in a `<form>`; sheet traps focus; result count announced.
- **Perf:** Card images lazy + `content-visibility:auto` on cards; list virtualization NOT needed under ~100 results, revisit later.
- **Why:** Filter taxonomy is a P0 doc requirement; the rail/sheet split is the desktop-vs-mobile interaction model difference the brief demands.

### G3. Compare tray
- **Purpose:** "Compare up to 3 gyms side-by-side" (V1 recommendation #1).
- **Content:** Docked bar appears when ≥1 gym added: thumbnails of selected gyms (max 3), `Compare` button, clear-all. Tapping Compare opens a full-screen overlay table: 14+ parameters (rating, tier, price, distance, dimensions ×6, amenities, hours, women-friendly…).
- **Visual:** Tray = white, `lg` shadow, radius 20, floats 16px above bottom. Overlay = `paper`, columns per gym, copper highlights for best-in-row values.
- **Animation:** Tray slides up (300ms spring) on first add; thumbnail pops in (scale .6→1). Overlay opens as Level 1 transition (fade+rise 350ms).
- **Desktop:** Tray bottom-center; overlay 3 columns + sticky parameter labels column.
- **Tablet:** Same; overlay columns scroll horizontally if needed.
- **Mobile:** Tray sits above bottom safe-area; overlay = horizontally snap-scrolling gym columns with sticky parameter column at left (the mobile-native comparison model).
- **A11y:** Overlay is a dialog (focus trap, Esc); table uses real `<table>` semantics; best-value highlight not color-only (✓ icon).
- **Perf:** Overlay mounted lazily on first open.
- **Why:** Comparison is a named V1 feature and a decisive seeker moment; a tray keeps it continuous instead of a separate page.

### G4. Empty/edge states
- **Purpose:** Never dead-end a searcher.
- **Content:** No results: illustration (GM monogram line-style), "No gyms match yet — try widening your radius", one-tap `Clear filters`. Location denied: city fallback message. Error: retry card.
- **Visual/Animation:** Calm, single fade-in.
- **All breakpoints:** Centered block.
- **A11y:** Announced via live region.
- **Perf:** Trivial.
- **Why:** Empty states are where trust dies silently; designed, not defaulted.

### G5. Owner seeding strip + Footer
- **Purpose:** Dual-audience capture on the seeker's page.
- **Content:** Slim band: "Own a gym? Get listed with verified reviews and your own branded app." → /partner.
- **Visual:** Navy band, copper link. Height 88px.
- **Mobile:** Two lines, full-width tap.
- **Why:** Every seeker page is also seen by owners scouting the competition (doc: owner influencers = word-of-mouth).

---

## 3.4 PUBLISHED GYM WEBSITE `/gym/:slug` — 13 sections (THE fixed template)

Template rule: layout, order, and interactions are IDENTICAL for every gym. Only content, imagery, and the gym's accent color (applied ONLY to: hero name underline, section eyebrows, Join Now button, in-page nav active state — never backgrounds or body text) change. If a section has no content (e.g., no classes), it is omitted entirely along with its nav chip — the template collapses gracefully.

### GP1. Gym hero
- **Purpose:** Instant identity + trust snapshot: this gym, this good, this close.
- **Content:** Full-bleed cover image (gradient-scrimmed navy at bottom 40%), gym logo chip, gym name (Archivo Expanded 900), area + distance, GYMM tier badge + rating ★ + verified review count, Open/Closed live badge, quick actions: `Join Now` (accent), `Call`, `Directions`, `Share`. Slim "◆ Verified by Gymma" chip top-right → home (subtle; gym brand is primary per docs §8.3).
- **Visual:** 68vh desktop / 52vh mobile. The one section where the gym's photography dominates.
- **Animation:** Cover Ken-Burns-esque slow scale 1.04→1 over 1.2s on load (once); text stack fade-up staggered. Arriving via shared-element transition from a gym card, the card image expands INTO this cover (D7).
- **Desktop:** Text bottom-left, actions bottom-right.
- **Tablet:** Same, actions wrap.
- **Mobile:** Text bottom-left; actions collapse into the sticky bottom bar (GP13) — hero shows only name/badge/rating.
- **A11y:** Cover has meaningful alt ("Fit District weight training floor"); rating text "4.8 out of 5, 38 verified reviews"; Open/Closed uses text+color.
- **Perf:** Cover = LCP: preload, responsive srcset, AVIF, blur-up placeholder from 24px thumb.
- **Why:** §6.4 hero spec verbatim; the QR-in-gym scanner lands here and must see "this is MY gym's serious page."

### GP2. Sticky in-page nav
- **Purpose:** Long-page wayfinding; the gym page is a single continuous scroll.
- **Content:** Chips: About · Gallery · Facilities · Equipment · Classes · Trainers · Plans · Reviews · Location. (Chips for absent sections omitted.)
- **Visual:** Sticks under global nav (global nav auto-hides on scroll-down here, giving the page to the gym). White bar, 1px line, chips pill-style; active chip = accent text + accent underline.
- **Animation:** Active chip indicator slides between chips (250ms). Bar itself has no entrance.
- **Desktop:** Centered chip row.
- **Tablet/Mobile:** Horizontally scrollable chip row with edge-fade masks; active chip auto-scrolls into view.
- **A11y:** `<nav aria-label="Gym page sections">`; anchor links; scroll-margin-top set so anchors land below sticky bars; focus not stolen on scroll-spy updates.
- **Perf:** Scroll-spy via IntersectionObserver, not scroll math.
- **Why:** 12+ content sections need navigation or mobile users drown.

### GP3. About
- **Purpose:** The gym's story + hard trust facts.
- **Content:** Description, stat chips: years operating, member count, certifications (from §6.4 About spec). Optional vision line as a pull-quote with copper left rule.
- **Visual:** `paper`, 720px prose column + stat chips right (desktop).
- **Animation:** Level 3 reveal only.
- **Mobile:** Prose then chips as 2×2 grid.
- **A11y:** Real heading order (H2 here, H3s below).
- **Why:** §6.4 row 2.

### GP4. Gallery
- **Purpose:** "Show, don't tell" — photos are the seeker's #2 trust input after reviews.
- **Content:** Categorized photos (12+ categories supported per docs: exterior, reception, workout areas, equipment, washrooms, parking…). Category filter chips above grid.
- **Visual:** Masonry-esque fixed-pattern grid (repeating 6-image pattern: 1 large + 5 small) — deterministic, not JS-measured masonry.
- **Animation:** Images fade in on load (200ms). Click → lightbox: image zooms from its grid position (FLIP, 300ms), navy-deep backdrop at 92%, arrows/swipe, counter "4/17", category label.
- **Desktop:** Grid 3-col pattern; lightbox arrows + keyboard.
- **Tablet:** 2-col pattern.
- **Mobile:** 2-col simple grid; lightbox is full-screen with swipe + pinch-zoom; close via swipe-down (with 20% drag-fade affordance).
- **A11y:** Lightbox = dialog, focus trap, Esc; alts carry category ("Washroom — Fit District"). Thumbnails ≥44px targets.
- **Perf:** Thumbs lazy + sized; full-res loaded only on lightbox open (+preload neighbors). This section is the page's image budget hotspot — hard cap thumbs ≤60KB each.
- **Why:** §6.4 Gallery spec; Neha's hygiene anxiety is answered with washroom photos, not adjectives.

### GP5. Facilities
- **Purpose:** Scannable amenity truth (parking, AC, shower, steam, sauna, locker, water, cafeteria, Wi-Fi — §6.4 list).
- **Content:** Icon + label chips; present = full color, absent = omitted (never shown greyed — don't advertise absence).
- **Visual:** Chip grid, poster icon style (2px copper strokes in soft gradient squares).
- **Animation:** Chips cascade-fade (30ms stagger, Level 4).
- **Desktop/Tablet/Mobile:** 4 / 3 / 2 columns.
- **A11y:** List semantics; icons decorative.
- **Why:** Filter parity — what seekers filter by in /gyms they verify here.

### GP6. Equipment
- **Purpose:** Substance for serious lifters (Rahul persona values equipment quality).
- **Content:** Categories (cardio, free weights, machines — master catalog categories) with counts/highlights ("Dumbbells up to 50kg").
- **Visual:** 3 category cards with small photo headers.
- **Animation:** Level 4.
- **Mobile:** Accordion (collapsed by default, first open) — density control.
- **A11y:** Accordion buttons with `aria-expanded`.
- **Why:** §6.4 Equipment row; differentiates serious gyms.

### GP7. Classes
- **Purpose:** Schedule visibility (Yoga, HIIT, Zumba, CrossFit, Boxing, Functional — §6.4).
- **Content:** Class cards: name, days/times, trainer ref, intensity tag.
- **Visual:** Compact cards in a week-strip layout (day chips filter the list).
- **Animation:** Filter swaps = 150ms crossfade.
- **Desktop:** Day chips + 3-col cards. **Mobile:** Day chips (snap-scroll) + stacked cards.
- **A11y:** Day filter = radio group.
- **Why:** §6.4 Classes row; boutique/class gyms (Rajesh) need this to shine.

### GP8. Trainers
- **Purpose:** "Your coaches become the face members trust" (poster) — certification-forward.
- **Content:** Trainer cards: photo, name, experience years, certifications (badge list), specialization, languages; optional PT pricing (§6.4 Trainers spec).
- **Visual:** Portrait cards (3:4 photo), certification badges as small copper-outline chips — credentials ARE the design.
- **Animation:** Level 4 reveals; hover lifts photo card, certifications row slides up 4px.
- **Desktop:** 3–4 per row. **Tablet:** 2. **Mobile:** Horizontal snap carousel (72vw cards).
- **A11y:** Cert chips are text, readable by SR in card label.
- **Why:** Trainer quality is a review dimension and a poster value pillar.

### GP9. Membership Plans
- **Purpose:** The money question, answered plainly.
- **Content:** Gym's own plans: Monthly / Quarterly / Half-yearly / Annual (§6.4) — price, benefits list, any offer flag. Note: prices are the gym's own, not Gymma tiers.
- **Visual:** Poster plan-card DNA (white, radius 20, the gym's recommended plan gets accent border + badge).
- **Animation:** Level 4; recommended card arrives last with emphasis rise.
- **Desktop:** Up to 4 across, baseline-aligned. **Mobile:** 2×2 if short prices, else stacked.
- **A11y:** Full plan info in text; "Best value" badge in accessible name.
- **Why:** Transparent pricing was Rahul's #1 pain ("fears hidden costs").

### GP10. Verified Reviews — the differentiator section
- **Purpose:** The moat made visible; the reason this page can be trusted over Google.
- **Content:** Header: overall score (large, Archivo Expanded) + tier badge + "based on N verified member reviews". Six dimension bars (Equipment, Cleanliness, Staff, Environment, Value, Safety) with 0–5 fills. Explainer chip: "Every review is from a verified, paying member — 🛈" → popover explaining the 14-day + 5-workout gate and anonymity. Review cards: rating, date ("March 2026" — month only, protects anonymity), body text, category mini-ratings, `Verified Member ✓` badge. Sort: Recent / Highest / Lowest. Mandatory disclaimer line at section end (§9.1 verbatim, small muted text).
- **Visual:** `navy-deep` section — the page's single dark act, giving reviews cinematic weight. Cards on `#1a2735` with copper-alpha borders. Dimension bars fill in copper gradient.
- **Animation:** Overall score counts up once (600ms); dimension bars fill staggered 80ms (scaleX, Level 3); cards standard reveals. Popover = 150ms fade-scale.
- **Desktop:** Score+bars left (sticky within section), review cards right column scrolling.
- **Tablet:** Score+bars top, cards 2-col below.
- **Mobile:** Score block, bars stacked, cards single column; "Show more" pagination (8 at a time) instead of infinite scroll.
- **A11y:** Bars have text values ("Cleanliness 4.6 of 5"); popover keyboard-openable; disclaimer real text not image.
- **Perf:** Reviews fetched with page (SSR-shaped data or first-paint fetch); "show more" appends without layout shift.
- **Why:** Every strategy doc names this the moat; visually privileging it IS the positioning.

### GP11. Location & Hours
- **Purpose:** Remove the last practical frictions: where, when.
- **Content:** Address, static map image (click → Google Maps deep link), hours table with today highlighted + Open/Closed live state, landmark line ("Metro Pillar 55, Indiranagar").
- **Visual:** Split card: map left, hours right. Map styled to brand (desaturated navy-tone static tile).
- **Animation:** Level 3 only.
- **Mobile:** Map full-width (tap target entire image, labeled "Open in Maps"), hours accordion showing today by default.
- **A11y:** Hours = table with day headers; "today" marked in text.
- **Perf:** STATIC map image (no map SDK — saves ~200KB JS); deep link does the heavy lifting.
- **Why:** §6.4 CTAs row (Directions); proximity is the seeker's top decision factor.

### GP12. Join / Contact CTA
- **Purpose:** Convert: membership inquiry (V1 "Membership Inquiry System" recommendation #3).
- **Content:** Gradient CTA box (gym-accented headline): "Ready to train at {Gym}?" Inquiry form: name, phone, interested plan (select), preferred time to visit, message (optional). Alt actions: Call / WhatsApp buttons. Post-submit success state: "The gym will reach out within 24 hours" + option to get directions.
- **Visual:** Brand gradient box (Gymma gradient — this is the one Gymma-branded moment mid-page, reinforcing who powers the promise), white form card inside.
- **Animation:** Submit button → loading spinner in-button → success check morph (400ms); form swaps to success card (300ms crossfade).
- **Desktop:** Form 2-col fields. **Mobile:** Single col, `tel`/`WhatsApp` buttons above the form (calling is the Indian-market default action).
- **A11y:** Labels always visible (no placeholder-only), inline validation with `aria-describedby`, error summary focus jump.
- **Perf:** Form JS in page bundle (small); no captcha in V1 (rate-limit server-side).
- **Why:** Lead generation is a named revenue stream; the inquiry form is the page's business purpose.

### GP13. Gym footer + mobile sticky bar
- **Content:** Mini footer: gym name, address, phone · "◆ Powered by Gymma — verified reviews you can trust" → `/` · legal links.
- **Mobile sticky bar:** Persistent bottom bar (64px + safe-area): `Join Now` (accent, 60% width) + `Call` icon-button + `Directions` icon-button. Appears after hero scrolls past (slide-up 250ms); hides when GP12 form is on screen (redundancy).
- **A11y:** Bar buttons ≥48px; doesn't cover focused inputs (hidden while keyboard open).
- **Why:** Docs: Gymma branding "subtle, gym primary"; mobile sticky join = conversion floor for thumb-reach.

---

## 3.5 PARTNER `/partner` — 9 sections

| # | Section | Essentials |
|---|---|---|
| P1 | **Hero** | H1: "Your gym deserves its own app." (poster headline). Sub: complete digital companion — branded app, verified reviews, owner dashboard. CTAs: `Start free trial` / `See a live gym page`. Visual: split — copy left, composite mockup right (phone app + gym page + dashboard card fanned in 3-layer parallax, ±8px mouse drift desktop, static mobile). Emotion: "this is MY brand elevated." |
| P2 | **The problem for owners** (dark) | Poster challenge remixed for Priya: acquisition cost, churn, chains, WhatsApp chaos. Compact — 3 pain chips + one paragraph. Level 3 reveals. Mobile: stacked chips. |
| P3 | **The three engines** | TRUST (verified reviews + tier badge) · ENGAGEMENT (white-label app) · GROWTH (dashboard + analytics + improvement priorities). 3 large alternating rows (media/text zig-zag). Each row's media: focused product visual. Desktop: 2-col alternating; mobile: media-then-text stacked, no alternation. This is the feature depth section — marketing matrix categories 1–3. |
| P4 | **Live proof — featured gym page** | "See what your page could look like." Embedded framed preview (static screenshot with device chrome) of a real gym page + `Open live page →` (new context via D10 flow). Ghost variant: "Your gym here" builder CTA. Trust: real is better than promised. |
| P5 | **ROI strip** (dark) | The marketing doc's ROI math as a visual: "One saved member ≈ ₹15,000/year. Gymma Growth ≈ ₹6,899/month." + retention stat. Numbers tick on reveal. NOT an interactive calculator in V1 (scope discipline) — a static, honest strip. |
| P6 | **How it works** | Same 3-step component as H8 (SUBSCRIBE/ONBOARD/CONNECT) — component reuse, familiarity breeds trust. Plus 48-hours line. |
| P7 | **Objections, answered** | Accordion of the top objections from §10 marketing doc, verbatim answers condensed: "Too expensive" / "My members don't use apps" / "No time to manage tools" / "What if bad reviews?" / "I have WhatsApp" / "Data privacy". Accordion = single-open, 250ms height ease. A11y: buttons + regions. This section IS the sales team's playbook, self-serve. |
| P8 | **Pricing preview** | Same component as H9. CTA → /pricing or straight to trial. |
| P9 | **Final CTA gradient box** | Same component as H10 with owner copy: "Get on board within 48 hours" + phone + QR. |

Page-level: purpose/CTA/metrics per D2. All sections follow global reveal rules; P3 rows are the page's only Level 2 moments (media slides in from its side, 500ms, desktop only).

---

## 3.6 PRICING `/pricing` — 6 sections

| # | Section | Essentials |
|---|---|---|
| PR1 | **Header** | H1 "Simple, per-member pricing." Sub: "Every plan includes the full platform — app, reviews, dashboard. No setup fees. No credit card. One month free." Billing note: annual option messaging if/when offered — V1 shows monthly only (poster truth). |
| PR2 | **Tier cards (full)** | The 4 poster tiers, full detail: price, member cap, per-member math ("≈ ₹89/member" computed), included features list (identical across tiers in V1 poster model — stated honestly: "Every plan is full-featured; you pay for member capacity"). Growth = POPULAR treatment. Extra-members note prominent: "+₹1,000 per extra 100 members". `Start free trial` on each card. Desktop 4-across baseline-aligned; tablet 2×2; mobile stacked with POPULAR first (order swap — recommendation leads on mobile). |
| PR3 | **Capacity slider** | "How many members do you have?" — a single slider (50–500+); highlights the right tier card live and shows computed monthly cost including extra-member packs. THE one interactive element on the page; instant comprehension of the per-slot model. A11y: slider is a real `<input type=range>` with visible value; updates announced politely. Mobile: stepper buttons (+/−50) beside slider for precision. |
| PR4 | **Cost anchor table** | From marketing §7.2: custom app dev ₹2,00,000+ vs. global platforms ₹15–30k/mo vs. Gymma. 3-row honest table. No animation beyond reveal. |
| PR5 | **Pricing FAQ** | Accordion: what counts as a member slot, exceeding capacity, trial terms, cancellation, support, GST line item. Single-open accordion, same component as P7. |
| PR6 | **Final CTA** | H10 component. |

---

## 3.7 WEBSITE BUILDER `/partner/start` — wizard (7 steps + reveal)

**Model:** Full-screen focused flow (global nav replaced by minimal bar: GM mark · step indicator · `Save & exit`). Left pane = form step; right pane = LIVE PREVIEW of their gym page (the actual GP template, scaled 0.6, updating in real time). On mobile the preview is behind a `Preview` floating button → full-screen preview overlay. This live preview is the product demo and the motivation engine — every field filled makes THEIR page visibly better.

| Step | Content | Notes |
|---|---|---|
| B0 | **Account/contact** — name, phone (OTP-ready field pattern), gym name, city | Trust copy: "Free for 30 days. No card." |
| B1 | **Gym basics** — address, hours, contact, description | Preview: hero + about materialize |
| B2 | **Photos** — cover + gallery upload with category tags | Drag-drop desktop, camera-roll mobile; instant client-side compression; preview gallery fills |
| B3 | **Facilities & equipment** — toggle chips (the §6.4 lists), equipment categories | Fastest step; big satisfying toggles |
| B4 | **Trainers** — repeatable card form: photo, name, experience, certifications, specialization | "Add trainer" pattern; skippable |
| B5 | **Membership plans** — repeatable: duration, price, benefits | Skippable with "add later" |
| B6 | **Branding** — logo upload, accent color pick (curated 8-swatch palette that harmonizes with the design system — free-pick forbidden to protect template quality) | Preview recolors live — the wow moment |
| B7 | **Review & publish** — full-page preview + checklist of skipped items + `Publish my gym page` | Publish → transition D7-e into their live /gym/:slug with a one-time celebration state |

- **Progress:** top bar fills per step (scaleX, 300ms); steps revisitable via indicator; all data persisted per step (auto-save, "Saved ✓" microcopy).
- **Validation:** inline, on blur; step gate only on truly required fields (B0/B1); everything else skippable — completion beats perfection (owner tech-literacy is low per persona).
- **A11y:** One `<form>` per step; labels visible; upload has non-drag fallback; wizard steps announced ("Step 3 of 8, Photos").
- **Perf:** Image compression in a web worker; preview updates debounced 150ms; the preview reuses the real GP components (one source of truth).
- **Why:** §7.1 onboarding flow verbatim, designed so the "auto-generated profile page" isn't received — it's WATCHED being born.

---

## 3.8 CONTACT `/contact` — 3 sections
1. **Header + channels:** H1 "Talk to us." Cards: Call 95912 76584 (7am–9pm IST) · WhatsApp (pre-filled message deep link, per sales playbook) · Email. Response promise: "within 24 hours."
2. **Form:** name, phone, I-am (gym owner / member / gym seeker — routes internally), message. Owner selection reveals optional "gym name + city" fields (300ms height ease). Same form standards as GP12.
3. **Footer.**
Mobile: channel cards first (tap-to-call culture), form second. Success state offers the right next step per audience.

## 3.9 LEGAL `/legal/*` — shared layout
- Two-pane: sticky section TOC left (scrollspy), prose right (720px). Mobile: TOC becomes a top dropdown.
- Content pages: Privacy (DPDP 2023), Terms, Cookies, Rating Disclaimer (§9.1 text verbatim as its own page since it's load-bearing for the review system).
- "Last updated" date top. Zero animation beyond nav. Print-friendly.

## 3.10 404
- `navy-deep` full-viewport. Giant "404" in the copper gradient (Archivo Expanded, the 96×-stat treatment — brand even in failure). Line: "This page skipped leg day." Sub: "The page you're looking for doesn't exist — but great gyms nearby do." CTAs: `Find gyms near you` / `Go home`. If path matched `/gym/*`: extra line "Looking for a gym? It may have moved." with search box.
- One glow drift animation; nothing else. Mobile identical, stacked.

---

# DELIVERABLE 4 — DESKTOP EXPERIENCE

**Scroll model:** Lenis smooth scroll on desktop only (lerp 0.1, ~1.1 multiplier — weighty, luxurious, never floaty). Native scroll everywhere Lenis is inappropriate: overlays, modals, compare table, builder preview pane.

**Pinned sections — exactly three, all on Home:**
1. H2 Problem (2 viewport-heights, scrubbed beats)
2. H3 Idea (line-draw scrub — soft pin: only the SVG progress is scroll-linked; section itself flows)
3. H6 Member app (3 viewport-heights, screen-swap scrub)
No pins anywhere else on the site. Gym pages NEVER pin (content pages, not story pages). Total pinned scroll budget ≤ 5 added viewport-heights — the story stays under 15 total scroll-heights.

**Animation triggers:** Section reveals at 18% intersection. Pins engage at section top hitting viewport top. Counters/bars fire once at 40% visibility. Hover states everywhere per D8.22.

**Where motion stops:** Legal pages, footer, forms while focused, compare table, 404 (one loop only), any section after its entrance completes. Stillness is a feature: after every Level 2 moment, the following section is deliberately quiet (H3→H4 is the only dark-to-dark-adjacent energy pairing, separated by the paper H3).

**Whitespace law:** Section vertical padding 128px desktop baseline; 160px around the two "gravity" moments (H4 tiers, GP10 reviews); 96px for utility sections (pricing FAQ, legal). Whitespace increases where trust must land — never crowd a claim.

**Hierarchy shifts:** Light sections = ink-on-paper, editorial. Dark sections = display-type theatre (bigger type, more space, fewer words). The alternation IS the pacing: paper→navy→paper→navy… on Home; single navy act (reviews) on gym pages.

**Layout system:**
- Max content width: **1200px** (container) · prose 720px · full-bleed sections use 100vw with inner container.
- Container padding: 48px (≥1280px), 40px (1024–1279).
- Grid: **12 columns, 24px gutters**. Cards: 3-col = span 4; 4-col = span 3.
- Breakpoints: ≥1280 desktop-wide · 1024–1279 desktop · 768–1023 tablet · <768 mobile (design at 390px).
- Spacing scale (4px base): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.
- Typography hierarchy (desktop): Display-XL clamp(56–104px) Archivo Expanded 900 uppercase, line-height 1.05, letter-spacing 0.01em (hero/404/stat) · Display clamp(40–64px) (dark-section H2s) · H2 32–40px Archivo 800 · H3 19–24px Archivo 700 · Eyebrow 12px Archivo 800, 3.5px tracking, uppercase, copper · Body-L 17.5px/1.85 Inter (dark sections per poster) · Body 16px/1.6 Inter · Small 14px · Caption 12.5px. Numbers/prices: Archivo Expanded 900.

---

# DELIVERABLE 5 — MOBILE EXPERIENCE

**Interaction model: "thumb-first vertical story."** Not a resized desktop — a rebuilt one.

- **Section order changes:** Home order holds (story logic) but every section is internally recomposed: pins removed, columns stacked text-first, card rows become snap carousels (Tiers, Featured gyms, Trainers). Pricing mobile puts POPULAR first. Contact puts call channels above the form. Gym hero delegates actions to the sticky bar.
- **Spacing:** Section padding 64px vertical (96px for gravity moments); container padding 20px; card gaps 16px.
- **Touch targets:** min 44×44px everywhere; primary CTAs 52px tall, full-width; carousels give 10% next-card peek as the scroll affordance.
- **Sticky actions:** Gym page bottom bar (Join/Call/Directions — GP13). Builder: `Preview` FAB + sticky step-continue bar. Compare tray docks above safe-area. Nav CTA lives inside the hamburger overlay (never crowding the 60px bar).
- **Navigation:** Hamburger → full-screen navy overlay (described in 3.1). No bottom tab bar — this is a narrative site, not an app shell; a tab bar would fight the gym page's own sticky bar.
- **Scrolling:** native momentum only. NO Lenis, NO scroll-jacking, NO pinning. Snap carousels use CSS `scroll-snap-type: x mandatory`.
- **Animation simplifications:** only Levels 3–5 exist on mobile (reveals, cards, buttons). Durations shortened ~20% (350→280ms class). Counters/bar-fills kept (cheap, high-value). Parallax, mouse-drift, pin-scrubs, gradient-drift loops: all desktop-only. Phone-screen story (H6) becomes static image + icon list.
- **Loading behaviour:** skeletons appear only after 300ms delay (avoid flash); images blur-up from 24px placeholders; route transitions shortened to 250ms; hero images get `fetchpriority=high`, all else lazy.
- **Gestures:** Lightbox: swipe left/right, swipe-down to close, pinch-zoom. Carousels: native swipe. Bottom sheets (filters): drag-handle + drag-to-dismiss with velocity threshold; background scrim tap closes. NO custom gesture inventions — platform-native patterns only. Back gesture (browser) always works: overlays push history state so swipe-back closes the overlay, not the page.

---

# DELIVERABLE 6 — ANIMATION BLUEPRINT

**Motion personality:** *"Weighted calm."* Everything settles like a plate loaded onto a bar: decisive arrival, no bounce beyond one soft spring, no idle fidgeting. If an animation doesn't explain, orient, or reward — it doesn't exist.

**Motion tokens:**
- Durations: `t-fast 150ms` · `t-base 250ms` · `t-slow 400ms` · `t-story 700ms` · `t-cine 1200ms`
- Easings: `ease-out-soft cubic-bezier(0.22, 1, 0.36, 1)` (default enter) · `ease-in-out-smooth cubic-bezier(0.65, 0, 0.35, 1)` (movement/position) · `ease-exit cubic-bezier(0.4, 0, 1, 1)` (leave) · `spring-settle` (stiffness 260, damping 28 — the only spring)
- Stagger: 40–120ms; never more than 6 staggered children (rest appear with the 6th).

| Level | Scope | Purpose | Duration/Easing | Trigger | Exit | Perf | Reduced-motion fallback |
|---|---|---|---|---|---|---|---|
| **1** | Page/route transitions | Continuity between pages; never a hard cut | 350ms out + 400ms in, ease-exit/ease-out-soft | Route change | Old view fades -8px up; new fades +16px up | opacity/transform only; no layout reads | 120ms plain crossfade |
| **2** | Major storytelling (H2 pin, H3 line, H6 phone, P3 rows, GP1 shared-element) | Explain the product; earn attention | Scrubbed (pin) or 500–700ms, ease-in-out-smooth | ScrollTrigger pin/scroll-link | Unpin flows naturally; no snap-back | GSAP; will-change during pin only; desktop only | Static composed layout, all content visible |
| **3** | Section reveals (headers, prose, bars, counters) | Orient reading rhythm | 400ms, ease-out-soft, 24px rise | IO at 18%, once | None (stays) | IO + CSS class; no JS per-frame | Visible immediately |
| **4** | Cards & grids | Establish grouping via stagger | 350ms, ease-out-soft, 16px rise, 60–90ms stagger | IO on container | None | Compositor-only | Visible immediately |
| **5** | Buttons/inputs/toggles | Confirm interaction | 150ms base; press scale 0.98; success morph 400ms spring-settle | pointer/keyboard/state | Reverse 150ms | CSS transitions | Color/opacity change only, no movement |
| **6** | Hover & micro | Reward exploration | 200–250ms ease-out-soft: lift -4px, shadow sm→md, arrow-slide 4px, underline grow | hover/focus-visible (both, always) | Reverse on leave | CSS only | Preserved (non-vestibular) but movement removed, color kept |

**Signature micro-moments (the "alive but calm" quota — max one per viewport):** hero glow drift (12s loop) · Verified badge single shine (once) · Elite badge border rotation (8s) · dimension-bar fills · price count-ups. Nothing else loops.

**Hard rules:** no animation longer than 1200ms except scrubbed ones · no autoplaying carousels · no animation on legal/form/error contexts · every loop pauses when tab hidden · `prefers-reduced-motion` collapses Levels 1–4 to opacity-only and kills all loops/scrubs/pins site-wide (single global switch).

---

# DELIVERABLE 7 — ROUTE TRANSITIONS

**The connective tissue: a "copper thread" system.** Every transition passes through the same 3-beat grammar — exhale (old page releases) → carry (a shared element or the copper accent bridges) → arrive (new page's hero composes in). Total budget 350–750ms; navigation must never feel slower than thought.

| Transition | Choreography |
|---|---|
| **a. Home → Gym page (featured card)** | Shared-element: the clicked card's image FLIP-expands into the GP1 cover (450ms, ease-in-out-smooth) while page content fades; gym name crossfades from card label to hero title position. The single most important transition on the site — it makes "browse → trust this gym" feel physically continuous. Fallback (data not ready): standard Level 1 + hero skeleton. |
| **b. Home/anywhere → Pricing, Partner, Contact, Gyms** | Standard Level 1: exit 350ms fade-up-8px, enter 400ms fade-rise-16px. Nav stays fixed (it never transitions — the anchor). Scroll restored to top; back-nav restores prior scroll position exactly. |
| **c. Gyms → Gym page** | Same shared-element as (a) from result cards. Filters/scroll state preserved on return (history state), compare tray persists. |
| **d. Gym page → back** | Reverse FLIP if returning to the originating list (hero collapses toward the card position), else Level 1. Under 400ms — returns must feel faster than arrivals. |
| **e. Builder → Published gym page (the reveal)** | The ceremony: on Publish, preview pane expands to full-screen (500ms), a copper progress sweep crosses once, then the REAL /gym/:slug replaces the preview seamlessly with a one-time "Your page is live ✦" toast + confetti-free glow pulse (800ms). The emotional payoff of the entire owner funnel. |
| **f. → 404** | Instant Level 1 fade (200ms) — errors never deserve theatre. |
| **g. → Legal** | Fastest transition class (250ms crossfade); reading pages, zero drama. |
| **h. Partner ↔ Pricing** | Level 1, but the pricing-preview component position is visually echoed (cards in same grid coordinates) creating implicit continuity without a literal shared element. |

**Loading between routes:** if the next route's data isn't ready in 150ms, show the copper thread progress bar (2px, top of viewport, indeterminate sweep). If >600ms, the destination's skeleton layout appears under it. Never a blank screen, never a spinner-only page.

**Logo animation:** the GM monogram has one canonical draw: the G-stroke sweeps in (copper gradient tracing, 700ms) then the M settles (200ms overlap). Used ONLY at: first-visit splash (D12) and builder publish ceremony. It never plays on routine navigations (specialness through scarcity).

---

# DELIVERABLE 8 — DESIGN SYSTEM

### 8.1 Color tokens (locked — from poster)
`navy #1f2d3d` · `navy-deep #141f2b` · `navy-raised #1a2735` (dark-section cards) · `copper #c46a4a` · `copper-soft #d98d6a` · `copper-dark #9c4f33` · `paper #faf8f5` · `card #ffffff` · `ink #22303f` · `muted #65717e` · `line #e9e4de` · dark-mode text ramp: `#eef1f4 / #c3ccd6 / #93a1b0` · brand gradient `linear-gradient(100deg, #1f2d3d 0%, #4a3f43 45%, #c46a4a 100%)` · copper text-gradient `linear-gradient(115deg, #d98d6a, #c46a4a 55%, #9c4f33)` · functional: success `#3d8168`, error `#b3483d`, warning `#b07a2e` (derived warm-muted, harmonized — used ONLY in form/system states, never marketing).

### 8.2 Typography
Archivo Expanded 700–900 (display, prices, stats) · Archivo 500–900 (headings, labels, buttons) · Inter 400–600 (body, forms). Scale per D4. Rules: display always uppercase; body never justified; max line length 65ch; gradient text only on `paper` or `navy-deep` heroes/stats (never on buttons or body).

### 8.3 Spacing & 8.4 Grid/Containers — per D4/D5 (4px scale; 12-col/24px desktop, 6-col/16px tablet, 4-col/16px mobile; containers 1200/720px).

### 8.5 Buttons
- **Primary:** copper bg, white text, Archivo 800 15px tracked 1px, radius 14, padding 16×32 (52px tall mobile). Hover: copper-soft shift + lift -2px + shadow-md. Active: scale .98. On-dark variant: white bg, navy text (poster CTA button).
- **Secondary:** 1.5px navy outline, navy text; hover fills navy 6%.
- **Tertiary:** copper text link + arrow that slides 4px on hover; underline grows on focus.
- **Destructive (builder only):** error color, same geometry.
- All: focus-visible = 2px copper ring offset 2px; disabled = 40% opacity + no pointer; loading = inline spinner replacing label, width locked (no jump).

### 8.6 Cards
White, 1px `line`, radius 20, shadow-sm, padding 24–30. Hover (interactive only): -4px lift, shadow-md. Dark variant: `navy-raised`, border `rgba(196,106,74,.18)`. Featured/POPULAR variant: 2px copper border + gradient badge. Ghost variant: dashed `line` border, transparent bg (e.g., "your gym here").

### 8.7 Inputs
Height 52px, radius 14, white bg, 1px `line` border, 16px Inter. Label above (Archivo 700 13px), always visible. Focus: copper border + 3px copper 12%-alpha ring. Error: error border + 13px message with icon below. Success: subtle check suffix. Select/textarea/radio/checkbox share the geometry; checkboxes 20px radius-6 copper-filled when checked; toggles 44×24 with copper on-state.

### 8.8 Badges & 8.9 Tags
- **Tier badges:** plaque style (D3 H4): Archivo Expanded wordmark, copper-gradient intensity ascending A→Elite; sizes 24px (cards) / 32px (heroes) / 64px (tier showcase).
- **Verified Member badge:** copper check-shield + "Verified Member", 12px Archivo 800.
- **Status badges:** Open (success-tint pill) / Closed (muted pill) / POPULAR (gradient pill, poster style).
- **Tags/chips:** pill radius-100, 13px, 1px line border; selected = navy bg white text; filter chips get count suffix.

### 8.10 Shadows
`sm: 0 1px 2px rgba(31,45,61,.04)` · `md: 0 14px 30px rgba(31,45,61,.10)` · `lg: 0 18px 40px rgba(196,106,74,.16)` (copper-tinted — reserved for brand moments: POPULAR card, phone mockups, CTA boxes) · `overlay: 0 24px 60px rgba(20,31,43,.28)`.

### 8.11 Borders & 8.12 Radius
Borders: 1px `line` (light) / 1px copper-18% (dark) / 2px copper (emphasis). Radius: `sm 14` (buttons/inputs) · `md 20` (cards) · `lg 28` (CTA boxes/heroes) · `pill 100px` · images inherit container.

### 8.13 Icons
Poster system: 24px grid, 2px stroke, round caps/joins, copper stroke on light (white on dark), no fills. Housed in 46px "soft gradient square" (`linear-gradient(135deg, rgba(31,45,61,.08), rgba(196,106,74,.14))`, radius 13) when featured. Single set (Lucide-compatible geometry), never mixed families.

### 8.14 Illustrations
No character illustrations (fights premium tone). Permitted: line-drawn diagrams in icon stroke language, the QR motif, monogram watermarks at ≤4% opacity, product mockups (phone/browser frames with soft `lg` shadows). Photography: real gym imagery, warm-graded (slight copper lift in highlights, navy in shadows) — a written photo-treatment rule so all gym covers feel related.

### 8.15 Gradient usage (rationing = luxury)
Brand gradient ONLY on: hero display text, stat numerals, step/number circles, chips/badges, final CTA boxes, progress fills. NEVER on: body text, backgrounds of content sections, buttons (except CTA-box context), borders (except Elite). The copper text-gradient variant only for stats on dark.

### 8.16 Glass usage
Exactly one glass surface: the scrolled navigation bar (paper 88% + blur 12px). Nothing else blurs. (Restraint is the brand.)

### 8.17 Copper usage law
Copper = meaning: interactive, verified, or earned. If everything is copper, nothing is trusted. Per viewport: ≤1 copper CTA, plus eyebrows/accents. Copper never decorates a negative state.

### 8.18 Dark sections
`navy-deep` bg + one copper radial glow (`radial-gradient(circle, rgba(196,106,74,.22), transparent 70%)`, 460px, corner-anchored) + text ramp per 8.1. Used for: problem acts, tier showcase, review section, ROI strip, 404, mobile nav overlay. Rule: a dark section always earns its darkness (drama or gravity), never used for variety alone.

### 8.19 Light sections
`paper` default; `card`-white only inside components. Section transitions between paper↔navy are hard cuts (no gradient fades between sections — poster behavior; cuts feel editorial).

### 8.20 Interactive states (all interactive elements define all six)
default · hover (desktop) · focus-visible (always, copper ring) · active/pressed (scale .98 or fill deepen) · disabled (40% + cursor) · loading (skeleton or in-button spinner).

### 8.21 Empty states
Icon (stroke style) + one honest sentence + one recovery action. Defined for: no search results, no reviews yet ("This gym is new to Gymma — reviews unlock as verified members complete 14 days + 5 workouts", turning emptiness into a trust lesson), no classes/trainers (section auto-hides instead), builder skipped items.

### 8.22 Loading states & skeletons
Skeletons mirror true layout geometry (cards, hero, review rows) in `#f1ede8` with a 1.2s shimmer sweep; appear only after 300ms; max one shimmer region per viewport. Buttons load in-place. Route loading = copper thread bar (D7).

### 8.23 Error states
Inline field errors (8.7); page-level = error card with retry; full-route failure = friendly block with call fallback ("Or just call us — 95912 76584" — on-brand for India). Never raw error text, never blame language.

### 8.24 Success states
Check-morph in buttons (400ms spring) · success cards with next-step CTA (forms) · the publish ceremony (D7-e). Success always answers "what now?".

---

# DELIVERABLE 9 — SCROLL STORYTELLING (Homepage emotional arc)

One story: **"Trust is earned — here's how we built a machine for it."**

| Act | Section | The visitor feels | Carried into next act by |
|---|---|---|---|
| 1 | Hero | *Intrigue + instant orientation* — "premium, Indian, about gyms and trust" | The tagline's promise demands proof → |
| 2 | Problem (dark) | *Recognition* — "that's literally my WhatsApp group / my gym search" | Tension needs release → |
| 3 | The Idea | *Revelation* — "reviews only from paying members… why doesn't this exist already?" | If reviews are earned, what do they add up to? → |
| 4 | Tiers (dark) | *Aspiration + gravity* — "this is a standard, like Michelin" | Standards are abstract; show me real gyms → |
| 5 | Seekers + Featured gyms | *Agency* — "I can actually use this right now" (many exit here into gym pages — a WIN, not a leak) | Those gym pages are powered by an app… → |
| 6 | Members (pinned phone) | *Delight* — "my gym, my plan, my food, in my pocket" | Someone gives you this app: the gym → |
| 7 | Owners | *Ambition (owner) / reassurance (seeker)* — "my gym could look like this" / "gyms here actually care" | Convinced? How hard is it? → |
| 8 | How it works | *Relief* — "three steps, 48 hours, I could do this" | What does it cost? → |
| 9 | Pricing preview | *Respect* — "they just… show the price. No games." | Nothing left to doubt → |
| 10 | Final CTA | *Resolve* — "start the trial / find my gym" | — |

Pacing check: two dark acts (2, 4) in the first half create the cinematic spine; the second half is bright, practical, accelerating — story first, utility close. Every act ends with a visual vector (line, gradient direction, or CTA) pointing downward into the next.

---

# DELIVERABLE 10 — FEATURED GYM FLOW

**Where it starts:** Act 5 on Home (H5) — three real gym cards + ghost card; also P4 on Partner ("see a live page").

**Presentation:** Cards use REAL data (name, real photo, tier, rating, review count, area). Curation rule: featured gyms must be GYMM-AA+ with ≥10 verified reviews and strong photography (the featured slot is itself an earned tier perk — consistent with brand logic). Distance shown only if geolocation was granted earlier; never prompt for location just for this section.

**The transition (trust-preserving):** Click → shared-element FLIP (D7-a): the card's photo grows into the gym hero, name text migrates to hero position, the rest of Home exhales away. Perceived meaning: *"I didn't leave Gymma — I zoomed into one gym."* The gym page's "◆ Verified by Gymma" chip appears in the exact screen region the Gymma nav occupied — the brand hands over custody visibly.

**Inside the gym page:** the visitor experiences the full template (D11). Trust reinforcement en route: tier badge in hero (repetition of Act 4), verified-review explainer popover (repetition of Act 3), disclaimer at reviews end (honesty).

**The return:** Browser back or the "◆ Verified by Gymma → All gyms" breadcrumb reverses the FLIP into the same card, with Home scroll position exactly restored (history state). The visitor lands where they left, mid-story, with the featured section now "warm" (visited card shows a subtle "Viewed ✓" state) — encouraging comparison of the other two.

**Fallback behaviors:** direct-load of /gym/:slug (QR case) skips all shared-element logic — standard hero entrance. Slow data: card expands into a hero skeleton (geometry preserved), content hydrates in place — the transition never blocks on data.

---

# DELIVERABLE 11 — GYM PAGE UX (template contract)

Fixed template; content-only variation; graceful section collapse (empty sections + their nav chips vanish; minimum viable page = Hero, About, Location, Contact — the auto-generated baseline from builder step B1).

- **Navigation:** dual-layer — global nav auto-hides on scroll-down (gym gets the stage), sticky in-page chip nav (GP2) takes over wayfinding. Scroll-spy drives active chip; anchors respect sticky offsets.
- **Section order (locked):** Hero → About → Gallery → Facilities → Equipment → Classes → Trainers → Plans → Reviews → Location → Join CTA → Footer. Rationale: identity → proof-by-imagery → practical substance → people → price → social proof (dark climax) → logistics → conversion. Reviews deliberately AFTER plans: seeing price first makes reviews the "final check" that tips into the adjacent Join form.
- **Sticky navigation:** chips bar per GP2; on mobile also the bottom action bar per GP13 (Join/Call/Directions), mutually aware (chips top, actions bottom, never stacked overlays).
- **Gallery interaction:** category chips filter grid (150ms crossfade); lightbox with FLIP-zoom open, swipe/arrows, pinch on mobile, swipe-down dismiss; neighbor preload.
- **Membership cards:** gym's own plans, poster card DNA, recommended plan accented; tapping a plan pre-selects it in the Join form (scroll + prefill — a continuity microflow).
- **Trainer cards:** portrait 3:4, certification chips as the design centerpiece; desktop grid / mobile 72vw snap carousel; no dead-end profiles in V1 (cards are non-navigating; PT pricing shown inline if provided).
- **Review layout:** per GP10 — dark act, score + six dimension bars sticky-left on desktop, cards right; explainer popover; month-only dates; Verified badge every card; sort control; "show more" ×8; verbatim disclaimer at end.
- **Facilities/Equipment:** chips grid / category cards with mobile accordion (GP5/6); absent items never displayed.
- **Location:** static branded map tile → Google Maps deep link; hours table, today highlighted, live Open/Closed consistent with hero badge.
- **Contact/Join CTA:** gradient box + inquiry form (GP12); tel/WhatsApp first on mobile; success state promises 24h follow-up.
- **Desktop behaviour:** 1200px container inside full-bleed bands; hero 68vh; two-column compositions (about, reviews, location); hover states live.
- **Mobile behaviour:** hero 52vh with actions delegated to bottom bar; all grids → stacks or snap carousels; accordions for equipment/hours; every conversion action within thumb reach at all times (bottom bar) — the page's mobile thesis.

---

# DELIVERABLE 12 — LOADING EXPERIENCE

- **First visit splash (once per session, only if fonts+hero not ready in 400ms):** paper screen, GM monogram draw (D7 logo animation, 700ms) + "GYMMA" settle; dissolves 250ms into the hero entrance (which continues the motion — splash and hero are one choreography, not two). Hard cap 1.8s: past it, dissolve regardless. Returning visitors with warm cache skip it entirely.
- **Logo animation:** only at splash + publish ceremony (scarcity rule, D7).
- **Route transitions:** copper thread bar after 150ms; destination skeleton after 600ms (D7).
- **Skeletons:** geometry-true, 300ms-delayed, single shimmer (8.22). Skeletoned surfaces: gym hero, gym card grids, review lists, builder preview. Never skeleton legal/text pages (instant anyway).
- **Image loading:** blur-up (24px intrinsic placeholder scaled + 20px blur → 250ms unblur on load); aspect-ratio boxes reserve space (zero CLS); `fetchpriority=high` on LCP images only; everything else `loading=lazy` + IO rootMargin 400px.
- **Lazy mounting:** below-fold heavy sections (gallery, reviews, compare overlay, lightbox, builder steps) are code-split and mount on approach (IO 600px) — invisible to the user, no pop-in (space reserved).
- **Page-data loading:** gym page streams hero-critical data first (name, cover, rating), sections hydrate progressively top-down — the page is readable in reading order before it is complete.

---

# DELIVERABLE 13 — PERFORMANCE STRATEGY

**Budgets (hard):** 60fps on all animated surfaces (mid-range Android target for mobile paths) · Lighthouse ≥90 all four categories on / and /gym/:slug (mobile) · JS initial route ≤180KB gz · LCP <2.0s (fast 4G) · CLS <0.05 · INP <200ms.

- **Images:** AVIF→WebP→JPEG fallback chain; srcset at 400/800/1200/1600; covers ≤180KB, thumbs ≤60KB; blur-up placeholders inlined (<1KB each); gym photos routed through an image-resizing CDN path; zero decorative raster (glows/gradients are CSS).
- **Animation:** transform+opacity only, everywhere, no exceptions; `will-change` applied on pin/transition start and removed on end; loops pause on `visibilitychange`; scroll work through IO + rAF (no scroll-handler layout reads); FLIP measurements batched once per transition.
- **Code splitting:** route-level chunks (home / gyms / gym / partner / pricing / builder / contact / legal+404) + component-level for lightbox, compare overlay, builder steps, GSAP.
- **Lazy loading:** per D12; below-fold sections `content-visibility: auto` with `contain-intrinsic-size` hints.
- **IntersectionObserver:** the only scroll-awareness primitive outside GSAP pins — reveals, scroll-spy, lazy mounts, counter triggers; shared observer instances per threshold config.
- **GSAP:** loaded ONLY on desktop (≥1024 + fine pointer + no reduced-motion), only on routes with pins (home, partner P3); dynamically imported; ScrollTrigger instances killed on route exit. Estimated cost ~28KB gz — desktop-only spend.
- **Framer Motion:** the general animation layer (route transitions, reveals via `whileInView`, FLIP shared elements, springs); `LazyMotion` + `domAnimation` subset (~18KB) to keep the base slim.
- **Lenis:** desktop-only dynamic import; destroyed on overlay open (native scroll inside modals) and re-synced with ScrollTrigger.
- **Desktop-only enhancements:** Lenis, GSAP pins, parallax/mouse drift, hover systems, splash draw.
- **Mobile simplifications:** Levels 3–5 motion only, shorter durations, static compositions, native scroll/snap everywhere, no blur beyond nav (blur is GPU-expensive on low-end Android), font subset preloaded (Archivo 700/800/900 + Expanded 900 + Inter 400/600 — WOFF2 subsets, `font-display: swap`, metrics-adjusted fallbacks to kill CLS).

---

# DELIVERABLE 14 — IMPLEMENTATION PLAN (phases only — no code yet)

| Phase | Scope | Exit criteria |
|---|---|---|
| **1 · Foundation & Design System** | Vite+React+TS+Tailwind scaffold; design tokens (colors, type, spacing, radii, shadows, motion tokens); base primitives (Button, Card, Input, Badge, Chip, Container, Section, Eyebrow, Accordion, Sheet); icon set; font pipeline; reduced-motion global switch; skeleton + state primitives | Storybook-style token/primitive review page matches D8 exactly; a11y states verified keyboard-only |
| **2 · Shell, Routing & Motion Infrastructure** | Router + route map; global nav (glass scroll behavior, mobile overlay); footer; Level 1 route transitions; copper thread loader; Lenis/GSAP/Framer loading strategy (desktop gates); scroll restoration; 404; legal layout + content pages | Navigate all routes with correct transitions on desktop+mobile; Lighthouse baseline ≥95 on empty pages |
| **3 · Homepage** | H1–H10 in order; the three Level 2 story moments (pin budget) built and tuned desktop, recomposed mobile; featured-gym cards on live data | Full scroll story matches D3.2/D9; 60fps verified on pins; mobile completely pin-free |
| **4 · Gym Page Template** | GP1–GP13; shared-element transition from featured cards; gallery+lightbox; reviews dark act; inquiry form; mobile sticky bar; graceful section collapse; skeleton/streaming behavior | Template renders 3 wildly different real gyms (photo-rich, minimal, classes-heavy) premium in all cases; D10 flow round-trip works with scroll restoration |
| **5 · Discover, Pricing, Partner, Contact** | /gyms (search, filters rail/sheet, cards, compare tray+overlay, empty states); /pricing (tiers, capacity slider, anchor table, FAQ); /partner (P1–P9); /contact | Seeker funnel (home→gyms→gym→inquiry) and owner funnel (home→partner→pricing) complete end-to-end |
| **6 · Website Builder** | /partner/start wizard B0–B7; live preview pane reusing GP components; autosave; image compression pipeline; publish ceremony transition | An owner can go from nothing to a live premium gym page in <15 min on mobile |
| **7 · Polish, Performance & Accessibility Audit** | Motion QA pass (timing feel, stagger discipline); perf budgets enforced (bundle analysis, image audit, INP traces on mid-range Android); full keyboard/SR pass; reduced-motion pass; empty/error/loading state sweep; cross-browser (Chrome/Safari/Firefox + Android WebView) | Lighthouse ≥90×4 mobile on / and /gym/:slug; zero keyboard traps; every D8.20–8.24 state reachable and correct |

**Build order rationale:** tokens before components before pages (no drift); the gym template before discover (cards need the destination); builder last (it consumes the finished template as its preview).

---

*End of blueprint. Any implementation question not answered here should be resolved by: (1) the Gymma docs, (2) the poster's visual precedent, (3) the restraint principle — when in doubt, calmer, quieter, fewer.*

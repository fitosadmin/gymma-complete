import type {
  GymSummary,
  GymDetail,
  Trainer,
  MembershipPlan,
  GymClass,
  Faq,
  Review,
} from "@/types/gym";
import { DETAIL_EXTRAS } from "@/lib/gyms.generated";

// Seeded RNG so every gym's generated detail is stable across builds (good for
// static generation + consistent snapshots). Replaced by real API data later.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const round100 = (n: number) => Math.round(n / 100) * 100;
const clampScore = (n: number) => Math.max(3, Math.min(5, Math.round(n * 10) / 10));

const TRAINER_NAMES = [
  "Arjun Mehta", "Priya Nair", "Rohit Sharma", "Sneha Reddy",
  "Vikram Singh", "Ananya Iyer", "Karthik Rao", "Deepika Joshi",
];
const SPECIALIZATIONS = [
  "Strength & Conditioning", "Weight Loss", "Bodybuilding", "Functional Training",
  "CrossFit Coaching", "Yoga & Mobility", "Powerlifting", "Nutrition & Fat Loss",
];
const LANGUAGES = [
  ["Hindi", "English"], ["Kannada", "English"], ["English", "Tamil"],
  ["Hindi", "English", "Kannada"], ["Telugu", "English"],
];

function buildTrainers(slug: string): Trainer[] {
  const r = rng(hash(slug + "trainers"));
  const count = 3 + Math.floor(r() * 2); // 3–4
  const used = new Set<number>();
  const out: Trainer[] = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(r() * TRAINER_NAMES.length);
    while (used.has(idx)) idx = (idx + 1) % TRAINER_NAMES.length;
    used.add(idx);
    out.push({
      id: `${slug}-t${i}`,
      name: TRAINER_NAMES[idx],
      yearsExperience: 3 + Math.floor(r() * 10),
      languages: LANGUAGES[Math.floor(r() * LANGUAGES.length)],
      specialization: SPECIALIZATIONS[Math.floor(r() * SPECIALIZATIONS.length)],
      pricePerSession: round100(400 + r() * 500),
    });
  }
  return out;
}

function buildPlans(m: number): MembershipPlan[] {
  const monthly = round100(m);
  const quarterly = round100(m * 2.7);
  const halfYearly = round100(m * 5);
  const annual = round100(m * 9.5);
  return [
    {
      id: "p-monthly", name: "Monthly", durationMonths: 1, price: monthly,
      benefits: ["Full gym access", "1 PT session", "Locker access"],
    },
    {
      id: "p-quarterly", name: "Quarterly", durationMonths: 3, price: quarterly,
      benefits: [`Save ${inr(m * 3 - quarterly)}`, "4 PT sessions", "Full gym access"],
    },
    {
      id: "p-halfyearly", name: "Half-Yearly", durationMonths: 6, price: halfYearly,
      benefits: [`Save ${inr(m * 6 - halfYearly)}`, "10 PT sessions", "Free diet plan"],
    },
    {
      id: "p-annual", name: "Annual", durationMonths: 12, price: annual, recommended: true,
      benefits: [`Save ${inr(m * 12 - annual)}`, "Unlimited PT", "Free diet plan", "2 guest passes"],
    },
  ];
}

function buildClasses(slug: string, trainers: Trainer[]): GymClass[] {
  const names: [string, string, number][] = [
    ["Morning Yoga Flow", "Mon, Wed, Fri · 6:00 AM", 60],
    ["HIIT Burn", "Tue, Thu · 7:00 PM", 45],
    ["Strength Circuit", "Mon–Sat · 8:00 AM", 50],
    ["Zumba", "Wed, Sat · 6:30 PM", 45],
  ];
  const r = rng(hash(slug + "classes"));
  return names.map(([name, schedule, durationMin], i) => ({
    id: `${slug}-c${i}`,
    name,
    schedule,
    durationMin,
    trainerName: trainers[Math.floor(r() * trainers.length)].name,
  }));
}

function buildFaqs(g: GymSummary): Faq[] {
  return [
    {
      id: "f1",
      question: "What are the gym timings?",
      answer: "Open 5:00 AM–10:00 PM on weekdays and 6:00 AM–8:00 PM on weekends. Timings may vary on public holidays.",
    },
    {
      id: "f2",
      question: "Is a free trial available?",
      answer: "Yes - a complimentary trial session is available for new visitors. Send an inquiry to book your slot.",
    },
    {
      id: "f3",
      question: "Do you offer personal training?",
      answer: "Certified personal trainers are available across strength, weight loss, and functional training. Session pricing is listed in the Trainers section.",
    },
    {
      id: "f4",
      question: g.hasParking ? "Is parking available?" : "Is there a women's section?",
      answer: g.hasParking
        ? "Yes, two-wheeler and four-wheeler parking is available on-site for members."
        : "Dedicated women-only training hours and sections are available. Check with the front desk for the current schedule.",
    },
  ];
}

const GALLERY_CATEGORIES = ["Exterior", "Reception", "Workout Area", "Equipment", "Washroom", "Parking"];

export function buildGymDetail(g: GymSummary): GymDetail {
  const r = rng(hash(g.slug));
  const trainers = buildTrainers(g.slug);
  const certPool = ["ISO 9001 Certified", "Certified Trainers", "Govt. Registered", "Insured Facility"];
  const certifications = certPool.filter(() => r() > 0.4).slice(0, 3);
  const extras = DETAIL_EXTRAS[g.slug];
  const phone = extras?.phone || `+91 98${Math.floor(10000000 + r() * 89999999)}`;

  return {
    ...g,
    description: `${g.name} is a ${g.isPremium ? "premium " : ""}fitness destination in ${g.area}, ${g.city}, built for everyone from first-timers to serious lifters. With ${g.amenities.length}+ amenities and certified coaches, it balances modern equipment with a community that keeps you coming back. Flexible memberships and transparent pricing make it easy to get started.`,
    yearsOperating: 2 + Math.floor(r() * 13),
    certifications: certifications.length ? certifications : ["Certified Trainers"],
    scores: {
      cleanliness: clampScore(g.rating + 0.1),
      equipment: clampScore(g.rating - 0.2),
      trainers: clampScore(g.rating),
      value: clampScore(g.rating - 0.3),
      crowd: clampScore(g.rating - 0.5),
    },
    trainers,
    plans: buildPlans(g.pricePerMonth),
    classes: buildClasses(g.slug, trainers),
    faqs: buildFaqs(g),
    gallery: extras?.gallery?.length ? extras.gallery : GALLERY_CATEGORIES,
    phone,
    whatsapp: phone,
    addressLine:
      extras?.addressLine ||
      `${10 + Math.floor(r() * 90)}, ${g.area} Main Road, ${g.city} - 5600${10 + Math.floor(r() * 89)}`,
  };
}

const REVIEW_BODIES = [
  "Great equipment and very well maintained. The trainers actually pay attention and correct your form.",
  "Clean, spacious, and never too crowded even during peak hours. Worth every rupee.",
  "Good variety of machines and free weights. Locker rooms could be slightly better but overall solid.",
  "Trainers are knowledgeable and friendly. The diet guidance helped me a lot in my cut.",
  "Decent gym for the price. AC works well and the music keeps the energy up.",
  "Joined three months ago and already seeing results. The group classes are a highlight.",
  "Parking is convenient and the staff is helpful. Would recommend to anyone in the area.",
  "Equipment is on the newer side. Wish it stayed open a little later on weekends.",
];

export function buildReviews(g: GymSummary): Review[] {
  const r = rng(hash(g.slug + "reviews"));
  const real = DETAIL_EXTRAS[g.slug]?.reviews ?? [];
  if (real.length) {
    return real.map((rv, i) => ({
      id: `${g.slug}-r${i}`,
      rating: rv.rating,
      body: rv.text,
      authorLabel: "Verified Member",
      createdAt: new Date(rv.time * 1000).toISOString(),
      helpfulCount: Math.floor(r() * 40),
    }));
  }
  const count = 5 + Math.floor(r() * 4); // 5–8
  const now = Date.now();
  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    const delta = i === 0 ? 0.3 : (r() - 0.5) * 1.4;
    const rating = Math.max(3, Math.min(5, Math.round((g.rating + delta) * 2) / 2));
    const daysAgo = Math.floor(r() * 180) + i;
    out.push({
      id: `${g.slug}-r${i}`,
      rating,
      body: REVIEW_BODIES[Math.floor(r() * REVIEW_BODIES.length)],
      authorLabel: "Verified Member",
      createdAt: new Date(now - daysAgo * 86400000).toISOString(),
      helpfulCount: Math.floor(r() * 40),
    });
  }
  return out;
}

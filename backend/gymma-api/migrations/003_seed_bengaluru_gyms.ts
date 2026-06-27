// migrations/003_seed_bengaluru_gyms.ts
// Self-contained seed so the API returns real-looking data on day one.
//
// PROD NOTE: the architecture doc points this at the frontend's
// `gyms.generated.ts` (40+ gyms w/ Google Places data). To use that, import
// MOCK_GYMS / DETAIL_EXTRAS from it, run buildGymDetail/buildReviews, and feed
// the same insert helpers below. The sample data here keeps the repo runnable
// standalone.
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const RUPEE = 100; // paise per rupee

interface SeedGym {
  slug: string;
  name: string;
  area: string;
  description: string;
  phone: string;
  whatsapp: string;
  addressLine: string;
  lat: number;
  lng: number;
  pricePerMonth: number; // rupees
  isPremium: boolean;
  womenFriendly: boolean;
  hasParking: boolean;
  opensAt: string;
  closesAt: string;
  yearsOperating: number;
  coverImageUrl: string;
  amenities: string[];
  trainers: { name: string; specialization: string; years: number; price: number; langs: string[] }[];
  plans: { name: string; months: number; price: number; benefits: string[]; recommended?: boolean }[];
  classes: { name: string; schedule: string; durationMin: number; trainer: string }[];
  faqs: { q: string; a: string }[];
  gallery: { url: string; caption: string }[];
  certifications: string[];
  reviews: { author: string; rating: number; body: string; helpful: number }[];
}

const GYMS: SeedGym[] = [
  {
    slug: 'cult-fit-indiranagar',
    name: 'Cult.fit Indiranagar',
    area: 'Indiranagar',
    description: 'Modern strength and functional training studio in the heart of Indiranagar.',
    phone: '08041234567',
    whatsapp: '919876543210',
    addressLine: '100 Feet Road, Indiranagar',
    lat: 12.9716,
    lng: 77.6412,
    pricePerMonth: 2500,
    isPremium: true,
    womenFriendly: true,
    hasParking: true,
    opensAt: '05:00',
    closesAt: '23:00',
    yearsOperating: 6,
    coverImageUrl: 'https://picsum.photos/seed/cultindi/800/500',
    amenities: ['Cardio', 'Weights', 'CrossFit', 'AC', 'Shower', 'Lockers', 'Group_Classes', 'Parking'],
    trainers: [
      { name: 'Arjun Rao', specialization: 'Strength & Conditioning', years: 8, price: 800, langs: ['English', 'Kannada', 'Hindi'] },
      { name: 'Meera Nair', specialization: 'Functional Fitness', years: 5, price: 700, langs: ['English', 'Malayalam'] },
    ],
    plans: [
      { name: 'Monthly', months: 1, price: 2500, benefits: ['Full gym access', 'Locker'] },
      { name: 'Quarterly', months: 3, price: 6500, benefits: ['Full gym access', 'Locker', '1 PT session'], recommended: true },
      { name: 'Annual', months: 12, price: 22000, benefits: ['Full gym access', 'Locker', '4 PT sessions', 'Diet consult'] },
    ],
    classes: [
      { name: 'HRX Workout', schedule: 'Mon/Wed/Fri 7:00 AM', durationMin: 45, trainer: 'Arjun Rao' },
      { name: 'Yoga Flow', schedule: 'Tue/Thu 6:30 AM', durationMin: 60, trainer: 'Meera Nair' },
    ],
    faqs: [
      { q: 'Do you offer trial sessions?', a: 'Yes, a free 1-day trial is available.' },
      { q: 'Is parking available?', a: 'Yes, two-wheeler and limited car parking.' },
    ],
    gallery: [
      { url: 'https://picsum.photos/seed/cultindi1/800/500', caption: 'Weights floor' },
      { url: 'https://picsum.photos/seed/cultindi2/800/500', caption: 'Functional zone' },
    ],
    certifications: ['ISO 9001', 'Certified Trainers'],
    reviews: [
      { author: 'Verified Member', rating: 5, body: 'Great equipment and trainers. Never too crowded.', helpful: 12 },
      { author: 'Verified Member', rating: 4, body: 'Good vibe, AC could be colder in peak hours.', helpful: 5 },
      { author: 'Verified Member', rating: 4.5, body: 'Clean and well maintained.', helpful: 8 },
    ],
  },
  {
    slug: 'gold-gym-koramangala',
    name: "Gold's Gym Koramangala",
    area: 'Koramangala',
    description: 'Full-service gym with a large free-weights section and certified trainers.',
    phone: '08049876543',
    whatsapp: '919812345678',
    addressLine: '5th Block, Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    pricePerMonth: 3000,
    isPremium: true,
    womenFriendly: false,
    hasParking: true,
    opensAt: '06:00',
    closesAt: '22:30',
    yearsOperating: 10,
    coverImageUrl: 'https://picsum.photos/seed/goldskora/800/500',
    amenities: ['Cardio', 'Weights', 'Sauna', 'Steam', 'Shower', 'Lockers', 'AC', 'PT', 'Parking'],
    trainers: [
      { name: 'Vikram Shetty', specialization: 'Bodybuilding', years: 12, price: 1000, langs: ['English', 'Kannada'] },
    ],
    plans: [
      { name: 'Monthly', months: 1, price: 3000, benefits: ['Full access'] },
      { name: 'Half-Yearly', months: 6, price: 15000, benefits: ['Full access', 'Sauna', '2 PT sessions'], recommended: true },
    ],
    classes: [
      { name: 'Spin Class', schedule: 'Mon/Wed 8:00 AM', durationMin: 45, trainer: 'Vikram Shetty' },
    ],
    faqs: [{ q: 'Is there a sauna?', a: 'Yes, sauna and steam are included in premium plans.' }],
    gallery: [{ url: 'https://picsum.photos/seed/goldskora1/800/500', caption: 'Cardio zone' }],
    certifications: ['Gold Standard Certified'],
    reviews: [
      { author: 'Verified Member', rating: 4.5, body: 'Best free weights section in Koramangala.', helpful: 20 },
      { author: 'Verified Member', rating: 4, body: 'Can get crowded after 6 PM.', helpful: 9 },
    ],
  },
  {
    slug: 'her-fit-jayanagar',
    name: 'HerFit Jayanagar',
    area: 'Jayanagar',
    description: 'Women-only fitness studio focused on strength, dance and wellness.',
    phone: '08026781234',
    whatsapp: '919823456789',
    addressLine: '4th Block, Jayanagar',
    lat: 12.925,
    lng: 77.5938,
    pricePerMonth: 1800,
    isPremium: false,
    womenFriendly: true,
    hasParking: false,
    opensAt: '06:00',
    closesAt: '20:00',
    yearsOperating: 3,
    coverImageUrl: 'https://picsum.photos/seed/herfitjaya/800/500',
    amenities: ['Cardio', 'Weights', 'Group_Classes', 'Womens_Section', 'Shower', 'Lockers', 'AC'],
    trainers: [
      { name: 'Divya Krishnan', specialization: 'Womens Strength', years: 6, price: 600, langs: ['English', 'Tamil', 'Kannada'] },
    ],
    plans: [
      { name: 'Monthly', months: 1, price: 1800, benefits: ['Full access', 'Group classes'] },
      { name: 'Quarterly', months: 3, price: 4800, benefits: ['Full access', 'Group classes', 'Diet plan'], recommended: true },
    ],
    classes: [
      { name: 'Zumba', schedule: 'Mon/Wed/Fri 6:00 PM', durationMin: 60, trainer: 'Divya Krishnan' },
    ],
    faqs: [{ q: 'Is this women-only?', a: 'Yes, HerFit is an exclusively women-only studio.' }],
    gallery: [{ url: 'https://picsum.photos/seed/herfitjaya1/800/500', caption: 'Studio floor' }],
    certifications: ['Women Safety Certified'],
    reviews: [
      { author: 'Verified Member', rating: 5, body: 'Safe, supportive and great trainers.', helpful: 15 },
      { author: 'Verified Member', rating: 4.5, body: 'Love the Zumba classes.', helpful: 7 },
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const g of GYMS) {
      const gym = await client.query<{ id: string }>(
        `INSERT INTO gyms
           (slug, name, description, area, city, phone, whatsapp, address_line,
            lat, lng, price_per_month, is_premium, women_friendly, has_parking,
            opens_at, closes_at, years_operating, cover_image_url, profile_score)
         VALUES ($1,$2,$3,$4,'Bengaluru',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          g.slug, g.name, g.description, g.area, g.phone, g.whatsapp, g.addressLine,
          g.lat, g.lng, g.pricePerMonth * RUPEE, g.isPremium, g.womenFriendly, g.hasParking,
          g.opensAt, g.closesAt, g.yearsOperating, g.coverImageUrl, 80,
        ],
      );
      if (gym.rowCount === 0) {
        console.log(`= skip ${g.slug} (exists)`);
        continue;
      }
      const gymId = gym.rows[0].id;
      console.log(`+ gym  ${g.slug}`);

      for (const a of g.amenities) {
        await client.query(
          `INSERT INTO gym_amenities (gym_id, amenity) VALUES ($1, $2::amenity_type)
           ON CONFLICT DO NOTHING`,
          [gymId, a],
        );
      }
      let i = 0;
      for (const t of g.trainers) {
        await client.query(
          `INSERT INTO trainers (gym_id, name, specialization, years_experience, price_per_session, languages, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [gymId, t.name, t.specialization, t.years, t.price * RUPEE, t.langs, i++],
        );
      }
      i = 0;
      for (const pl of g.plans) {
        await client.query(
          `INSERT INTO membership_plans (gym_id, name, duration_months, price, benefits, is_recommended, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [gymId, pl.name, pl.months, pl.price * RUPEE, pl.benefits, pl.recommended ?? false, i++],
        );
      }
      i = 0;
      for (const c of g.classes) {
        await client.query(
          `INSERT INTO gym_classes (gym_id, name, schedule, duration_min, trainer_name, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [gymId, c.name, c.schedule, c.durationMin, c.trainer, i++],
        );
      }
      i = 0;
      for (const f of g.faqs) {
        await client.query(
          `INSERT INTO gym_faqs (gym_id, question, answer, sort_order) VALUES ($1,$2,$3,$4)`,
          [gymId, f.q, f.a, i++],
        );
      }
      i = 0;
      for (const gal of g.gallery) {
        await client.query(
          `INSERT INTO gym_gallery (gym_id, url, caption, sort_order) VALUES ($1,$2,$3,$4)`,
          [gymId, gal.url, gal.caption, i++],
        );
      }
      for (const cert of g.certifications) {
        await client.query(
          `INSERT INTO gym_certifications (gym_id, label) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [gymId, cert],
        );
      }
      for (const rv of g.reviews) {
        await client.query(
          `INSERT INTO reviews (gym_id, author_label, rating, body, helpful_count, source)
           VALUES ($1,$2,$3,$4,$5,'platform')`,
          [gymId, rv.author, rv.rating, rv.body, rv.helpful],
        );
      }
    }

    await client.query('COMMIT');
    await client.query('REFRESH MATERIALIZED VIEW gym_rating_summary');
    console.log('seed complete + rating summary refreshed');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

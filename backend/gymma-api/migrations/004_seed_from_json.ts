import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockData(place: any, index: number): SeedGym {
  const name = place.name || `Gym ${index}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + index;
  const address = place.address || place.vicinity || '';
  
  // Try to extract area from address (usually before the city)
  let area = 'Bengaluru';
  if (address) {
    const parts = address.split(',');
    if (parts.length > 2) {
      area = parts[parts.length - 3].trim();
    } else {
      area = address.substring(0, 100);
    }
  }

  const pricePerMonth = randomInt(15, 60) * 100; // 1500 to 6000
  const isPremium = pricePerMonth >= 4000;
  
  const allAmenities = ['Weights', 'Cardio', 'AC', 'Swimming', 'Cafeteria', 'WiFi', 'Shower', 'Steam', 'Sauna', 'PT', "Womens_Section", "Group_Classes", "Lockers", "CrossFit"];
  // pick random 4-8 amenities
  const shuffledAmenities = [...allAmenities].sort(() => 0.5 - Math.random());
  const amenities = shuffledAmenities.slice(0, randomInt(4, 8));
  
  const hasParking = amenities.includes('Parking') || randomBool(0.7);
  if (hasParking && !amenities.includes('Parking')) amenities.push('Parking');

  const womenFriendly = amenities.includes("Womens_Section") || randomBool(0.6);

  // Generate 1-3 trainers
  const trainerNames = ['Rahul', 'Arjun', 'Meera', 'Divya', 'Vikram', 'Neha', 'Pooja', 'Karthik', 'Ravi', 'Sneha'];
  const trainers = Array.from({ length: randomInt(1, 3) }).map(() => ({
    name: randomItem(trainerNames) + ' ' + randomItem(['Rao', 'Shetty', 'Krishnan', 'Nair', 'Singh', 'Kumar', 'Gowda']),
    specialization: randomItem(['Strength & Conditioning', 'Functional Fitness', 'Bodybuilding', 'Yoga', 'Zumba']),
    years: randomInt(2, 15),
    price: randomInt(5, 15) * 100,
    langs: ['English', 'Kannada', 'Hindi'].filter(() => randomBool(0.7))
  }));
  if (trainers[0].langs.length === 0) trainers[0].langs.push('English');

  const plans = [
    { name: 'Monthly', months: 1, price: pricePerMonth, benefits: ['Full gym access', 'Locker'] },
    { name: 'Quarterly', months: 3, price: Math.round(pricePerMonth * 2.8), benefits: ['Full gym access', 'Locker', '1 PT session'], recommended: true },
    { name: 'Annual', months: 12, price: pricePerMonth * 10, benefits: ['Full gym access', 'Locker', '4 PT sessions', 'Diet consult'] }
  ];

  const classes = [];
  if (randomBool(0.6) && trainers.length > 0) {
    classes.push({
      name: randomItem(['Yoga Flow', 'Zumba', 'HIIT', 'Spin Class', 'Pilates']),
      schedule: randomItem(['Mon/Wed/Fri 7:00 AM', 'Tue/Thu 6:30 PM', 'Sat/Sun 8:00 AM']),
      durationMin: randomItem([45, 60]),
      trainer: trainers[0].name
    });
  }

  // Cover image from locally downloaded actual photos if available
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let coverImageUrl = `https://picsum.photos/seed/${slug}/800/500`;
  const gallery = [];
  
  if (place.photos && place.photos.length > 0) {
    coverImageUrl = `/images/gyms/${baseSlug}_0.jpg`;
    for (let i = 1; i < Math.min(place.photos.length, 5); i++) {
      gallery.push({ url: `/images/gyms/${baseSlug}_${i}.jpg`, caption: 'Gym Photo' });
    }
  } else {
    gallery.push({ url: `https://picsum.photos/seed/${slug}-1/800/500`, caption: 'Gym Floor' });
    gallery.push({ url: `https://picsum.photos/seed/${slug}-2/800/500`, caption: 'Cardio Section' });
  }

  const reviews = [];
  if (place.reviews && Array.isArray(place.reviews)) {
    for (const r of place.reviews) {
      reviews.push({
        author: r.author_name || 'Verified Member',
        rating: r.rating || randomInt(3, 5),
        body: (r.text || 'Good gym.').substring(0, 1950),
        helpful: randomInt(0, 20)
      });
    }
  } else {
    // Generate mock reviews based on rating
    const rating = place.rating || 4;
    const revCount = place.total_ratings ? Math.min(place.total_ratings, 5) : randomInt(1, 5);
    for (let i = 0; i < revCount; i++) {
      reviews.push({
        author: 'Verified Member',
        rating: Math.max(1, Math.min(5, Math.floor(rating + (Math.random() * 2 - 1)))),
        body: randomItem(['Great place to workout!', 'Friendly trainers and good equipment.', 'Clean and well maintained.', 'A bit crowded in the evenings, but good overall.']),
        helpful: randomInt(0, 10)
      });
    }
  }

  let opensAt = '06:00:00';
  let closesAt = '22:00:00';
  if (place.opening_hours && place.opening_hours.periods && place.opening_hours.periods.length > 0) {
    const period = place.opening_hours.periods[0];
    if (period.open && period.open.time) {
      opensAt = period.open.time.substring(0, 2) + ':' + period.open.time.substring(2, 4) + ':00';
    }
    if (period.close && period.close.time) {
      closesAt = period.close.time.substring(0, 2) + ':' + period.close.time.substring(2, 4) + ':00';
    }
  }

  return {
    slug,
    name,
    area: area.substring(0, 100),
    description: place.summary || `Welcome to ${name}. We provide top-notch fitness equipment and training.`,
    phone: place.phone_international || place.phone || '+91 99999 99999',
    whatsapp: place.phone_international || place.phone || '+91 99999 99999',
    addressLine: address,
    lat: place.location?.lat || 12.9716,
    lng: place.location?.lng || 77.5946,
    pricePerMonth,
    isPremium,
    womenFriendly,
    hasParking,
    opensAt,
    closesAt,
    yearsOperating: randomInt(1, 15),
    coverImageUrl,
    amenities,
    trainers,
    plans,
    classes,
    faqs: [
      { q: 'Are there trial classes?', a: 'Yes, we offer a 1-day free trial.' },
      { q: 'Is there car parking?', a: hasParking ? 'Yes, dedicated parking is available.' : 'No dedicated parking, but street parking might be available.' }
    ],
    gallery,
    certifications: isPremium ? ['ISO Certified', 'FitIndia Partner'] : [],
    reviews
  };
}

async function seed() {
  const jsonPath = path.join(__dirname, '../../../gyms.json');
  console.log('Reading', jsonPath);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const places = JSON.parse(rawData);
  console.log(`Loaded ${places.length} gyms from JSON.`);

  const client = await pool.connect();
  try {
    // await client.query('BEGIN');
    
    // Optional: Delete existing gyms to start fresh
    console.log('Deleting old gyms...');
    // await client.query('TRUNCATE gyms CASCADE');

    let count = 0;
    for (const place of places) {
      count++;
      const g = generateMockData(place, count);
      
      try {
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
          // already exists
          continue;
        }
        const gymId = gym.rows[0].id;
        
        if (count % 10 === 0) {
          console.log(`Seeded ${count}/${places.length} gyms...`);
        }

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
      } catch (err) {
        console.error(`Error inserting gym ${g.name}:`, err);
      }
    }

    // await client.query('COMMIT');
    await client.query('REFRESH MATERIALIZED VIEW gym_rating_summary');
    console.log('Seed complete! Inserted up to', places.length, 'gyms.');
  } catch (err) {
    // await client.query('ROLLBACK');
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

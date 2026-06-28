import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const RUPEE = 100; // paise per rupee

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBool(probability = 0.5) { return Math.random() < probability; }

function generateMockData(place: any, idx: number) {
  const name = place.name || `Gym ${idx}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + idx;
  const address = place.formatted_address || 'Bengaluru';
  const areaParts = address.split(',');
  const area = areaParts.length > 2 ? areaParts[areaParts.length - 3].trim() : 'Bengaluru';

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
    pricePerMonth: randomInt(1000, 5000),
    isPremium: randomBool(0.3),
    womenFriendly: randomBool(0.7),
    hasParking: randomBool(0.8),
    opensAt: '06:00:00',
    closesAt: '22:00:00',
    yearsOperating: randomInt(1, 15),
    coverImageUrl: `/images/gyms/${slug}_0.jpg`,
    amenities: ['wifi', 'parking'],
    trainers: [],
    plans: [],
    classes: [],
    faqs: [],
    gallery: [],
    certifications: [],
    reviews: []
  };
}

async function seed() {
  const jsonPath = path.join(__dirname, '../../../gyms.json');
  console.log('Reading', jsonPath);
  const places = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${places.length} gyms from JSON.`);

  const client = await pool.connect();
  try {
    for (const place of places) {
      const g = generateMockData(place, Math.random());
      await client.query(`
        INSERT INTO gyms
             (slug, name, description, area, city, phone, whatsapp, address_line,
              lat, lng, price_per_month, is_premium, women_friendly, has_parking,
              opens_at, closes_at, years_operating, cover_image_url, profile_score)
        VALUES ($1,$2,$3,$4,'Bengaluru',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT DO NOTHING
      `, [g.slug, g.name, g.description, g.area, g.phone, g.whatsapp, g.addressLine,
          g.lat, g.lng, g.pricePerMonth * RUPEE, g.isPremium, g.womenFriendly, g.hasParking,
          g.opensAt, g.closesAt, g.yearsOperating, g.coverImageUrl, 80]);
    }
    console.log('Seed complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

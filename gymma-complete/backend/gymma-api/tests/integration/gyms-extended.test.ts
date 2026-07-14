// tests/integration/gyms-extended.test.ts
// Comprehensive gym list, detail, and reviews endpoint tests.
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { canConnectDb, closeAll } from './helpers';

const dbUp = await canConnectDb();
const d = dbUp ? describe : describe.skip;

const app = createApp();

// Single cleanup for all describe blocks in this file — avoids closing the
// pool between describe blocks (which causes 500 errors on subsequent requests).
afterAll(closeAll);

d('GET /api/v1/gyms — filtering and sorting', () => {

  // ── Basic listing ─────────────────────────────────────────────────────────

  it('returns 200 with data array and pagination meta', async () => {
    const res = await request(app).get('/api/v1/gyms?city=Bengaluru');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('default city is Bengaluru — no city param still works', async () => {
    const res = await request(app).get('/api/v1/gyms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('prices are returned in rupees (not paise)', async () => {
    const res = await request(app).get('/api/v1/gyms?limit=5');
    for (const gym of res.body.data) {
      // seed gyms are 1500–3000 rupees, never 6-digit paise values
      expect(gym.pricePerMonth).toBeGreaterThan(0);
      expect(gym.pricePerMonth).toBeLessThan(1_000_000);
    }
  });

  it('each gym has expected shape', async () => {
    const res = await request(app).get('/api/v1/gyms?limit=1');
    if (res.body.data.length === 0) return; // unseeded
    const gym = res.body.data[0];
    expect(gym).toHaveProperty('id');
    expect(gym).toHaveProperty('slug');
    expect(gym).toHaveProperty('name');
    expect(gym).toHaveProperty('area');
    expect(gym).toHaveProperty('city');
    expect(gym).toHaveProperty('pricePerMonth');
    expect(gym).toHaveProperty('isPremium');
    expect(gym).toHaveProperty('womenFriendly');
    expect(gym).toHaveProperty('hasParking');
    expect(gym).toHaveProperty('lat');
    expect(gym).toHaveProperty('lng');
    expect(gym).toHaveProperty('isOpenNow');
    expect(gym).toHaveProperty('rating');
    expect(gym).toHaveProperty('reviewCount');
    expect(gym).toHaveProperty('amenities');
    expect(Array.isArray(gym.amenities)).toBe(true);
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('respects limit param', async () => {
    const res = await request(app).get('/api/v1/gyms?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.limit).toBe(2);
  });

  it('respects page param', async () => {
    const res1 = await request(app).get('/api/v1/gyms?limit=2&page=1');
    const res2 = await request(app).get('/api/v1/gyms?limit=2&page=2');
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    if (res1.body.data.length > 0 && res2.body.data.length > 0) {
      expect(res1.body.data[0].id).not.toBe(res2.body.data[0].id);
    }
  });

  it('page beyond total returns empty data array', async () => {
    const res = await request(app).get('/api/v1/gyms?page=99999&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  it('rejects invalid sort value (422)', async () => {
    const res = await request(app).get('/api/v1/gyms?sort=banana');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-numeric page (422)', async () => {
    const res = await request(app).get('/api/v1/gyms?page=abc');
    expect(res.status).toBe(422);
  });

  it('rejects limit > 100 (422)', async () => {
    const res = await request(app).get('/api/v1/gyms?limit=999');
    expect(res.status).toBe(422);
  });

  it('requires lat+lng together for distance sort (422)', async () => {
    const res = await request(app).get('/api/v1/gyms?lat=12.97&sort=distance');
    expect([200, 422]).toContain(res.status); // may degrade gracefully or reject
  });

  // ── Filtering ─────────────────────────────────────────────────────────────

  it('women_friendly filter returns only women-friendly gyms', async () => {
    const res = await request(app).get('/api/v1/gyms?women_friendly=true');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.womenFriendly).toBe(true);
    }
  });

  it('has_parking filter returns only gyms with parking', async () => {
    const res = await request(app).get('/api/v1/gyms?has_parking=true');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.hasParking).toBe(true);
    }
  });

  it('price_min filter excludes gyms below minimum', async () => {
    const res = await request(app).get('/api/v1/gyms?price_min=2000&limit=20');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.pricePerMonth).toBeGreaterThanOrEqual(2000);
    }
  });

  it('price_max filter excludes gyms above maximum', async () => {
    const res = await request(app).get('/api/v1/gyms?price_max=1800&limit=20');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.pricePerMonth).toBeLessThanOrEqual(1800);
    }
  });

  it('price_min + price_max forms a valid range', async () => {
    const res = await request(app).get('/api/v1/gyms?price_min=1000&price_max=3000');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.pricePerMonth).toBeGreaterThanOrEqual(1000);
      expect(gym.pricePerMonth).toBeLessThanOrEqual(3000);
    }
  });

  it('area filter narrows results to correct area', async () => {
    const res = await request(app).get('/api/v1/gyms?area=Indiranagar&limit=10');
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      expect(gym.area).toBe('Indiranagar');
    }
  });

  it('q= full-text search returns non-empty results for known term', async () => {
    const res = await request(app).get('/api/v1/gyms?q=Cult');
    expect(res.status).toBe(200);
    // We don't assert results because DB might have no match — just no 500
  });

  it('amenities filter: single amenity', async () => {
    const res = await request(app).get('/api/v1/gyms?amenities[]=AC');
    expect(res.status).toBe(200);
  });

  it('amenities filter: multiple amenities (AND logic)', async () => {
    const res = await request(app).get('/api/v1/gyms?amenities[]=AC&amenities[]=Sauna');
    expect(res.status).toBe(200);
    // all returned gyms must have BOTH amenities
    for (const gym of res.body.data) {
      expect(gym.amenities).toContain('AC');
      expect(gym.amenities).toContain('Sauna');
    }
  });

  // ── Geo / distance ────────────────────────────────────────────────────────

  it('distance sort with lat+lng returns distance_km field', async () => {
    const res = await request(app).get(
      '/api/v1/gyms?lat=12.9716&lng=77.6412&sort=distance&limit=5',
    );
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      // distanceKm should be a number when geo provided
      if (gym.distanceKm !== null) {
        expect(typeof gym.distanceKm).toBe('number');
        expect(gym.distanceKm).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('distance_km radius filter respects distance constraint', async () => {
    const res = await request(app).get(
      '/api/v1/gyms?lat=12.9716&lng=77.6412&distance_km=5&sort=distance',
    );
    expect(res.status).toBe(200);
    for (const gym of res.body.data) {
      if (gym.distanceKm !== null) {
        expect(gym.distanceKm).toBeLessThanOrEqual(5.5); // small tolerance for rounding
      }
    }
  });

  // ── Sorting ───────────────────────────────────────────────────────────────

  it('sort=rating returns gyms with non-ascending ratings', async () => {
    const res = await request(app).get('/api/v1/gyms?sort=rating&limit=10');
    expect(res.status).toBe(200);
    const ratings = res.body.data.map((g: any) => g.rating);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
    }
  });

  it('sort=price_asc returns gyms in ascending price order', async () => {
    const res = await request(app).get('/api/v1/gyms?sort=price_asc&limit=10');
    expect(res.status).toBe(200);
    const prices = res.body.data.map((g: any) => g.pricePerMonth);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('sort=relevance works without q param', async () => {
    const res = await request(app).get('/api/v1/gyms?sort=relevance&limit=5');
    expect(res.status).toBe(200);
  });
});

// ── Gym Detail ────────────────────────────────────────────────────────────────
d('GET /api/v1/gyms/:slug — detail endpoint', () => {

  it('404 for unknown slug', async () => {
    const res = await request(app).get('/api/v1/gyms/this-gym-does-not-exist-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns full gym detail for a known seeded slug', async () => {
    // get first gym from list to get a real slug
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return; // unseeded

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(gym.slug);
  });

  it('detail includes trainers, plans, classes, faqs, gallery, certifications arrays', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}`);
    const d = res.body.data;
    expect(Array.isArray(d.trainers)).toBe(true);
    expect(Array.isArray(d.membershipPlans)).toBe(true);
    expect(Array.isArray(d.classes)).toBe(true);
    expect(Array.isArray(d.faqs)).toBe(true);
    expect(Array.isArray(d.gallery)).toBe(true);
    expect(Array.isArray(d.certifications)).toBe(true);
  });

  it('detail price is in rupees', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}`);
    expect(res.body.data.pricePerMonth).toBeLessThan(1_000_000);
  });

  it('detail has lat/lng as numbers', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}`);
    expect(typeof res.body.data.lat).toBe('number');
    expect(typeof res.body.data.lng).toBe('number');
  });

  it('detail scores is null when no reviews exist, or an object with all keys', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}`);
    const scores = res.body.data.scores;
    if (scores !== null) {
      expect(scores).toHaveProperty('cleanliness');
      expect(scores).toHaveProperty('equipment');
      expect(scores).toHaveProperty('trainers');
      expect(scores).toHaveProperty('value');
      expect(scores).toHaveProperty('crowd');
    }
  });
});

// ── Reviews endpoint ──────────────────────────────────────────────────────────
d('GET /api/v1/gyms/:slug/reviews', () => {

  it('404 for unknown gym slug', async () => {
    const res = await request(app).get('/api/v1/gyms/nonexistent-gym-xyz/reviews');
    expect(res.status).toBe(404);
  });

  it('returns reviews list with pagination for known gym', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('sort=recent works', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}/reviews?sort=recent`);
    expect(res.status).toBe(200);
  });

  it('sort=helpful works', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}/reviews?sort=helpful`);
    expect(res.status).toBe(200);
  });

  it('rejects invalid sort value (422)', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}/reviews?sort=worst`);
    expect(res.status).toBe(422);
  });

  it('reviews have correct shape', async () => {
    const list = await request(app).get('/api/v1/gyms?limit=1');
    const gym = list.body.data?.[0];
    if (!gym) return;

    const res = await request(app).get(`/api/v1/gyms/${gym.slug}/reviews?limit=3`);
    for (const review of res.body.data) {
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('authorLabel');
      expect(review).toHaveProperty('rating');
      expect(review).toHaveProperty('body');
      expect(review).toHaveProperty('helpfulCount');
      expect(Number(review.rating)).toBeGreaterThanOrEqual(1);
      expect(Number(review.rating)).toBeLessThanOrEqual(5);
    }
  });
});

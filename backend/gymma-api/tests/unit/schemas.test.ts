// tests/unit/schemas.test.ts
// Unit tests for all Zod validation schemas — no DB/Redis needed.
import { describe, it, expect } from 'vitest';
import { createInquiryBody } from '../../src/modules/inquiries/inquiries.schema';
import { createDemoRequestBody } from '../../src/modules/demo-requests/demo-requests.schema';
import { createGymBody, updateGymBody, linkOwnerBody } from '../../src/modules/admin/admin.schema';
import { updateGymBody as ownerUpdateGymBody } from '../../src/modules/owner/owner.schema';
import { registerBody, loginBody } from '../../src/modules/auth/auth.schema';

// ── Inquiry schema ────────────────────────────────────────────────────────────
describe('inquiries schema', () => {
  const valid = {
    gymId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Rahul Sharma',
    phone: '9876543210',
  };

  it('accepts a valid payload', () => {
    expect(() => createInquiryBody.parse(valid)).not.toThrow();
  });

  it('rejects phone starting with 0-5 (not 6-9)', () => {
    expect(() => createInquiryBody.parse({ ...valid, phone: '1234567890' })).toThrow();
    expect(() => createInquiryBody.parse({ ...valid, phone: '5234567890' })).toThrow();
  });

  it('rejects phone with fewer than 10 digits', () => {
    expect(() => createInquiryBody.parse({ ...valid, phone: '987654321' })).toThrow();
  });

  it('rejects phone with more than 10 digits', () => {
    expect(() => createInquiryBody.parse({ ...valid, phone: '98765432101' })).toThrow();
  });

  it('rejects non-UUID gymId', () => {
    expect(() => createInquiryBody.parse({ ...valid, gymId: 'not-a-uuid' })).toThrow();
  });

  it('rejects name shorter than 2 chars', () => {
    expect(() => createInquiryBody.parse({ ...valid, name: 'A' })).toThrow();
  });

  it('rejects message longer than 500 chars', () => {
    expect(() =>
      createInquiryBody.parse({ ...valid, message: 'x'.repeat(501) }),
    ).toThrow();
  });

  it('accepts message at exactly 500 chars', () => {
    expect(() =>
      createInquiryBody.parse({ ...valid, message: 'x'.repeat(500) }),
    ).not.toThrow();
  });

  it('optional fields are truly optional', () => {
    const result = createInquiryBody.parse(valid);
    expect(result.message).toBeUndefined();
    expect(result.planInterest).toBeUndefined();
    expect(result.sourcePage).toBeUndefined();
    expect(result.utmSource).toBeUndefined();
  });
});

// ── Demo-request schema ───────────────────────────────────────────────────────
describe('demo-requests schema', () => {
  const valid = {
    name: 'Arjun Menon',
    phone: '9876543210',
    email: 'arjun@gym.in',
    gymName: 'Iron Paradise',
  };

  it('accepts valid payload', () => {
    expect(() => createDemoRequestBody.parse(valid)).not.toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => createDemoRequestBody.parse({ ...valid, email: 'bad-email' })).toThrow();
  });

  it('rejects phone not matching Indian mobile format', () => {
    expect(() => createDemoRequestBody.parse({ ...valid, phone: '0000000000' })).toThrow();
  });

  it('rejects memberCount outside allowed enum', () => {
    expect(() =>
      createDemoRequestBody.parse({ ...valid, memberCount: 'many' }),
    ).toThrow();
  });

  it('accepts all memberCount enum values', () => {
    for (const mc of ['<100', '100-300', '300-600', '600+'] as const) {
      expect(() =>
        createDemoRequestBody.parse({ ...valid, memberCount: mc }),
      ).not.toThrow();
    }
  });

  it('rejects gymName shorter than 2 chars', () => {
    expect(() => createDemoRequestBody.parse({ ...valid, gymName: 'X' })).toThrow();
  });

  it('rejects name shorter than 2 chars', () => {
    expect(() => createDemoRequestBody.parse({ ...valid, name: 'A' })).toThrow();
  });
});

// ── Admin createGym schema ────────────────────────────────────────────────────
describe('admin createGym schema', () => {
  const valid = {
    name: 'HSR Fitness Hub',
    area: 'HSR Layout',
    city: 'Bengaluru',
    lat: 12.9141,
    lng: 77.6411,
    pricePerMonth: 2000,
    isPremium: false,
    womenFriendly: false,
    hasParking: false,
  };

  it('accepts valid payload', () => {
    expect(() => createGymBody.parse(valid)).not.toThrow();
  });

  it('defaults city to Bengaluru', () => {
    const { city: _, ...noCity } = valid as any;
    const result = createGymBody.parse(noCity);
    expect(result.city).toBe('Bengaluru');
  });

  it('rejects lat out of range (-90 to 90)', () => {
    expect(() => createGymBody.parse({ ...valid, lat: 91 })).toThrow();
    expect(() => createGymBody.parse({ ...valid, lat: -91 })).toThrow();
  });

  it('rejects lng out of range (-180 to 180)', () => {
    expect(() => createGymBody.parse({ ...valid, lng: 181 })).toThrow();
    expect(() => createGymBody.parse({ ...valid, lng: -181 })).toThrow();
  });

  it('rejects negative pricePerMonth', () => {
    expect(() => createGymBody.parse({ ...valid, pricePerMonth: -1 })).toThrow();
  });

  it('accepts zero pricePerMonth', () => {
    expect(() => createGymBody.parse({ ...valid, pricePerMonth: 0 })).not.toThrow();
  });

  it('rejects invalid website URL', () => {
    expect(() =>
      createGymBody.parse({ ...valid, website: 'not-a-url' }),
    ).toThrow();
  });

  it('accepts valid website URL', () => {
    expect(() =>
      createGymBody.parse({ ...valid, website: 'https://example.com' }),
    ).not.toThrow();
  });

  it('rejects invalid time format for opensAt', () => {
    expect(() =>
      createGymBody.parse({ ...valid, opensAt: '9am' }),
    ).toThrow();
  });

  it('accepts valid HH:MM time format', () => {
    expect(() =>
      createGymBody.parse({ ...valid, opensAt: '09:00', closesAt: '21:00' }),
    ).not.toThrow();
  });

  it('accepts HH:MM:SS time format', () => {
    expect(() =>
      createGymBody.parse({ ...valid, opensAt: '09:00:00', closesAt: '21:00:00' }),
    ).not.toThrow();
  });
});

// ── Admin updateGym schema (partial) ─────────────────────────────────────────
describe('admin updateGym schema', () => {
  it('accepts partial update', () => {
    expect(() => updateGymBody.parse({ name: 'New Name' })).not.toThrow();
  });

  it('accepts empty object (all fields optional)', () => {
    expect(() => updateGymBody.parse({})).not.toThrow();
  });

  it('rejects invalid lat', () => {
    expect(() => updateGymBody.parse({ lat: 999 })).toThrow();
  });
});

// ── Owner updateGym schema ────────────────────────────────────────────────────
describe('owner updateGym schema', () => {
  it('rejects empty body (must provide at least one field)', () => {
    expect(() => ownerUpdateGymBody.parse({})).toThrow();
  });

  it('accepts valid description update', () => {
    expect(() =>
      ownerUpdateGymBody.parse({ description: 'Great gym near you!' }),
    ).not.toThrow();
  });

  it('rejects description longer than 4000 chars', () => {
    expect(() =>
      ownerUpdateGymBody.parse({ description: 'x'.repeat(4001) }),
    ).toThrow();
  });

  it('accepts description at exactly 4000 chars', () => {
    expect(() =>
      ownerUpdateGymBody.parse({ description: 'x'.repeat(4000) }),
    ).not.toThrow();
  });

  it('rejects invalid time format for opensAt', () => {
    expect(() =>
      ownerUpdateGymBody.parse({ opensAt: 'morning' }),
    ).toThrow();
  });

  it('accepts HH:MM time for opensAt', () => {
    expect(() =>
      ownerUpdateGymBody.parse({ opensAt: '06:00' }),
    ).not.toThrow();
  });
});

// ── Auth schemas ──────────────────────────────────────────────────────────────
describe('auth register schema', () => {
  const valid = { email: 'test@example.com', password: 'Passw0rd1', fullName: 'Test User' };

  it('accepts valid registration', () => {
    expect(() => registerBody.parse(valid)).not.toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => registerBody.parse({ ...valid, email: 'bad' })).toThrow();
  });

  it('rejects password with no uppercase', () => {
    expect(() => registerBody.parse({ ...valid, password: 'passw0rd1' })).toThrow();
  });

  it('rejects password with no digit', () => {
    expect(() => registerBody.parse({ ...valid, password: 'Password' })).toThrow();
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => registerBody.parse({ ...valid, password: 'P0a1234' })).toThrow();
  });

  it('accepts a password with exactly 8 chars that meets requirements', () => {
    expect(() =>
      registerBody.parse({ ...valid, password: 'Passw0r1' }),
    ).not.toThrow();
  });
});

describe('auth login schema', () => {
  it('accepts valid login', () => {
    expect(() =>
      loginBody.parse({ email: 'test@example.com', password: 'Passw0rd1' }),
    ).not.toThrow();
  });

  it('rejects missing email', () => {
    expect(() => loginBody.parse({ password: 'Passw0rd1' })).toThrow();
  });

  it('rejects missing password', () => {
    expect(() => loginBody.parse({ email: 'test@example.com' })).toThrow();
  });
});

// ── Admin linkOwner schema ────────────────────────────────────────────────────
describe('admin linkOwner schema', () => {
  it('accepts valid userId UUID', () => {
    expect(() =>
      linkOwnerBody.parse({ userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', isPrimary: true }),
    ).not.toThrow();
  });

  it('rejects non-UUID userId', () => {
    expect(() => linkOwnerBody.parse({ userId: 'not-uuid', isPrimary: true })).toThrow();
  });

  it('defaults isPrimary to true', () => {
    const result = linkOwnerBody.parse({
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    expect(result.isPrimary).toBe(true);
  });
});

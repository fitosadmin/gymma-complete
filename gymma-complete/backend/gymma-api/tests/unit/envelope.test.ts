// tests/unit/envelope.test.ts
import { describe, it, expect } from 'vitest';
import { success, failure } from '../../src/shared/response/envelope';
import { createInquiryBody } from '../../src/modules/inquiries/inquiries.schema';

describe('response envelope', () => {
  it('wraps success without meta', () => {
    expect(success({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });
  it('wraps success with meta', () => {
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    expect(success([], meta)).toEqual({ success: true, data: [], meta });
  });
  it('formats failure', () => {
    expect(failure('NOT_FOUND', 'nope')).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'nope' },
    });
  });
});

describe('inquiry schema', () => {
  const valid = {
    gymId: '11111111-1111-1111-1111-111111111111',
    name: 'Rahul S',
    phone: '9876543210',
  };
  it('accepts a valid inquiry', () => {
    expect(createInquiryBody.safeParse(valid).success).toBe(true);
  });
  it('rejects a bad phone', () => {
    expect(createInquiryBody.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
  });
  it('rejects a non-uuid gymId', () => {
    expect(createInquiryBody.safeParse({ ...valid, gymId: 'abc' }).success).toBe(false);
  });
});

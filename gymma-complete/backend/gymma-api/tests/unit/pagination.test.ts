// tests/unit/pagination.test.ts
import { describe, it, expect } from 'vitest';
import { resolvePage, offset, buildMeta } from '../../src/shared/utils/pagination';

describe('pagination', () => {
  it('applies defaults', () => {
    expect(resolvePage()).toEqual({ page: 1, limit: 20 });
  });
  it('clamps limit to max', () => {
    expect(resolvePage(2, 999, 50)).toEqual({ page: 2, limit: 50 });
  });
  it('floors page to at least 1', () => {
    expect(resolvePage(0, 10)).toEqual({ page: 1, limit: 10 });
  });
  it('computes offset', () => {
    expect(offset({ page: 3, limit: 20 })).toBe(40);
  });
  it('builds meta with ceil totalPages', () => {
    expect(buildMeta(1, 20, 41)).toEqual({ page: 1, limit: 20, total: 41, totalPages: 3 });
  });
  it('totalPages is at least 1 when empty', () => {
    expect(buildMeta(1, 20, 0).totalPages).toBe(1);
  });
});

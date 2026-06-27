// tests/unit/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/shared/utils/slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Cult Fit Indiranagar')).toBe('cult-fit-indiranagar');
  });
  it('strips punctuation', () => {
    expect(slugify("Gold's Gym, Koramangala!")).toBe('golds-gym-koramangala');
  });
  it('collapses whitespace and dashes', () => {
    expect(slugify('  HerFit   --  Jayanagar ')).toBe('herfit-jayanagar');
  });
  it('trims leading/trailing dashes', () => {
    expect(slugify('--edge--')).toBe('edge');
  });
});

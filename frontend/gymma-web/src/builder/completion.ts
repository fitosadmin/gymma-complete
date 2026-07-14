import type { GymDraft } from './types'

/* Builder psychology helpers: how far along is the WIZARD (steps/time)
   and how strong is the WEBSITE (content completeness). Two different
   numbers, two different jobs — never conflate them in the UI. */

/** Realistic seconds an owner spends per step (index-aligned with STEP_LABELS). */
export const STEP_TIME_SEC = [0, 40, 30, 30, 15, 20, 25, 20, 30, 5, 15, 10, 10]

export function remainingSeconds(step: number): number {
  return STEP_TIME_SEC.slice(step).reduce((a, b) => a + b, 0)
}

export function remainingLabel(step: number): string {
  const sec = remainingSeconds(step)
  if (sec <= 45) return 'under a minute left'
  return `~${Math.ceil(sec / 60)} min left`
}

/** 0–100 content-completeness score for the website being built. */
export function completionScore(d: GymDraft): number {
  let s = 0
  if (d.basics.name.trim()) s += 12
  if (d.basics.logo) s += 8
  if (d.basics.cover) s += 8
  if (d.basics.tagline.trim()) s += 4
  if (d.basics.description.trim()) s += 6
  if (d.location.address.trim() || d.location.city.trim()) s += 10
  if (d.gallery.length > 0) s += Math.min(10, 4 + d.gallery.length * 2)
  s += Math.min(6, d.facilities.length * 2)
  s += Math.min(6, d.equipment.length * 2)
  if (d.plans.length > 0) s += 10
  if (d.classes.length > 0) s += 4
  if (d.trainers.length > 0) s += 8
  if (d.social.phone.trim()) s += 10
  if (d.social.whatsapp.trim() || d.social.instagram.trim()) s += 4
  return Math.min(100, s)
}

/** Positive, honest, never nagging. */
export function encouragement(score: number): string {
  if (score >= 90) return `Your website is ${score}% ready — this looks genuinely premium.`
  if (score >= 70) return `Your website is ${score}% ready — almost there, it shows.`
  if (score >= 45) return `Your website is ${score}% ready — looking professional already.`
  if (score >= 20) return `Your website is ${score}% ready — great start, keep going.`
  return 'Every field you fill makes your page stronger.'
}

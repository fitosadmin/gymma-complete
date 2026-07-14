import { emptyDraft } from '../builder/types'
import type { GymDraft } from '../builder/types'
import type { Tier } from '../components/ui'

/*
 * Curated demo gyms — the featured-gym flow needs real destinations
 * (D10: "proof beats promises"). Tier/rating/review-count are homepage
 * metadata only; GymDraft stays untouched. Replaced by live API data
 * when the backend lands.
 */

export interface DemoGym {
  slug: string
  name: string
  initial: string
  area: string
  tier: Tier
  rating: number
  reviews: number
  seed: number
  blurb: string
  draft: GymDraft
  sampleReviews: { stars: number; text: string; date: string }[]
}

function makeDraft(overrides: {
  name: string
  tagline: string
  description: string
  foundedYear: string
  slug: string
  address: string
  landmark: string
  facilities: string[]
  equipment: { id: string; name: string; category: string; qty: number }[]
  plans: GymDraft['plans']
  classes: GymDraft['classes']
  trainers: GymDraft['trainers']
}): GymDraft {
  const d = emptyDraft()
  d.basics.name = overrides.name
  d.basics.tagline = overrides.tagline
  d.basics.description = overrides.description
  d.basics.foundedYear = overrides.foundedYear
  d.basics.category = 'Gym'
  d.location.address = overrides.address
  d.location.landmark = overrides.landmark
  d.location.city = 'Bengaluru'
  d.location.state = 'Karnataka'
  d.location.pincode = '560038'
  d.gallery = []
  d.facilities = overrides.facilities
  d.equipment = overrides.equipment
  d.plans = overrides.plans
  d.classes = overrides.classes
  d.trainers = overrides.trainers
  d.social.phone = '95912 76584'
  d.social.whatsapp = '95912 76584'
  d.seo.slug = overrides.slug
  return d
}

export const DEMO_GYMS: DemoGym[] = [
  {
    slug: 'fit-district-indiranagar',
    name: 'Fit District',
    initial: 'F',
    area: 'Indiranagar',
    tier: 'AAA',
    rating: 4.8,
    reviews: 124,
    seed: 0,
    blurb: 'Premium strength & conditioning with coach-led programming.',
    sampleReviews: [
      { stars: 5, text: 'Cleanest gym I have trained at in Indiranagar. Equipment is genuinely maintained and the 6am crowd is a family.', date: 'March 2026' },
      { stars: 5, text: 'Coach Arjun rebuilt my squat from zero after a knee injury. Programming here is the real thing, not sets scribbled on a whiteboard.', date: 'February 2026' },
      { stars: 4, text: 'Worth every rupee. Only gripe: the 6:30pm rush gets crowded near the racks. Mornings are perfect.', date: 'January 2026' },
    ],
    draft: makeDraft({
      name: 'Fit District',
      tagline: 'Train with intent.',
      description:
        'A 6,000 sq ft strength and conditioning facility in the heart of Indiranagar. Coach-led programming, meticulously maintained equipment, and a community that shows up at 6am. Every review on this page comes from a verified, paying member.',
      foundedYear: '2018',
      slug: 'fit-district-indiranagar',
      address: '12, 100 Feet Road, Indiranagar',
      landmark: 'Near Metro Pillar 55',
      facilities: ['ac', 'parking', 'lockers', 'shower', 'steam', 'wifi', 'ro-water', 'pt', 'womens-section', 'group-classes'],
      equipment: [
        { id: 'fd1', name: 'Squat Rack', category: 'Strength', qty: 4 },
        { id: 'fd2', name: 'Deadlift Platform', category: 'Powerlifting', qty: 2 },
        { id: 'fd3', name: 'Dumbbells (up to 50kg)', category: 'Free Weights', qty: 1 },
        { id: 'fd4', name: 'Treadmill', category: 'Cardio', qty: 8 },
        { id: 'fd5', name: 'Assault Bike', category: 'CrossFit', qty: 4 },
        { id: 'fd6', name: 'Cable Crossover', category: 'Strength', qty: 2 },
      ],
      plans: [
        { id: 'fdp1', name: 'Monthly', durationMonths: 1, price: 2500, joiningFee: 500, benefits: ['All equipment', 'Group classes'], popular: false, offer: '' },
        { id: 'fdp2', name: 'Quarterly', durationMonths: 3, price: 6600, joiningFee: null, benefits: ['All equipment', 'Group classes', '1 PT session'], popular: true, offer: 'Save ₹900' },
        { id: 'fdp3', name: 'Annual', durationMonths: 12, price: 21000, joiningFee: null, benefits: ['Everything', '4 PT sessions', 'Diet consult'], popular: false, offer: '2 months free' },
      ],
      classes: [
        { id: 'fdc1', name: 'HIIT', days: ['Mon', 'Wed', 'Fri'], time: '07:00', trainer: 'Arjun Rao', capacity: 20 },
        { id: 'fdc2', name: 'Strength', days: ['Tue', 'Thu'], time: '18:30', trainer: 'Meera Iyer', capacity: 16 },
      ],
      trainers: [
        { id: 'fdt1', photo: null, name: 'Arjun Rao', experienceYears: 9, certifications: ['K11 Certified', 'CrossFit L1'], specialization: 'Strength & Conditioning', bio: '', instagram: '' },
        { id: 'fdt2', photo: null, name: 'Meera Iyer', experienceYears: 6, certifications: ['ACE Certified', 'Sports Nutrition'], specialization: 'Weight Loss', bio: '', instagram: '' },
      ],
    }),
  },
  {
    slug: 'iron-republic-koramangala',
    name: 'Iron Republic',
    initial: 'I',
    area: 'Koramangala',
    tier: 'AA',
    rating: 4.6,
    reviews: 86,
    seed: 1,
    blurb: 'Serious lifting. Bumper plates, chalk, and zero mirrors-only culture.',
    sampleReviews: [
      { stars: 5, text: 'Four power racks and nobody hogging them for curls. Dev actually coaches — counted my breath on a max attempt.', date: 'March 2026' },
      { stars: 4, text: 'No AC and proud of it. Calibrated plates, chalk everywhere, honest people. Shower pressure could be better.', date: 'February 2026' },
      { stars: 5, text: 'Moved here from a chain gym. Half the price, twice the iron, ten times the culture.', date: 'December 2025' },
    ],
    draft: makeDraft({
      name: 'Iron Republic',
      tagline: 'Leave stronger.',
      description:
        'Koramangala’s home for powerlifting and honest training. Calibrated plates, four combo racks, and coaches who count your reps, not your money. Rated by verified members across six dimensions.',
      foundedYear: '2020',
      slug: 'iron-republic-koramangala',
      address: '8th Block, 80 Feet Road, Koramangala',
      landmark: 'Opposite Forum Mall lane',
      facilities: ['parking', 'lockers', 'shower', 'ro-water', 'pt', 'crossfit-zone'],
      equipment: [
        { id: 'ir1', name: 'Power Rack', category: 'Powerlifting', qty: 4 },
        { id: 'ir2', name: 'Olympic Barbells', category: 'Powerlifting', qty: 12 },
        { id: 'ir3', name: 'Bumper Plates', category: 'Powerlifting', qty: 1 },
        { id: 'ir4', name: 'GHD Machine', category: 'CrossFit', qty: 2 },
        { id: 'ir5', name: 'Rowing Machine', category: 'Cardio', qty: 4 },
      ],
      plans: [
        { id: 'irp1', name: 'Monthly', durationMonths: 1, price: 2000, joiningFee: null, benefits: ['Full floor access', 'Chalk friendly'], popular: true, offer: '' },
        { id: 'irp2', name: 'Half-Yearly', durationMonths: 6, price: 10500, joiningFee: null, benefits: ['Full floor access', 'Programming support'], popular: false, offer: 'Save ₹1,500' },
      ],
      classes: [],
      trainers: [
        { id: 'irt1', photo: null, name: 'Dev Shetty', experienceYears: 11, certifications: ['NSCA Certified'], specialization: 'Strength & Conditioning', bio: '', instagram: '' },
      ],
    }),
  },
  {
    slug: 'asana-house-hsr',
    name: 'Asana House',
    initial: 'A',
    area: 'HSR Layout',
    tier: 'AA',
    rating: 4.7,
    reviews: 52,
    seed: 2,
    blurb: 'A calm, light-filled yoga and mobility studio with small batches.',
    sampleReviews: [
      { stars: 5, text: 'Batches genuinely capped at twelve — Ananya knows everyone by name and adjusts every pose. Worth the waitlist.', date: 'March 2026' },
      { stars: 5, text: 'The 6:30am batch changed my back pain in two months. Calm space, zero gym-bro energy, spotless mats.', date: 'January 2026' },
      { stars: 4, text: 'Beautiful studio above Blue Tokai. Wish there were weekend evening slots, but the quality is undeniable.', date: 'November 2025' },
    ],
    draft: makeDraft({
      name: 'Asana House',
      tagline: 'Strong. Still. Supple.',
      description:
        'A boutique yoga and mobility studio in HSR Layout. Batches capped at twelve, teachers certified by Yoga Alliance, and a space designed for breath, not noise. Every rating here is from a verified, paying member.',
      foundedYear: '2021',
      slug: 'asana-house-hsr',
      address: '27th Main, Sector 1, HSR Layout',
      landmark: 'Above Blue Tokai',
      facilities: ['ac', 'lockers', 'shower', 'wifi', 'ro-water', 'womens-section', 'group-classes'],
      equipment: [
        { id: 'ah1', name: 'Resistance Bands', category: 'Resistance', qty: 1 },
        { id: 'ah2', name: 'Foam Rollers', category: 'Recovery', qty: 1 },
        { id: 'ah3', name: 'Stretching Area', category: 'Recovery', qty: 1 },
      ],
      plans: [
        { id: 'ahp1', name: 'Monthly', durationMonths: 1, price: 3200, joiningFee: null, benefits: ['Unlimited batches', 'Mat provided'], popular: true, offer: '' },
        { id: 'ahp2', name: 'Quarterly', durationMonths: 3, price: 8600, joiningFee: null, benefits: ['Unlimited batches', 'Mobility assessment'], popular: false, offer: 'Save ₹1,000' },
      ],
      classes: [
        { id: 'ahc1', name: 'Yoga', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '06:30', trainer: 'Ananya Kulkarni', capacity: 12 },
        { id: 'ahc2', name: 'Pilates', days: ['Tue', 'Thu', 'Sat'], time: '18:00', trainer: 'Ananya Kulkarni', capacity: 10 },
      ],
      trainers: [
        { id: 'aht1', photo: null, name: 'Ananya Kulkarni', experienceYears: 8, certifications: ['Yoga Alliance RYT-200'], specialization: 'Yoga & Mobility', bio: '', instagram: '' },
      ],
    }),
  },
]

export function getDemoGymDraft(slug: string): GymDraft | null {
  return DEMO_GYMS.find((g) => g.slug === slug)?.draft ?? null
}

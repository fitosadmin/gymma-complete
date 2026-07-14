/* ============================================================
   GymDraft — the single data shape behind the builder, the live
   preview, and the published gym page. Template + content = site.
   ============================================================ */

export interface DayHours {
  closed: boolean
  open: string   // "06:00"
  close: string  // "22:00"
}

export interface GalleryImage {
  id: string
  dataUrl: string
  category: string
}

export interface EquipmentItem {
  id: string
  name: string
  category: string
  qty: number
}

export interface MembershipPlan {
  id: string
  name: string
  durationMonths: number
  price: number | null
  joiningFee: number | null
  benefits: string[]
  popular: boolean
  offer: string
}

export interface GymClass {
  id: string
  name: string
  days: string[]
  time: string
  trainer: string
  capacity: number | null
}

export interface Trainer {
  id: string
  photo: string | null
  name: string
  experienceYears: number | null
  certifications: string[]
  specialization: string
  bio: string
  instagram: string
}

export interface GymDraft {
  version: number
  updatedAt: string

  basics: {
    name: string
    tagline: string
    description: string
    foundedYear: string
    ownerName: string
    category: string
    logo: string | null
    cover: string | null
  }

  location: {
    address: string
    landmark: string
    city: string
    state: string
    pincode: string
    mapsUrl: string
    parking: boolean
    hours: DayHours[] // 7 entries, Mon..Sun
  }

  gallery: GalleryImage[]
  facilities: string[]
  equipment: EquipmentItem[]
  plans: MembershipPlan[]
  classes: GymClass[]
  trainers: Trainer[]

  social: {
    instagram: string
    facebook: string
    youtube: string
    website: string
    whatsapp: string
    phone: string
    email: string
  }

  seo: {
    slug: string
    metaTitle: string
    metaDescription: string
    keywords: string
  }
}

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const defaultHours: DayHours[] = DAY_LABELS.map((_, i) => ({
  closed: i === 6, // Sunday closed by default — most Indian gyms
  open: '06:00',
  close: '22:00',
}))

export function emptyDraft(): GymDraft {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    basics: {
      name: '',
      tagline: '',
      description: '',
      foundedYear: '',
      ownerName: '',
      category: 'Gym',
      logo: null,
      cover: null,
    },
    location: {
      address: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      mapsUrl: '',
      parking: false,
      hours: defaultHours,
    },
    gallery: [],
    facilities: [],
    equipment: [],
    plans: [],
    classes: [],
    trainers: [],
    social: {
      instagram: '',
      facebook: '',
      youtube: '',
      website: '',
      whatsapp: '',
      phone: '',
      email: '',
    },
    seo: {
      slug: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
    },
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

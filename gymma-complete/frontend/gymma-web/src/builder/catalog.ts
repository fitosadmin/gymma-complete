/* Selection catalogs — from the Gymma docs (§6.4 gym template,
   filter taxonomy §6.3, unified-spec master equipment catalog).
   Owners SELECT, they don't type. Selection is the 3-minute secret. */

export const BUSINESS_CATEGORIES = [
  'Gym',
  'CrossFit Box',
  'Yoga Studio',
  'Pilates Studio',
  'MMA / Boxing',
  'Dance Fitness',
  'Sports Academy',
]

export const FACILITIES: { id: string; label: string }[] = [
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'parking', label: 'Parking' },
  { id: 'lockers', label: 'Lockers' },
  { id: 'shower', label: 'Shower' },
  { id: 'steam', label: 'Steam Room' },
  { id: 'sauna', label: 'Sauna' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'ro-water', label: 'RO Drinking Water' },
  { id: 'cafe', label: 'Cafe / Juice Bar' },
  { id: 'pt', label: 'Personal Training' },
  { id: 'womens-section', label: "Women's Section" },
  { id: 'kids-area', label: 'Kids Area' },
  { id: 'wheelchair', label: 'Wheelchair Accessible' },
  { id: 'group-classes', label: 'Group Classes' },
  { id: 'cardio-zone', label: 'Cardio Zone' },
  { id: 'crossfit-zone', label: 'CrossFit Zone' },
]

export const EQUIPMENT_CATEGORIES = [
  'Strength',
  'Cardio',
  'Functional',
  'CrossFit',
  'Powerlifting',
  'Machines',
  'Free Weights',
  'Resistance',
  'Recovery',
] as const

export const EQUIPMENT_CATALOG: { name: string; category: (typeof EQUIPMENT_CATEGORIES)[number] }[] = [
  // Strength
  { name: 'Squat Rack', category: 'Strength' },
  { name: 'Bench Press', category: 'Strength' },
  { name: 'Smith Machine', category: 'Strength' },
  { name: 'Cable Crossover', category: 'Strength' },
  { name: 'Preacher Curl Bench', category: 'Strength' },
  // Cardio
  { name: 'Treadmill', category: 'Cardio' },
  { name: 'Elliptical Trainer', category: 'Cardio' },
  { name: 'Stationary Bike', category: 'Cardio' },
  { name: 'Rowing Machine', category: 'Cardio' },
  { name: 'Stair Climber', category: 'Cardio' },
  { name: 'Air Bike', category: 'Cardio' },
  // Functional
  { name: 'Kettlebells', category: 'Functional' },
  { name: 'Battle Ropes', category: 'Functional' },
  { name: 'TRX Suspension', category: 'Functional' },
  { name: 'Plyo Boxes', category: 'Functional' },
  { name: 'Medicine Balls', category: 'Functional' },
  { name: 'Agility Ladder', category: 'Functional' },
  // CrossFit
  { name: 'Olympic Rings', category: 'CrossFit' },
  { name: 'Wall Balls', category: 'CrossFit' },
  { name: 'Assault Bike', category: 'CrossFit' },
  { name: 'GHD Machine', category: 'CrossFit' },
  // Powerlifting
  { name: 'Deadlift Platform', category: 'Powerlifting' },
  { name: 'Power Rack', category: 'Powerlifting' },
  { name: 'Olympic Barbells', category: 'Powerlifting' },
  { name: 'Bumper Plates', category: 'Powerlifting' },
  // Machines
  { name: 'Lat Pulldown', category: 'Machines' },
  { name: 'Leg Press', category: 'Machines' },
  { name: 'Leg Curl / Extension', category: 'Machines' },
  { name: 'Chest Press Machine', category: 'Machines' },
  { name: 'Shoulder Press Machine', category: 'Machines' },
  { name: 'Seated Row Machine', category: 'Machines' },
  { name: 'Hip Abductor', category: 'Machines' },
  // Free Weights
  { name: 'Dumbbells (up to 50kg)', category: 'Free Weights' },
  { name: 'EZ Curl Bars', category: 'Free Weights' },
  { name: 'Adjustable Benches', category: 'Free Weights' },
  { name: 'Weight Plates', category: 'Free Weights' },
  // Resistance
  { name: 'Resistance Bands', category: 'Resistance' },
  { name: 'Cable Machines', category: 'Resistance' },
  // Recovery
  { name: 'Foam Rollers', category: 'Recovery' },
  { name: 'Stretching Area', category: 'Recovery' },
  { name: 'Massage Gun Station', category: 'Recovery' },
]

export const CLASS_TYPES = [
  'Yoga',
  'HIIT',
  'CrossFit',
  'Zumba',
  'Boxing',
  'Dance',
  'Pilates',
  'Strength',
  'Functional',
  'Spin',
]

export const GALLERY_CATEGORIES = [
  'Exterior',
  'Interior',
  'Equipment',
  'Cardio',
  'Strength',
  'Locker Rooms',
  'Reception',
  'Group Classes',
  'Transformations',
  'Events',
]

export const PLAN_PRESETS = [
  { name: 'Monthly', durationMonths: 1 },
  { name: 'Quarterly', durationMonths: 3 },
  { name: 'Half-Yearly', durationMonths: 6 },
  { name: 'Annual', durationMonths: 12 },
]

export const CERTIFICATIONS = [
  'ACE Certified',
  'ISSA Certified',
  'K11 Certified',
  'NSCA Certified',
  'ACSM Certified',
  'Gold’s Gym University',
  'Yoga Alliance RYT-200',
  'CrossFit L1',
  'CrossFit L2',
  'Sports Nutrition',
  'First Aid / CPR',
]

export const SPECIALIZATIONS = [
  'Weight Loss',
  'Muscle Building',
  'Strength & Conditioning',
  'Yoga & Mobility',
  'CrossFit',
  'Boxing / MMA',
  'Rehabilitation',
  'Sports Performance',
  'Nutrition Coaching',
  'Senior Fitness',
]

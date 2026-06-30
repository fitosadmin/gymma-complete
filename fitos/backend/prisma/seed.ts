import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Difficulty formula: stability*0.30 + coordination*0.25 + load*0.20 + mobility*0.15 + injuryRisk*0.10
function computeDifficulty(s: number, c: number, l: number, m: number, ir: number): number {
  return Math.round(s * 0.30 + c * 0.25 + l * 0.20 + m * 0.15 + ir * 0.10);
}

async function main() {
  console.log('Seeding FITOS database...');

  // ─── Movement Patterns ─────────────────────────────────────────────────────
  const patterns = [
    { code: 'PUSH_HORZ', name: 'Horizontal Push' },
    { code: 'PUSH_VERT', name: 'Vertical Push' },
    { code: 'PULL_HORZ', name: 'Horizontal Pull' },
    { code: 'PULL_VERT', name: 'Vertical Pull' },
    { code: 'SQUAT',     name: 'Squat Pattern' },
    { code: 'HINGE',     name: 'Hip Hinge' },
    { code: 'LUNGE',     name: 'Lunge / Single Leg' },
    { code: 'CARRY',     name: 'Loaded Carry' },
    { code: 'ROTATION',  name: 'Rotary / Anti-Rotation' },
    { code: 'CORE_ANTI', name: 'Core Anti-Extension' },
    { code: 'ISOLATION', name: 'Single-Joint Isolation' },
  ];
  console.log('Seeding movement patterns...');
  // (no Movement Patterns table in schema — pattern is stored directly on Exercise as enum)

  // ─── Muscles ───────────────────────────────────────────────────────────────
  console.log('Seeding muscles...');
  const majorMuscles = [
    'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE', 'FOREARMS', 'NECK',
  ];

  const muscleMap: Record<string, string> = {};
  for (const name of majorMuscles) {
    const m = await prisma.muscle.upsert({
      where: { name },
      update: {},
      create: { name, isMajor: true },
    });
    muscleMap[name] = m.id;
  }

  // Sub-regions
  const subRegions: Array<{ name: string; parent: string }> = [
    { name: 'CHEST_UPPER', parent: 'CHEST' },
    { name: 'CHEST_LOWER', parent: 'CHEST' },
    { name: 'LATS', parent: 'BACK' },
    { name: 'TRAPS', parent: 'BACK' },
    { name: 'RHOMBOIDS', parent: 'BACK' },
    { name: 'ERECTORS', parent: 'BACK' },
    { name: 'DELT_ANTERIOR', parent: 'SHOULDERS' },
    { name: 'DELT_LATERAL', parent: 'SHOULDERS' },
    { name: 'DELT_POSTERIOR', parent: 'SHOULDERS' },
    { name: 'ROTATOR_CUFF', parent: 'SHOULDERS' },
    { name: 'GLUTES_MAXIMUS', parent: 'GLUTES' },
    { name: 'GLUTES_MEDIUS', parent: 'GLUTES' },
    { name: 'OBLIQUES', parent: 'CORE' },
    { name: 'RECTUS_ABDOMINIS', parent: 'CORE' },
    { name: 'TRANSVERSE_ABDOMINIS', parent: 'CORE' },
  ];

  for (const sub of subRegions) {
    const m = await prisma.muscle.upsert({
      where: { name: sub.name },
      update: {},
      create: { name: sub.name, isMajor: false, parentId: muscleMap[sub.parent] },
    });
    muscleMap[sub.name] = m.id;
  }

  // ─── Equipment ─────────────────────────────────────────────────────────────
  console.log('Seeding equipment...');
  const equipmentList = [
    { code: 'BB',      name: 'Barbell',              category: 'Free' },
    { code: 'DB',      name: 'Dumbbell',             category: 'Free' },
    { code: 'KB',      name: 'Kettlebell',           category: 'Free' },
    { code: 'MACHINE', name: 'Selectorized Machine', category: 'Fixed' },
    { code: 'CABLE',   name: 'Cable System',         category: 'Semi-fixed' },
    { code: 'BW',      name: 'Bodyweight',           category: 'Variable' },
    { code: 'BAND',    name: 'Resistance Band',      category: 'Variable' },
    { code: 'TRX',     name: 'Suspension Trainer',   category: 'Unstable' },
    { code: 'SM',      name: 'Smith Machine',        category: 'Semi-fixed' },
    { code: 'MEDBALL', name: 'Medicine Ball',        category: 'Free' },
  ] as const;

  const equipmentMap: Record<string, string> = {};
  for (const eq of equipmentList) {
    const e = await prisma.equipment.upsert({
      where: { code: eq.code },
      update: {},
      create: eq,
    });
    equipmentMap[eq.code] = e.id;
  }

  // ─── Contraindications ─────────────────────────────────────────────────────
  console.log('Seeding contraindications...');
  const contraindicationList = [
    { flag: 'SHOULDER_IMPINGEMENT',  description: 'Overhead pressing, internal rotation under load' },
    { flag: 'LOW_BACK_PAIN',         description: 'Axial spinal load, spinal flexion under load' },
    { flag: 'KNEE_PAIN',             description: 'Deep knee flexion, forward knee travel under load' },
    { flag: 'WRIST_PAIN',            description: 'Wrist extension under load, barbell grip' },
    { flag: 'ANKLE_MOBILITY_LIMIT',  description: 'Deep dorsiflexion requirement' },
    { flag: 'POST_SURGICAL',         description: 'Recent surgery within 12 months' },
    { flag: 'CARDIOVASCULAR_RISK',   description: 'Diagnosed heart condition or high blood pressure' },
    { flag: 'METABOLIC_CONDITION',   description: 'Diabetes, thyroid disorder requiring load management' },
    { flag: 'PREGNANCY_POSTPARTUM',  description: 'Pregnancy or within 6 months postpartum' },
  ];

  const contraindicationMap: Record<string, string> = {};
  for (const c of contraindicationList) {
    const con = await prisma.contraindication.upsert({
      where: { flag: c.flag },
      update: {},
      create: c,
    });
    contraindicationMap[c.flag] = con.id;
  }

  // ─── Exercises ─────────────────────────────────────────────────────────────
  console.log('Seeding exercises...');

  type ExerciseSeed = {
    code: string;
    name: string;
    displayName: string;
    description: string;
    primaryPattern: string;
    jointComplexity: string;
    planeOfMotion: string;
    stability: number;
    coordination: number;
    load: number;
    mobility: number;
    injuryRisk: number;
    goalStrength: number;
    goalHypertrophy: number;
    goalEndurance: number;
    goalPower: number;
    experienceMinimum: number;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    tertiaryMuscles: string[];
    stabilizerMuscles: string[];
    equipment: string[];
    contraindications: Array<{ flag: string; severity: 'absolute' | 'relative' | 'caution' }>;
  };

  const exerciseSeedData: ExerciseSeed[] = [
    // ── SQUAT PATTERN ──────────────────────────────────────────────────────
    {
      code: 'EX-001',
      name: 'Leg Press',
      displayName: 'Leg Press (Machine)',
      description: 'Knee-dominant pressing movement on a fixed-path machine. Low stability demand, ideal for beginners.',
      primaryPattern: 'SQUAT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 10, coordination: 5, load: 30, mobility: 10, injuryRisk: 10,
      goalStrength: 50, goalHypertrophy: 70, goalEndurance: 55, goalPower: 30,
      experienceMinimum: 0,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE'],
      equipment: ['MACHINE'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-002',
      name: 'Goblet Squat',
      displayName: 'Goblet Squat (Kettlebell)',
      description: 'Front-loaded squat holding KB at chest. Excellent for teaching squat mechanics with natural counterbalance.',
      primaryPattern: 'SQUAT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 40, coordination: 30, load: 35, mobility: 35, injuryRisk: 25,
      goalStrength: 55, goalHypertrophy: 75, goalEndurance: 60, goalPower: 35,
      experienceMinimum: 0,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'CORE'],
      tertiaryMuscles: ['HAMSTRINGS'],
      stabilizerMuscles: ['SHOULDERS'],
      equipment: ['KB'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-003',
      name: 'Box Squat',
      displayName: 'Box Squat (Barbell)',
      description: 'Barbell squat to a box, limiting depth and ankle dorsiflexion requirement. Regression from back squat for ankle mobility limitations.',
      primaryPattern: 'SQUAT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 50, coordination: 40, load: 48, mobility: 25, injuryRisk: 30,
      goalStrength: 75, goalHypertrophy: 70, goalEndurance: 40, goalPower: 55,
      experienceMinimum: 20,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES'],
      tertiaryMuscles: ['HAMSTRINGS'],
      stabilizerMuscles: ['CORE', 'BACK'],
      equipment: ['BB'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'relative' }],
    },
    {
      code: 'EX-004',
      name: 'Barbell Back Squat',
      displayName: 'Barbell Back Squat',
      description: 'King of lower body exercises. High-bar or low-bar barbell squat requiring full ankle, knee, and hip mobility.',
      primaryPattern: 'SQUAT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 60, coordination: 48, load: 48, mobility: 45, injuryRisk: 40,
      goalStrength: 95, goalHypertrophy: 85, goalEndurance: 40, goalPower: 80,
      experienceMinimum: 20,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE', 'BACK', 'SHOULDERS'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'KNEE_PAIN', severity: 'relative' },
        { flag: 'ANKLE_MOBILITY_LIMIT', severity: 'relative' },
        { flag: 'LOW_BACK_PAIN', severity: 'caution' },
      ],
    },
    {
      code: 'EX-005',
      name: 'Barbell Front Squat',
      displayName: 'Barbell Front Squat',
      description: 'Front-rack barbell squat requiring superior thoracic extension and ankle mobility. More quad-dominant than back squat.',
      primaryPattern: 'SQUAT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 65, coordination: 60, load: 45, mobility: 60, injuryRisk: 45,
      goalStrength: 90, goalHypertrophy: 80, goalEndurance: 35, goalPower: 75,
      experienceMinimum: 40,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'CORE'],
      tertiaryMuscles: ['HAMSTRINGS'],
      stabilizerMuscles: ['SHOULDERS', 'BACK'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'ANKLE_MOBILITY_LIMIT', severity: 'absolute' },
        { flag: 'WRIST_PAIN', severity: 'absolute' },
        { flag: 'KNEE_PAIN', severity: 'relative' },
      ],
    },

    // ── HINGE PATTERN ──────────────────────────────────────────────────────
    {
      code: 'EX-006',
      name: 'Glute Bridge',
      displayName: 'Glute Bridge (Bodyweight)',
      description: 'Supine hip extension. Entry-level hinge pattern that teaches glute activation without loading the spine.',
      primaryPattern: 'HINGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 10, coordination: 10, load: 10, mobility: 15, injuryRisk: 5,
      goalStrength: 30, goalHypertrophy: 45, goalEndurance: 50, goalPower: 20,
      experienceMinimum: 0,
      primaryMuscles: ['GLUTES'],
      secondaryMuscles: ['HAMSTRINGS'],
      tertiaryMuscles: ['CORE'],
      stabilizerMuscles: [],
      equipment: ['BW'],
      contraindications: [{ flag: 'PREGNANCY_POSTPARTUM', severity: 'caution' }],
    },
    {
      code: 'EX-007',
      name: 'Barbell Hip Thrust',
      displayName: 'Barbell Hip Thrust',
      description: 'Loaded hip extension with back on bench. Highest glute EMG activation of any exercise.',
      primaryPattern: 'HINGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 30, coordination: 25, load: 40, mobility: 20, injuryRisk: 20,
      goalStrength: 60, goalHypertrophy: 85, goalEndurance: 55, goalPower: 50,
      experienceMinimum: 0,
      primaryMuscles: ['GLUTES'],
      secondaryMuscles: ['HAMSTRINGS'],
      tertiaryMuscles: ['QUADS'],
      stabilizerMuscles: ['CORE'],
      equipment: ['BB'],
      contraindications: [{ flag: 'PREGNANCY_POSTPARTUM', severity: 'caution' }],
    },
    {
      code: 'EX-008',
      name: 'Romanian Deadlift',
      displayName: 'Romanian Deadlift (Barbell)',
      description: 'Hip hinge with slight knee bend, emphasising hamstring and glute stretch. Requires good posterior chain flexibility.',
      primaryPattern: 'HINGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 35, coordination: 35, load: 45, mobility: 40, injuryRisk: 35,
      goalStrength: 70, goalHypertrophy: 80, goalEndurance: 40, goalPower: 55,
      experienceMinimum: 20,
      primaryMuscles: ['HAMSTRINGS'],
      secondaryMuscles: ['GLUTES', 'ERECTORS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE', 'FOREARMS'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'LOW_BACK_PAIN', severity: 'relative' },
        { flag: 'WRIST_PAIN', severity: 'caution' },
      ],
    },
    {
      code: 'EX-009',
      name: 'Barbell Deadlift',
      displayName: 'Conventional Barbell Deadlift',
      description: 'Full-body pull from floor. Highest load potential of any exercise. Requires hip hinge mechanics and spinal bracing.',
      primaryPattern: 'HINGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 55, coordination: 55, load: 65, mobility: 40, injuryRisk: 50,
      goalStrength: 100, goalHypertrophy: 75, goalEndurance: 35, goalPower: 80,
      experienceMinimum: 20,
      primaryMuscles: ['HAMSTRINGS'],
      secondaryMuscles: ['GLUTES', 'BACK', 'ERECTORS'],
      tertiaryMuscles: ['QUADS'],
      stabilizerMuscles: ['CORE', 'FOREARMS', 'TRAPS'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'LOW_BACK_PAIN', severity: 'absolute' },
        { flag: 'WRIST_PAIN', severity: 'caution' },
      ],
    },
    {
      code: 'EX-010',
      name: 'Barbell Snatch',
      displayName: 'Barbell Snatch',
      description: 'Olympic lift — pulling the barbell from floor to overhead in one explosive movement. Maximum power development.',
      primaryPattern: 'HINGE',
      jointComplexity: 'compound',
      planeOfMotion: 'multi',
      stability: 90, coordination: 95, load: 70, mobility: 80, injuryRisk: 75,
      goalStrength: 70, goalHypertrophy: 50, goalEndurance: 30, goalPower: 100,
      experienceMinimum: 70,
      primaryMuscles: ['GLUTES'],
      secondaryMuscles: ['HAMSTRINGS', 'SHOULDERS', 'TRAPS'],
      tertiaryMuscles: ['QUADS', 'BACK'],
      stabilizerMuscles: ['CORE', 'FOREARMS'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'LOW_BACK_PAIN', severity: 'absolute' },
        { flag: 'SHOULDER_IMPINGEMENT', severity: 'absolute' },
        { flag: 'WRIST_PAIN', severity: 'absolute' },
        { flag: 'ANKLE_MOBILITY_LIMIT', severity: 'absolute' },
      ],
    },

    // ── PUSH_HORZ PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-011',
      name: 'Machine Chest Press',
      displayName: 'Chest Press (Machine)',
      description: 'Fixed-path horizontal pressing. Eliminates stability demand, ideal for beginners or injury rehabilitation.',
      primaryPattern: 'PUSH_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 8, coordination: 8, load: 20, mobility: 10, injuryRisk: 8,
      goalStrength: 40, goalHypertrophy: 65, goalEndurance: 60, goalPower: 20,
      experienceMinimum: 0,
      primaryMuscles: ['CHEST'],
      secondaryMuscles: ['SHOULDERS', 'TRICEPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: [],
      equipment: ['MACHINE'],
      contraindications: [],
    },
    {
      code: 'EX-012',
      name: 'Dumbbell Bench Press',
      displayName: 'Dumbbell Bench Press',
      description: 'Horizontal pressing with dumbbells. Greater range of motion than barbell, reduced wrist stress.',
      primaryPattern: 'PUSH_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 35, coordination: 25, load: 30, mobility: 20, injuryRisk: 20,
      goalStrength: 60, goalHypertrophy: 80, goalEndurance: 55, goalPower: 40,
      experienceMinimum: 0,
      primaryMuscles: ['CHEST'],
      secondaryMuscles: ['SHOULDERS', 'TRICEPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['ROTATOR_CUFF'],
      equipment: ['DB'],
      contraindications: [{ flag: 'SHOULDER_IMPINGEMENT', severity: 'caution' }],
    },
    {
      code: 'EX-013',
      name: 'Barbell Bench Press',
      displayName: 'Barbell Bench Press',
      description: 'Standard horizontal barbell press. Highest load potential for chest development.',
      primaryPattern: 'PUSH_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 45, coordination: 40, load: 50, mobility: 25, injuryRisk: 35,
      goalStrength: 90, goalHypertrophy: 85, goalEndurance: 45, goalPower: 70,
      experienceMinimum: 20,
      primaryMuscles: ['CHEST'],
      secondaryMuscles: ['SHOULDERS', 'TRICEPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['ROTATOR_CUFF', 'BACK'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'WRIST_PAIN', severity: 'absolute' },
        { flag: 'SHOULDER_IMPINGEMENT', severity: 'caution' },
      ],
    },
    {
      code: 'EX-014',
      name: 'Cable Fly',
      displayName: 'Cable Chest Fly',
      description: 'Constant tension chest isolation via cables. Best for chest stretch and contraction under load.',
      primaryPattern: 'PUSH_HORZ',
      jointComplexity: 'isolation',
      planeOfMotion: 'frontal',
      stability: 25, coordination: 20, load: 15, mobility: 25, injuryRisk: 15,
      goalStrength: 30, goalHypertrophy: 75, goalEndurance: 60, goalPower: 15,
      experienceMinimum: 0,
      primaryMuscles: ['CHEST'],
      secondaryMuscles: ['DELT_ANTERIOR'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['SHOULDERS'],
      equipment: ['CABLE'],
      contraindications: [{ flag: 'SHOULDER_IMPINGEMENT', severity: 'caution' }],
    },

    // ── PUSH_VERT PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-015',
      name: 'Seated Dumbbell Shoulder Press',
      displayName: 'Seated DB Shoulder Press',
      description: 'Vertical pressing from seated position with dumbbells. Reduced spinal load vs standing. Good for shoulder development.',
      primaryPattern: 'PUSH_VERT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 30, coordination: 25, load: 28, mobility: 30, injuryRisk: 25,
      goalStrength: 55, goalHypertrophy: 75, goalEndurance: 50, goalPower: 40,
      experienceMinimum: 0,
      primaryMuscles: ['SHOULDERS'],
      secondaryMuscles: ['TRICEPS', 'TRAPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE', 'ROTATOR_CUFF'],
      equipment: ['DB'],
      contraindications: [{ flag: 'SHOULDER_IMPINGEMENT', severity: 'relative' }],
    },
    {
      code: 'EX-016',
      name: 'Landmine Press',
      displayName: 'Landmine Press (Barbell)',
      description: 'Vertical pressing on an arc, reducing shoulder impingement risk. Regression for overhead press with shoulder limitations.',
      primaryPattern: 'PUSH_VERT',
      jointComplexity: 'compound',
      planeOfMotion: 'multi',
      stability: 35, coordination: 30, load: 30, mobility: 20, injuryRisk: 15,
      goalStrength: 50, goalHypertrophy: 65, goalEndurance: 45, goalPower: 40,
      experienceMinimum: 0,
      primaryMuscles: ['SHOULDERS'],
      secondaryMuscles: ['TRICEPS', 'CHEST_UPPER'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE', 'ROTATOR_CUFF'],
      equipment: ['BB'],
      contraindications: [],
    },
    {
      code: 'EX-017',
      name: 'Barbell Overhead Press',
      displayName: 'Barbell Overhead Press (Standing)',
      description: 'Standing barbell press overhead. Highest shoulder strength stimulus. Requires full shoulder and thoracic mobility.',
      primaryPattern: 'PUSH_VERT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 60, coordination: 55, load: 50, mobility: 55, injuryRisk: 50,
      goalStrength: 90, goalHypertrophy: 75, goalEndurance: 40, goalPower: 70,
      experienceMinimum: 40,
      primaryMuscles: ['SHOULDERS'],
      secondaryMuscles: ['TRICEPS', 'TRAPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE', 'BACK'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'SHOULDER_IMPINGEMENT', severity: 'absolute' },
        { flag: 'WRIST_PAIN', severity: 'absolute' },
        { flag: 'LOW_BACK_PAIN', severity: 'relative' },
      ],
    },

    // ── PULL_VERT PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-018',
      name: 'Lat Pulldown',
      displayName: 'Lat Pulldown (Cable)',
      description: 'Vertical pulling on cable machine. Best regression from pull-up. Adjustable load for beginners.',
      primaryPattern: 'PULL_VERT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 12, coordination: 18, load: 22, mobility: 20, injuryRisk: 10,
      goalStrength: 55, goalHypertrophy: 75, goalEndurance: 60, goalPower: 30,
      experienceMinimum: 0,
      primaryMuscles: ['LATS'],
      secondaryMuscles: ['BICEPS', 'RHOMBOIDS'],
      tertiaryMuscles: ['SHOULDERS'],
      stabilizerMuscles: ['CORE'],
      equipment: ['CABLE'],
      contraindications: [{ flag: 'SHOULDER_IMPINGEMENT', severity: 'caution' }],
    },
    {
      code: 'EX-019',
      name: 'Pull-up',
      displayName: 'Pull-up (Bodyweight)',
      description: 'Bodyweight vertical pulling. High relative strength requirement. Best measure of upper body pulling strength-to-weight.',
      primaryPattern: 'PULL_VERT',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 55, coordination: 50, load: 55, mobility: 40, injuryRisk: 40,
      goalStrength: 80, goalHypertrophy: 80, goalEndurance: 65, goalPower: 50,
      experienceMinimum: 40,
      primaryMuscles: ['LATS'],
      secondaryMuscles: ['BICEPS', 'RHOMBOIDS'],
      tertiaryMuscles: ['CORE'],
      stabilizerMuscles: ['SHOULDERS'],
      equipment: ['BW'],
      contraindications: [{ flag: 'SHOULDER_IMPINGEMENT', severity: 'relative' }],
    },

    // ── PULL_HORZ PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-020',
      name: 'Seated Cable Row',
      displayName: 'Seated Cable Row',
      description: 'Horizontal pulling on cable machine. Constant tension, excellent for mid-back and lat development.',
      primaryPattern: 'PULL_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 15, coordination: 18, load: 25, mobility: 20, injuryRisk: 10,
      goalStrength: 55, goalHypertrophy: 75, goalEndurance: 60, goalPower: 30,
      experienceMinimum: 0,
      primaryMuscles: ['LATS'],
      secondaryMuscles: ['RHOMBOIDS', 'TRAPS', 'BICEPS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE'],
      equipment: ['CABLE'],
      contraindications: [],
    },
    {
      code: 'EX-021',
      name: 'Dumbbell Row',
      displayName: 'Single-Arm Dumbbell Row',
      description: 'Unilateral horizontal pulling. Allows heavier loads per side and increased range of motion.',
      primaryPattern: 'PULL_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 30, coordination: 25, load: 35, mobility: 20, injuryRisk: 20,
      goalStrength: 65, goalHypertrophy: 80, goalEndurance: 55, goalPower: 40,
      experienceMinimum: 0,
      primaryMuscles: ['LATS'],
      secondaryMuscles: ['RHOMBOIDS', 'BICEPS'],
      tertiaryMuscles: ['TRAPS'],
      stabilizerMuscles: ['CORE'],
      equipment: ['DB'],
      contraindications: [],
    },
    {
      code: 'EX-022',
      name: 'Barbell Row',
      displayName: 'Barbell Bent-Over Row',
      description: 'Bilateral horizontal pull with barbell. High loading potential for back mass. Requires strong isometric spinal erectors.',
      primaryPattern: 'PULL_HORZ',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 50, coordination: 45, load: 50, mobility: 35, injuryRisk: 45,
      goalStrength: 85, goalHypertrophy: 80, goalEndurance: 40, goalPower: 60,
      experienceMinimum: 20,
      primaryMuscles: ['LATS'],
      secondaryMuscles: ['RHOMBOIDS', 'TRAPS', 'BICEPS'],
      tertiaryMuscles: ['ERECTORS'],
      stabilizerMuscles: ['CORE', 'HAMSTRINGS'],
      equipment: ['BB'],
      contraindications: [
        { flag: 'LOW_BACK_PAIN', severity: 'relative' },
        { flag: 'WRIST_PAIN', severity: 'caution' },
      ],
    },

    // ── LUNGE PATTERN ──────────────────────────────────────────────────────
    {
      code: 'EX-023',
      name: 'Supported Split Squat',
      displayName: 'Supported Split Squat (Bodyweight)',
      description: 'Static split stance squat with hands supported. Beginner single-leg pattern with balance assistance.',
      primaryPattern: 'LUNGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 20, coordination: 18, load: 8, mobility: 20, injuryRisk: 12,
      goalStrength: 30, goalHypertrophy: 45, goalEndurance: 55, goalPower: 20,
      experienceMinimum: 0,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES'],
      tertiaryMuscles: ['HAMSTRINGS'],
      stabilizerMuscles: ['CORE'],
      equipment: ['BW'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-024',
      name: 'Walking Lunge',
      displayName: 'Walking Lunge (Bodyweight)',
      description: 'Dynamic alternating lunge with forward progression. Requires single-leg stability and balance.',
      primaryPattern: 'LUNGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 35, coordination: 30, load: 10, mobility: 30, injuryRisk: 25,
      goalStrength: 40, goalHypertrophy: 60, goalEndurance: 70, goalPower: 35,
      experienceMinimum: 0,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE'],
      equipment: ['BW'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'absolute' }],
    },
    {
      code: 'EX-025',
      name: 'Bulgarian Split Squat',
      displayName: 'Bulgarian Split Squat (Dumbbell)',
      description: 'Rear-foot elevated split squat. High glute and quad demand. Significant balance challenge.',
      primaryPattern: 'LUNGE',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 60, coordination: 50, load: 40, mobility: 45, injuryRisk: 40,
      goalStrength: 75, goalHypertrophy: 85, goalEndurance: 50, goalPower: 60,
      experienceMinimum: 40,
      primaryMuscles: ['QUADS'],
      secondaryMuscles: ['GLUTES', 'HAMSTRINGS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE'],
      equipment: ['DB'],
      contraindications: [{ flag: 'KNEE_PAIN', severity: 'relative' }],
    },

    // ── CARRY PATTERN ──────────────────────────────────────────────────────
    {
      code: 'EX-026',
      name: "Farmer's Carry",
      displayName: "Farmer's Carry (Dumbbell)",
      description: 'Loaded walk with heavy dumbbells. Develops grip strength, core stability, and total-body conditioning.',
      primaryPattern: 'CARRY',
      jointComplexity: 'compound',
      planeOfMotion: 'multi',
      stability: 30, coordination: 20, load: 25, mobility: 15, injuryRisk: 15,
      goalStrength: 55, goalHypertrophy: 45, goalEndurance: 70, goalPower: 40,
      experienceMinimum: 0,
      primaryMuscles: ['FOREARMS'],
      secondaryMuscles: ['TRAPS', 'CORE'],
      tertiaryMuscles: ['SHOULDERS'],
      stabilizerMuscles: [],
      equipment: ['DB'],
      contraindications: [],
    },

    // ── ROTATION PATTERN ───────────────────────────────────────────────────
    {
      code: 'EX-027',
      name: 'Russian Twist',
      displayName: 'Russian Twist (Bodyweight)',
      description: 'Seated torso rotation exercise. Trains obliques and rotary stability.',
      primaryPattern: 'ROTATION',
      jointComplexity: 'isolation',
      planeOfMotion: 'transverse',
      stability: 20, coordination: 15, load: 5, mobility: 15, injuryRisk: 12,
      goalStrength: 25, goalHypertrophy: 40, goalEndurance: 65, goalPower: 20,
      experienceMinimum: 0,
      primaryMuscles: ['OBLIQUES'],
      secondaryMuscles: ['RECTUS_ABDOMINIS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['CORE'],
      equipment: ['BW'],
      contraindications: [{ flag: 'LOW_BACK_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-028',
      name: 'Pallof Press',
      displayName: 'Pallof Press (Cable)',
      description: 'Anti-rotation core exercise. Press cable away from anchor resisting rotation. Superior core stability drill.',
      primaryPattern: 'ROTATION',
      jointComplexity: 'isolation',
      planeOfMotion: 'transverse',
      stability: 35, coordination: 25, load: 15, mobility: 15, injuryRisk: 10,
      goalStrength: 30, goalHypertrophy: 45, goalEndurance: 65, goalPower: 30,
      experienceMinimum: 0,
      primaryMuscles: ['OBLIQUES'],
      secondaryMuscles: ['TRANSVERSE_ABDOMINIS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['SHOULDERS'],
      equipment: ['CABLE'],
      contraindications: [],
    },

    // ── CORE_ANTI PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-029',
      name: 'Plank',
      displayName: 'Plank (Bodyweight)',
      description: 'Isometric core anti-extension. Foundation of core stability training. Suitable for all levels.',
      primaryPattern: 'CORE_ANTI',
      jointComplexity: 'isolation',
      planeOfMotion: 'sagittal',
      stability: 15, coordination: 8, load: 8, mobility: 12, injuryRisk: 5,
      goalStrength: 20, goalHypertrophy: 30, goalEndurance: 60, goalPower: 10,
      experienceMinimum: 0,
      primaryMuscles: ['CORE'],
      secondaryMuscles: ['TRANSVERSE_ABDOMINIS'],
      tertiaryMuscles: ['SHOULDERS'],
      stabilizerMuscles: [],
      equipment: ['BW'],
      contraindications: [{ flag: 'WRIST_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-030',
      name: 'Ab Wheel Rollout',
      displayName: 'Ab Wheel Rollout',
      description: 'Dynamic core anti-extension. High demand on rectus abdominis and shoulder stability. Advanced core exercise.',
      primaryPattern: 'CORE_ANTI',
      jointComplexity: 'compound',
      planeOfMotion: 'sagittal',
      stability: 65, coordination: 55, load: 35, mobility: 45, injuryRisk: 45,
      goalStrength: 35, goalHypertrophy: 60, goalEndurance: 55, goalPower: 30,
      experienceMinimum: 40,
      primaryMuscles: ['CORE'],
      secondaryMuscles: ['RECTUS_ABDOMINIS', 'TRANSVERSE_ABDOMINIS'],
      tertiaryMuscles: [],
      stabilizerMuscles: ['SHOULDERS'],
      equipment: ['BW'],
      contraindications: [
        { flag: 'LOW_BACK_PAIN', severity: 'absolute' },
        { flag: 'WRIST_PAIN', severity: 'absolute' },
      ],
    },

    // ── ISOLATION PATTERN ──────────────────────────────────────────────────
    {
      code: 'EX-031',
      name: 'Dumbbell Curl',
      displayName: 'Dumbbell Bicep Curl',
      description: 'Classic bicep isolation. Neutral or supinated grip. Full range of motion elbow flexion.',
      primaryPattern: 'ISOLATION',
      jointComplexity: 'isolation',
      planeOfMotion: 'sagittal',
      stability: 8, coordination: 5, load: 10, mobility: 8, injuryRisk: 5,
      goalStrength: 40, goalHypertrophy: 80, goalEndurance: 60, goalPower: 15,
      experienceMinimum: 0,
      primaryMuscles: ['BICEPS'],
      secondaryMuscles: ['FOREARMS'],
      tertiaryMuscles: [],
      stabilizerMuscles: [],
      equipment: ['DB'],
      contraindications: [{ flag: 'WRIST_PAIN', severity: 'caution' }],
    },
    {
      code: 'EX-032',
      name: 'Tricep Pushdown',
      displayName: 'Tricep Pushdown (Cable)',
      description: 'Cable tricep isolation with constant tension. Safe for all experience levels.',
      primaryPattern: 'ISOLATION',
      jointComplexity: 'isolation',
      planeOfMotion: 'sagittal',
      stability: 8, coordination: 5, load: 10, mobility: 8, injuryRisk: 5,
      goalStrength: 40, goalHypertrophy: 80, goalEndurance: 60, goalPower: 10,
      experienceMinimum: 0,
      primaryMuscles: ['TRICEPS'],
      secondaryMuscles: [],
      tertiaryMuscles: [],
      stabilizerMuscles: [],
      equipment: ['CABLE'],
      contraindications: [{ flag: 'WRIST_PAIN', severity: 'caution' }],
    },
  ];

  const exerciseIdMap: Record<string, string> = {};

  for (const ex of exerciseSeedData) {
    const difficultyScore = computeDifficulty(ex.stability, ex.coordination, ex.load, ex.mobility, ex.injuryRisk);

    const created = await prisma.exercise.upsert({
      where: { code: ex.code },
      update: {
        difficultyScore,
        stabilityDemand: ex.stability,
        coordinationComplexity: ex.coordination,
        mobilityRequired: ex.mobility,
        injuryRiskFactor: ex.injuryRisk,
        goalStrength: ex.goalStrength,
        goalHypertrophy: ex.goalHypertrophy,
        goalEndurance: ex.goalEndurance,
        goalPower: ex.goalPower,
        experienceMinimum: ex.experienceMinimum,
      },
      create: {
        code: ex.code,
        name: ex.name,
        displayName: ex.displayName,
        description: ex.description,
        primaryPattern: ex.primaryPattern as any,
        jointComplexity: ex.jointComplexity as any,
        planeOfMotion: ex.planeOfMotion as any,
        difficultyScore,
        stabilityDemand: ex.stability,
        coordinationComplexity: ex.coordination,
        mobilityRequired: ex.mobility,
        injuryRiskFactor: ex.injuryRisk,
        goalStrength: ex.goalStrength,
        goalHypertrophy: ex.goalHypertrophy,
        goalEndurance: ex.goalEndurance,
        goalPower: ex.goalPower,
        experienceMinimum: ex.experienceMinimum,
      },
    });

    exerciseIdMap[ex.code] = created.id;

    // Seed muscle assignments
    const allMuscles = [
      ...ex.primaryMuscles.map(m => ({ name: m, role: 'primary' })),
      ...ex.secondaryMuscles.map(m => ({ name: m, role: 'secondary' })),
      ...ex.tertiaryMuscles.map(m => ({ name: m, role: 'tertiary' })),
      ...ex.stabilizerMuscles.map(m => ({ name: m, role: 'stabilizer' })),
    ];

    for (const muscle of allMuscles) {
      if (!muscleMap[muscle.name]) continue;
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: created.id, muscleId: muscleMap[muscle.name] } },
        update: { role: muscle.role },
        create: { exerciseId: created.id, muscleId: muscleMap[muscle.name], role: muscle.role },
      });
    }

    // Seed equipment assignments
    for (const eqCode of ex.equipment) {
      if (!equipmentMap[eqCode]) continue;
      await prisma.exerciseEquipment.upsert({
        where: { exerciseId_equipmentId: { exerciseId: created.id, equipmentId: equipmentMap[eqCode] } },
        update: { isPrimary: true },
        create: { exerciseId: created.id, equipmentId: equipmentMap[eqCode], isPrimary: true },
      });
    }

    // Seed contraindications
    for (const ci of ex.contraindications) {
      if (!contraindicationMap[ci.flag]) continue;
      await prisma.exerciseContraindication.upsert({
        where: {
          exerciseId_contraindicationId: {
            exerciseId: created.id,
            contraindicationId: contraindicationMap[ci.flag],
          },
        },
        update: { severity: ci.severity },
        create: {
          exerciseId: created.id,
          contraindicationId: contraindicationMap[ci.flag],
          severity: ci.severity,
        },
      });
    }
  }

  // ─── Progression Chains ────────────────────────────────────────────────────
  console.log('Seeding progression chains...');

  const progressions: Array<{ from: string; to: string; type: string }> = [
    // SQUAT chain
    { from: 'EX-001', to: 'EX-002', type: 'stability' },        // Leg Press → Goblet Squat
    { from: 'EX-002', to: 'EX-003', type: 'load' },             // Goblet Squat → Box Squat
    { from: 'EX-003', to: 'EX-004', type: 'range_of_motion' },  // Box Squat → Back Squat
    { from: 'EX-004', to: 'EX-005', type: 'complexity' },       // Back Squat → Front Squat
    // HINGE chain
    { from: 'EX-006', to: 'EX-007', type: 'load' },             // Glute Bridge → Hip Thrust
    { from: 'EX-007', to: 'EX-008', type: 'complexity' },       // Hip Thrust → RDL
    { from: 'EX-008', to: 'EX-009', type: 'range_of_motion' },  // RDL → Deadlift
    { from: 'EX-009', to: 'EX-010', type: 'complexity' },       // Deadlift → Snatch
    // PUSH_HORZ chain
    { from: 'EX-011', to: 'EX-012', type: 'stability' },        // Machine Press → DB Bench
    { from: 'EX-012', to: 'EX-013', type: 'load' },             // DB Bench → BB Bench
    // PUSH_VERT chain
    { from: 'EX-015', to: 'EX-016', type: 'stability' },        // DB Press → Landmine Press (lateral progression)
    { from: 'EX-016', to: 'EX-017', type: 'load' },             // Landmine → BB OHP
    // PULL_VERT chain
    { from: 'EX-018', to: 'EX-019', type: 'stability' },        // Lat Pulldown → Pull-up
    // PULL_HORZ chain
    { from: 'EX-020', to: 'EX-021', type: 'stability' },        // Seated Row → DB Row
    { from: 'EX-021', to: 'EX-022', type: 'load' },             // DB Row → BB Row
    // LUNGE chain
    { from: 'EX-023', to: 'EX-024', type: 'stability' },        // Supported Split → Walking Lunge
    { from: 'EX-024', to: 'EX-025', type: 'complexity' },       // Walking Lunge → Bulgarian
    // ROTATION chain
    { from: 'EX-027', to: 'EX-028', type: 'complexity' },       // Russian Twist → Pallof Press
    // CORE_ANTI chain
    { from: 'EX-029', to: 'EX-030', type: 'range_of_motion' },  // Plank → Ab Wheel
  ];

  for (const prog of progressions) {
    const fromId = exerciseIdMap[prog.from];
    const toId = exerciseIdMap[prog.to];
    if (!fromId || !toId) continue;
    await prisma.exerciseProgression.upsert({
      where: { fromExerciseId_toExerciseId: { fromExerciseId: fromId, toExerciseId: toId } },
      update: { progressionType: prog.type },
      create: { fromExerciseId: fromId, toExerciseId: toId, progressionType: prog.type },
    });
  }

  // ─── Default Gym + Gym Exercise Database ──────────────────────────────────
  console.log('Seeding default gym and exercise availability...');

  const defaultGym = await prisma.gym.upsert({
    where: { id: 'default-gym-000000000000' },
    update: {},
    create: { 
      id: 'default-gym-000000000000', 
      name: 'FITOS Default Gym',
      slug: 'fitos-default-gym',
      area: 'Bengaluru',
      lat: 12.9716,
      lng: 77.5946,
      price_per_month: 0,
    },
  });

  for (const code of Object.keys(exerciseIdMap)) {
    await prisma.gymExerciseDatabase.upsert({
      where: {
        gymId_exerciseId: {
          gymId: defaultGym.id,
          exerciseId: exerciseIdMap[code],
        },
      },
      update: { isAvailable: true },
      create: {
        gymId: defaultGym.id,
        exerciseId: exerciseIdMap[code],
        isAvailable: true,
      },
    });
  }

  // ─── Difficulty Verification ───────────────────────────────────────────────
  console.log('\nVerifying difficulty scores against Document 2 table:');
  const verifyMap: Record<string, number> = {
    'EX-001': 13,  // Leg Press
    'EX-002': 34,  // Goblet Squat
    'EX-004': 50,  // Barbell Back Squat
    'EX-010': 84,  // Barbell Snatch
  };

  for (const [code, expected] of Object.entries(verifyMap)) {
    const ex = exerciseSeedData.find(e => e.code === code)!;
    const actual = computeDifficulty(ex.stability, ex.coordination, ex.load, ex.mobility, ex.injuryRisk);
    const pass = actual === expected;
    console.log(`  ${code} (${ex.name}): expected=${expected}, actual=${actual} ${pass ? '✓' : '✗ MISMATCH'}`);
  }

  console.log('\nSeed completed successfully!');
  console.log(`  Muscles: ${Object.keys(muscleMap).length}`);
  console.log(`  Equipment types: ${Object.keys(equipmentMap).length}`);
  console.log(`  Contraindications: ${Object.keys(contraindicationMap).length}`);
  console.log(`  Exercises: ${Object.keys(exerciseIdMap).length}`);
  console.log(`  Progressions: ${progressions.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// prisma/seed.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const exercises = [
  // Strength — Chest
  { id: 'e0000001-0000-4000-8000-000000000001', name: 'Push Ups', description: 'Standard bodyweight chest push ups', category: 'Strength', muscleGroup: 'Chest' },
  { id: 'e0000001-0000-4000-8000-000000000002', name: 'Bench Press', description: 'Barbell flat bench press for chest development', category: 'Strength', muscleGroup: 'Chest' },
  { id: 'e0000001-0000-4000-8000-000000000003', name: 'Incline Dumbbell Press', description: 'Upper chest focus with dumbbells on incline bench', category: 'Strength', muscleGroup: 'Chest' },
  // Strength — Back
  { id: 'e0000002-0000-4000-8000-000000000001', name: 'Pull Ups', description: 'Bodyweight vertical pulling movement', category: 'Strength', muscleGroup: 'Back' },
  { id: 'e0000002-0000-4000-8000-000000000002', name: 'Barbell Row', description: 'Bent-over barbell row for back thickness', category: 'Strength', muscleGroup: 'Back' },
  { id: 'e0000002-0000-4000-8000-000000000003', name: 'Lat Pulldown', description: 'Cable lat pulldown for back width', category: 'Strength', muscleGroup: 'Back' },
  // Strength — Legs
  { id: 'e0000003-0000-4000-8000-000000000001', name: 'Squats', description: 'Bodyweight or barbell back squats', category: 'Strength', muscleGroup: 'Legs' },
  { id: 'e0000003-0000-4000-8000-000000000002', name: 'Deadlift', description: 'Conventional barbell deadlift', category: 'Strength', muscleGroup: 'Legs' },
  { id: 'e0000003-0000-4000-8000-000000000003', name: 'Leg Press', description: 'Machine leg press for quad development', category: 'Strength', muscleGroup: 'Legs' },
  // Strength — Shoulders
  { id: 'e0000004-0000-4000-8000-000000000001', name: 'Overhead Press', description: 'Standing barbell overhead press', category: 'Strength', muscleGroup: 'Shoulders' },
  { id: 'e0000004-0000-4000-8000-000000000002', name: 'Lateral Raises', description: 'Dumbbell lateral raises for side delts', category: 'Strength', muscleGroup: 'Shoulders' },
  // Strength — Arms
  { id: 'e0000005-0000-4000-8000-000000000001', name: 'Bicep Curls', description: 'Dumbbell or barbell bicep curls', category: 'Strength', muscleGroup: 'Arms' },
  { id: 'e0000005-0000-4000-8000-000000000002', name: 'Tricep Dips', description: 'Bodyweight tricep dips on parallel bars', category: 'Strength', muscleGroup: 'Arms' },
  // Cardio — Full Body
  { id: 'e0000006-0000-4000-8000-000000000001', name: 'Running', description: 'Steady state outdoor or treadmill jogging', category: 'Cardio', muscleGroup: 'Full Body' },
  { id: 'e0000006-0000-4000-8000-000000000002', name: 'Cycling', description: 'Stationary or outdoor cycling', category: 'Cardio', muscleGroup: 'Full Body' },
  { id: 'e0000006-0000-4000-8000-000000000003', name: 'Jump Rope', description: 'High-intensity jump rope intervals', category: 'Cardio', muscleGroup: 'Full Body' },
  { id: 'e0000006-0000-4000-8000-000000000004', name: 'Burpees', description: 'Full body explosive bodyweight movement', category: 'Cardio', muscleGroup: 'Full Body' },
  // Core
  { id: 'e0000007-0000-4000-8000-000000000001', name: 'Plank', description: 'Isometric core stabilization exercise', category: 'Strength', muscleGroup: 'Core' },
  { id: 'e0000007-0000-4000-8000-000000000002', name: 'Crunches', description: 'Basic abdominal crunches', category: 'Strength', muscleGroup: 'Core' },
  { id: 'e0000007-0000-4000-8000-000000000003', name: 'Leg Raises', description: 'Hanging or lying leg raises for lower abs', category: 'Strength', muscleGroup: 'Core' },
  // Flexibility
  { id: 'e0000008-0000-4000-8000-000000000001', name: 'Yoga Flow', description: 'Dynamic yoga sequence for flexibility', category: 'Flexibility', muscleGroup: 'Full Body' },
  { id: 'e0000008-0000-4000-8000-000000000002', name: 'Hip Flexor Stretch', description: 'Static hip flexor stretching', category: 'Flexibility', muscleGroup: 'Legs' },
]

async function main() {
  console.log('🌱 Starting seed...')

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: {},
      create: exercise,
    })
  }

  console.log(`✅ Seeded ${exercises.length} exercises`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

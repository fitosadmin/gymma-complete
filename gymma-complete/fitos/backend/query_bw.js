const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const bwCount = await prisma.exercise.count({
    where: { equipment: { some: { equipment: { code: 'BW' } } } }
  });
  console.log("BW Exercises found:", bwCount);
}
main().finally(() => prisma.$disconnect());

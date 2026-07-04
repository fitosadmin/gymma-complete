const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ex = await prisma.exercise.count();
  console.log("Exercises:", ex);
}
main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const eq = await prisma.equipment.findMany();
  console.log(eq);
}
main().finally(() => prisma.$disconnect());

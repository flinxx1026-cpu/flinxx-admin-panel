import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addCol() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP');
    console.log('Column banned_at added');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
addCol();

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    console.log("Testing finding banned users...");
    const bannedUsers = await prisma.user.findMany({
      where: { is_banned: true },
    })
    console.log("Banned users count:", bannedUsers.length);
  } catch (e) {
    console.error("Error finding banned users:", e.message);
  }

  try {
    console.log("Testing finding appeals...");
    const appeals = await prisma.appeal.findMany()
    console.log("Appeals count:", appeals.length);
  } catch (e) {
    console.error("Error finding appeals:", e.message);
  }
}

test().finally(() => prisma.$disconnect())

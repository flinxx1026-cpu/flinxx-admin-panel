import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function addColumn() {
  try {
    console.log("Adding is_banned column...")
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;`)
    console.log("Column added successfully!")
    
    const report = await prisma.report.findUnique({ where: { id: "5b7a4d85-e825-42ea-b8d6-2df381665209" } })
    if (report) {
      const u = await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { is_banned: true }
      })
      console.log("User banned successfully via Prisma! ID:", u.id, "Banned:", u.is_banned)
    }
  } catch (e) {
    console.error("ERROR:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}
addColumn()

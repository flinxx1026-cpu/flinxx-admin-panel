import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function test() {
  try {
    const report = await prisma.report.findUnique({ where: { id: "5b7a4d85-e825-42ea-b8d6-2df381665209" } })
    console.log("Report:", report)
    if (report) {
      const u = await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { is_banned: true }
      })
      console.log("User updated:", u)
    }
  } catch (e) {
    console.error("PRISMA ERROR MESSAGE:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()

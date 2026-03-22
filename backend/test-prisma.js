import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        reportedUser: {
          select: { email: true, display_name: true }
        },
        reporter: {
          select: { email: true }
        }
      }
    })
    console.log("Reports found:", reports.length)
    console.log(JSON.stringify(reports, null, 2))
  } catch (e) {
    console.error("Prisma error:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()

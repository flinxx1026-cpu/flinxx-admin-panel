import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Adding banned_at column to users table...")
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_at" TIMESTAMP;`)
    console.log("banned_at added successfully.")
  } catch (e) {
    console.log("Error adding banned_at (it might already exist):", e.message)
  }

  try {
    console.log("Creating AppealStatus enum...")
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppealStatus') THEN
          CREATE TYPE "AppealStatus" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END
      $$;
    `)
    console.log("AppealStatus enum created successfully.")
  } catch (e) {
    console.log("Error creating enum:", e.message)
  }

  try {
    console.log("Creating appeals table...")
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "appeals" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "message" TEXT NOT NULL,
        "status" "AppealStatus" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewed_by" INTEGER,
        "reviewed_at" TIMESTAMP,
        CONSTRAINT "appeals_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "appeals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    console.log("appeals table created successfully.")
  } catch (e) {
    console.log("Error creating appeals table:", e.message)
  }

  try {
    console.log("Creating index on appeals status...")
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "appeals_status_idx" ON "appeals"("status");`)
    console.log("Index created successfully.")
  } catch (e) {
    console.log("Error creating index:", e.message)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

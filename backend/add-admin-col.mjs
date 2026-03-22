import prisma from './src/config/database.js';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_assigned_by_admin BOOLEAN DEFAULT false`);
    console.log('✅ Column premium_assigned_by_admin added successfully');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_assigned_plan VARCHAR(50) DEFAULT NULL`);
    console.log('✅ Column admin_assigned_plan added successfully');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

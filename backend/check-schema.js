import prisma from './src/config/database.js';

const test = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Get actual database schema
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Actual database columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    await prisma.$disconnect();
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
};

test();

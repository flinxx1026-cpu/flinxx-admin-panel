import prisma from './src/config/database.js';

const test = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    const users = await prisma.user.count();
    console.log('📊 Total users:', users);
    
    const sessions = await prisma.session.count();
    console.log('📊 Total sessions:', sessions);
    
    const usersList = await prisma.user.findMany({ take: 3 });
    console.log('📊 Sample users:', usersList);
    
    if (users === 0) {
      console.log('⚠️ No users in database - this is why dashboard shows 0');
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
};

test();

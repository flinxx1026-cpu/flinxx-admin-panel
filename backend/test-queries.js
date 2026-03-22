import prisma from './src/config/database.js';

const test = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test dashboard data queries
    console.log('\n--- DASHBOARD QUERIES TEST ---\n');
    
    const totalUsers = await prisma.user.count();
    console.log('📊 Total Users:', totalUsers);
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await prisma.user.count({
      where: {
        last_seen: {
          gte: fiveMinutesAgo
        }
      }
    });
    console.log('📊 Active Users (last 5 mins):', activeUsers);
    
    const newSignups = await prisma.user.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log('📊 New Signups (last 24h):', newSignups);
    
    const totalMale = await prisma.user.count({
      where: {
        gender: 'male'
      }
    });
    console.log('📊 Total Male Users:', totalMale);
    
    const totalFemale = await prisma.user.count({
      where: {
        gender: 'female'
      }
    });
    console.log('📊 Total Female Users:', totalFemale);
    
    const activeMale = await prisma.user.count({
      where: {
        gender: 'male',
        last_seen: {
          gte: fiveMinutesAgo
        }
      }
    });
    console.log('📊 Active Male Users:', activeMale);
    
    const activeFemale = await prisma.user.count({
      where: {
        gender: 'female',
        last_seen: {
          gte: fiveMinutesAgo
        }
      }
    });
    console.log('📊 Active Female Users:', activeFemale);
    
    const liveSessions = await prisma.session.count({
      where: {
        ended_at: null
      }
    });
    console.log('📊 Live Sessions:', liveSessions);
    
    console.log('\n✅ All queries executed successfully');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
};

test();

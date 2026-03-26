import prisma from './src/config/database.js';

async function test() {
  try {
    const res = await prisma.$queryRawUnsafe('SELECT * FROM users LIMIT 1');
    console.log(Object.keys(res[0]));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();

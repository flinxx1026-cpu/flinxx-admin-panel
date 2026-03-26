const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT premium_assigned_by_admin, admin_assigned_plan FROM users LIMIT 1').then(console.log).catch(console.error).finally(()=>prisma.$disconnect());

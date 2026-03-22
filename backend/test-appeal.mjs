import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_development_secret'; // Fallback so test works

async function testAppealFlow() {
  console.log('--- Started Appeal Flow Test ---');

  // 1. Find or create a test user
  let user = await prisma.user.findFirst({ where: { email: 'test_appeal_user@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test_appeal_user@example.com',
        display_name: 'Test Appeal User',
        is_banned: false
      }
    });
    console.log('Created test user:', user.id);
  } else {
    console.log('Using existing test user:', user.id);
  }

  // 2. Ban the user
  await prisma.user.update({
    where: { id: user.id },
    data: { is_banned: true }
  });
  console.log('User has been banned.');

  // Clean up any existing appeals for this test user
  await prisma.appeal.deleteMany({
    where: { userId: user.id }
  });

  // 3. Generate token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  // Wait for server to be ready (assuming it's running)
  const apiUrl = 'http://localhost:3001/api/appeals';

  console.log('\n--- 1. Testing First Appeal Submit ---');
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: "This is a test appeal reason." })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', data);
    
    if (res.status !== 201) throw new Error("Expected 201 Created");
  } catch (err) {
    console.error('Test 1 Failed:', err.message);
  }

  console.log('\n--- 2. Testing Duplicate Appeal Submit (Should Fail) ---');
  try {
    const res2 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: "Another test appeal." })
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log('Response:', data2);
    
    if (res2.status !== 400) throw new Error("Expected 400 Bad Request");
  } catch (err) {
    console.error('Test 2 Failed:', err.message);
  }

  console.log('\n--- 3. Testing Unbanned User Submit (Should Fail) ---');
  await prisma.user.update({
    where: { id: user.id },
    data: { is_banned: false }
  });
  console.log('User has been UNBANNED.');

  // Delete appeal to reset state
  await prisma.appeal.deleteMany({
    where: { userId: user.id }
  });

  try {
    const res3 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: "Test appeal while not banned." })
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log('Response:', data3);
    
    if (res3.status !== 400) throw new Error("Expected 400 Bad Request");
  } catch (err) {
    console.error('Test 3 Failed:', err.message);
  }

  console.log('\n--- Test Completed ---');
  process.exit(0);
}

testAppealFlow().catch(console.error);

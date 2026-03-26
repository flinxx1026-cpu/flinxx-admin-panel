import jwt from 'jsonwebtoken';
import fs from 'fs';

async function test() {
  try {
    const token = jwt.sign({ id: 1, email: 'Nikhilyadav1026@flinxx.com', role: 'ADMIN' }, 'fnjkdsnfksdnfksdnfksdnf', { expiresIn: '1h' });
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('http://localhost:3001/api/admin/users/assign-premium', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdOrEmail: 'cjhfhgch40@gmail.com', plan: 'blue_tick', duration: '15' })
    });
    const data = await res.json();
    fs.writeFileSync('error.txt', JSON.stringify(data.error));
  } catch (err) {
    console.error(err);
  }
}
test();

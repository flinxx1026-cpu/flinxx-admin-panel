const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function test() {
  const token = jwt.sign({ id: 1, email: 'Nikhilyadav1026@flinxx.com', role: 'ADMIN' }, 'fnjkdsnfksdnfksdnfksdnf', { expiresIn: '1h' });
  const res = await fetch('http://localhost:3001/api/admin/users/assign-premium', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIdOrEmail: 'cjhfhgch40@gmail.com', plan: 'blue_tick', duration: '15' })
  });
  const data = await res.json();
  console.log(data);
}
test();

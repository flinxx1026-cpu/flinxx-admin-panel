import fetch from 'node-fetch'; // if it exists, or just use native fetch if node 18+

async function testEndpoints() {
  const token = 'test-token'; // we might need auth or we can just see if it's a 401 instead of 500
  try {
    console.log("Testing GET /api/admin/users/banned");
    const res1 = await fetch('http://localhost:3001/api/admin/users/banned');
    console.log("Status:", res1.status);
    if(res1.status === 200 || res1.status === 401) {
      console.log("Banned users route OK or Authenticatin OK");
    } else {
      console.log(await res1.text());
    }

    console.log("Testing GET /api/admin/appeals");
    const res2 = await fetch('http://localhost:3001/api/admin/appeals');
    console.log("Status:", res2.status);
    if(res2.status === 200 || res2.status === 401) {
      console.log("Appeals route OK or Authentication OK");
    } else {
      console.log(await res2.text());
    }
  } catch(e) {
    console.error("Fetch error:", e.message);
  }
}

testEndpoints();

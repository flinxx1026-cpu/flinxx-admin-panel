import https from 'https';
import http from 'http';

const url = 'http://localhost:3001/api/admin/dashboard';

http.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✓ API Response Received Successfully:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
});

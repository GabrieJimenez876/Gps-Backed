const http = require('http');

const data = JSON.stringify({username:'probe_node', password:'probe_node'});

const options = {
  hostname: '127.0.0.1',
  port: 4001,
  path: '/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('REQUEST ERROR:', e.message);
  process.exit(1);
});

req.write(data);
req.end();

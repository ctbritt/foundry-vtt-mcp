// Simple test script to POST to WebRTC signaling server
const http = require('http');

const postData = JSON.stringify({
  offer: {
    type: 'offer',
    sdp: 'test'
  }
});

const options = {
  hostname: 'localhost',
  port: 31416,
  path: '/webrtc-offer',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 5000
};

console.error('Making POST request to http://localhost:31416/webrtc-offer');

const req = http.request(options, (res) => {
  console.error(`STATUS: ${res.statusCode}`);
  console.error(`HEADERS: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    console.error(`DATA CHUNK: ${chunk.length} bytes`);
  });

  res.on('end', () => {
    console.error(`RESPONSE COMPLETE: ${data}`);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`REQUEST ERROR: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('REQUEST TIMEOUT');
  req.destroy();
  process.exit(1);
});

console.error(`Writing ${postData.length} bytes...`);
req.write(postData);
req.end();
console.error('Request sent, waiting for response...');

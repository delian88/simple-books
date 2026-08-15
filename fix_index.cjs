const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

console.log('Starting server...');
const server = spawn('node', ['.output/server/index.mjs'], { stdio: 'inherit' });

setTimeout(() => {
  console.log('Fetching index.html from server...');
  http.get('http://localhost:3000/', (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      fs.writeFileSync('.output/public/index.html', data);
      console.log('Successfully saved index.html!');
      server.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Error fetching:', err);
    server.kill();
    process.exit(1);
  });
}, 3000);

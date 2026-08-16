const fs = require('fs');
const { spawn } = require('child_process');

async function generate() {
  console.log('Attempting to fetch index.html from Nitro server...');
  
  let html = '';

  try {
    // Attempt 1: Cloudflare module preset (Lovable default)
    const m = await import('./.output/server/index.mjs');
    if (m.default && m.default.fetch) {
      console.log('Detected Cloudflare module preset, invoking fetch handler directly...');
      const req = new Request('http://localhost/');
      const res = await m.default.fetch(req, {}, { waitUntil: () => {}, passThroughOnException: () => {} });
      if (res.status === 200) {
        html = await res.text();
      }
    }
  } catch (err) {
    console.log('Not a cloudflare module, falling back to node server spawn...');
  }

  // Attempt 2: Node server preset
  if (!html) {
    const server = spawn('node', ['.output/server/index.mjs'], { 
      env: { ...process.env, PORT: '34567' }
    });
    
    server.stdout.on('data', (data) => console.log(`Server: ${data}`));
    server.stderr.on('data', (data) => console.error(`Server Error: ${data}`));
    
    // Wait for server to bind
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      console.log('Fetching from local node server on port 34567...');
      const res = await fetch('http://localhost:34567/');
      if (res.status === 200) {
        html = await res.text();
      }
    } catch (err) {
      console.error('Failed to fetch from node server:', err);
    } finally {
      server.kill();
    }
  }

  if (!html) {
    console.error('Failed to generate index.html using either method.');
    process.exit(1);
  }

  // Fix corrupted route IDs injected by Nitro/Cloudflare minification that cause "Cannot set properties of undefined (setting 't')"
  html = html.replace(/i:"__root__ "/g, 'i:"__root__"');
  html = html.replace(/i:"  "/g, 'i:"/"');
  html = html.replace(/i:" "/g, 'i:"/"');

  fs.writeFileSync('.output/public/index.html', html);
  console.log('Successfully saved index.html from Nitro with SSR data!');
}

generate().catch(err => {
  console.error('Error in generation script:', err);
  process.exit(1);
});

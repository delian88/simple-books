const fs = require('fs');

async function generate() {
  console.log('Fetching index.html from Nitro server directly...');
  const m = await import('./.output/server/index.mjs');
  // Nitro export default has fetch(request, env, ctx) for Cloudflare
  const req = new Request('http://localhost/');
  const res = await m.default.fetch(req, {}, { 
    waitUntil: () => {}, 
    passThroughOnException: () => {} 
  });
  
  if (res.status !== 200) {
    console.error('Failed to generate index.html, status:', res.status);
    process.exit(1);
  }
  
  const html = await res.text();
  fs.writeFileSync('.output/public/index.html', html);
  console.log('Successfully saved index.html from Nitro with SSR data!');
}

generate().catch(err => {
  console.error('Error fetching from worker:', err);
  process.exit(1);
});

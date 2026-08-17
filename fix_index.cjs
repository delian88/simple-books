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

  // ── Convert to a pure SPA shell ─────────────────────────────────────────
  // With ssr:false, TanStack Start emits 3 scripts into <body>:
  //   0. Scroll restoration (reads sessionStorage)
  //   1. TanStack $tsr-stream-barrier — sets up window.$_TSR needed by Xn()
  //   2. <script src="/assets/index.js"> — the app bundle
  //
  // Stripping scripts 0+1 causes Xn() → "Cannot set properties of undefined".
  // Keeping them is safe because ssr:false means no page-specific route data
  // is embedded — $R.tsr stays []. Only the rendered HTML inside <div id="root">
  // causes React #418, so we clear that and keep everything else.

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];

    // Collect ALL <script> tags (both inline and src=)
    const allScripts = [];
    const scriptRe = /<script[\s\S]*?<\/script>/gi;
    let m;
    while ((m = scriptRe.exec(bodyContent)) !== null) {
      allScripts.push(m[0]);
    }

    html = html.replace(
      /<body[^>]*>[\s\S]*<\/body>/i,
      `<body>\n<div id="root"></div>\n${allScripts.join('\n')}\n</body>`
    );
  }

  fs.writeFileSync('.output/public/index.html', html);
  console.log('Saved index.html — SPA shell with scripts, empty #root, no rendered HTML.');

  // ── Fix corrupted route IDs in the JS bundle ──────────────────────────────
  // Nitro/Rolldown minification injects spaces into TanStack route ID strings,
  // e.g.  i:"__root__ "  instead of  i:"__root__"
  //       i:"  "         instead of  i:"/"
  // This causes "Cannot set properties of undefined (setting 't')" at runtime.
  const jsBundlePath = '.output/public/assets/index.js';
  if (fs.existsSync(jsBundlePath)) {
    let js = fs.readFileSync(jsBundlePath, 'utf8');
    const before = js.length;
    js = js.replace(/i:"__root__ "/g, 'i:"__root__"');
    js = js.replace(/i:"  "/g,        'i:"/"');
    js = js.replace(/i:" "/g,         'i:"/"');
    fs.writeFileSync(jsBundlePath, js);
    const fixed = before - js.length < 0 ? 'no changes' : `${before - js.length} bytes removed`;
    console.log(`Fixed route IDs in assets/index.js (${fixed}).`);
  }
}

generate().catch(err => {
  console.error('Error in generation script:', err);
  process.exit(1);
});

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
  // TanStack Start SSR embeds dehydrated router state as inline <script> tags.
  // When Apache serves this same file for ALL routes (/dashboard, /auth, etc.),
  // React tries to reconcile that state with a fresh client render → #418.
  //
  // Solution: keep only external <script src="..."> bundles. Strip all inline
  // scripts (dehydration state), all pre-rendered HTML, all <noscript> etc.
  // The result is a clean client-only SPA shell.

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];

    // Collect only <script src="..."> or <script type="module" src="..."> tags
    const externalScripts = [];
    const srcScriptRe = /<script([^>]*src=[^>]*)><\/script>/gi;
    let m;
    while ((m = srcScriptRe.exec(bodyContent)) !== null) {
      externalScripts.push(`<script${m[1]}></script>`);
    }

    html = html.replace(
      /<body[^>]*>[\s\S]*<\/body>/i,
      `<body>\n<div id="root"></div>\n${externalScripts.join('\n')}\n</body>`
    );
  }

  fs.writeFileSync('.output/public/index.html', html);
  console.log('Successfully saved index.html — pure SPA shell (no dehydrated state).');

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

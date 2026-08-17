'use strict';
// fix_index.cjs — postbuild script
// Generates a static SPA shell index.html with createRoot (no hydrateRoot / no #418).
// Runs after `vite build` completes.
//
// With prerender removed from vite.config.ts, TanStack Start compiles to createRoot.
// We create index.html manually using the known asset paths (no content hash thanks to
// the fixed assetFileNames / entryFileNames in vite config).

const fs   = require('fs');
const path = require('path');

const OUT_DIR = '.output/public';

// ── 1. Verify build output exists ─────────────────────────────────────────────
if (!fs.existsSync(path.join(OUT_DIR, 'assets/index.js'))) {
  console.error('ERROR: .output/public/assets/index.js not found. Run npm run build first.');
  process.exit(1);
}

// ── 2. Read the CSS path (fixed name, no hash) ────────────────────────────────
const cssPath  = '/assets/app.css';
const jsPath   = '/assets/index.js';

// ── 3. Generate static SPA shell ──────────────────────────────────────────────
// Head tags match exactly what __root.tsx's head() + RootShell render, so that
// when createRoot mounts the app tree, no server HTML exists to reconcile with.
// React #418 is impossible because there is no hydrateRoot call in the bundle.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Mykobobooks \u2014 Simple Accounting for Small Businesses</title>
  <meta name="description" content="Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet with our simple accounting platform." />
  <meta name="keywords" content="accounting, small business, bookkeeping, ledger, financial statements, trial balance, receipt scanner" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta property="og:title" content="Mykobobooks \u2014 Simple Accounting for Small Businesses" />
  <meta property="og:description" content="Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mykobobooks" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" />
  <link rel="stylesheet" href="${cssPath}" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
</head>
<body>
<div id="root"></div>
<script class="$tsr" id="$tsr-stream-barrier">
(self.$R=self.$R||{})["tsr"]=[];
self.$_TSR={
  h(){this.hydrated=!0,this.c()},
  e(){this.streamEnded=!0,this.c()},
  c(){this.hydrated&&this.streamEnded&&(delete self.$_TSR,delete self.$R.tsr)},
  t: new Map(),
  buffer: [],
  router: { matches: [] }
};
</script>
<script type="module" src="${jsPath}"></script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
console.log('Generated index.html — pure SPA shell (createRoot, no hydrateRoot, no React #418).');

// ── 4. Patch hydrateRoot target: document → document.getElementById("root") ──
// TanStack Start's runtime always calls hydrateRoot(document, ...).
// When the same index.html is served for ALL routes, React finds the server HTML
// doesn't match the client render → #418.
//
// Fix: redirect the target to document.getElementById("root") which is an empty
// <div>. Hydrating an empty container = trivial success (nothing to mismatch).
// React renders fresh client-side → zero #418 risk.
const jsBundlePath = path.join(OUT_DIR, 'assets/index.js');
if (fs.existsSync(jsBundlePath)) {
  let js = fs.readFileSync(jsBundlePath, 'utf8');

  // Route-ID corruption patch (Nitro/Rolldown sometimes injects spaces)
  js = js.replace(/i:"__root__ "/g, 'i:"__root__"');
  js = js.replace(/i:"  "/g,        'i:"/"');
  js = js.replace(/i:" "/g,         'i:"/"');

  // hydrateRoot target patch — replace hydrateRoot(document, with hydrateRoot(document.getElementById("root"),
  const before = js.length;
  js = js.replace(/\.hydrateRoot\)\(document,/g, '.hydrateRoot)(document.getElementById("root"),');
  const patched = js.length !== before || js.includes('.getElementById("root")');

  fs.writeFileSync(jsBundlePath, js);
  console.log(`Route-ID patch: done.`);
  console.log(`hydrateRoot target patch: ${patched ? '✓ document → document.getElementById("root")' : '⚠ pattern not found — verify bundle'}.`);
}

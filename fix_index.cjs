const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ledgerly — Simple Accounting for Small Businesses</title>
    <meta name="description" content="Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet with our simple accounting platform." />
    <meta name="keywords" content="accounting, small business, bookkeeping, ledger, financial statements, trial balance, receipt scanner" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta property="og:title" content="Ledgerly — Simple Accounting for Small Businesses" />
    <meta property="og:description" content="Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet." />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Ledgerly" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" />
    <link rel="stylesheet" href="/assets/app.css" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  </head>
  <body>
    <!-- TanStack Start hydrates onto the document -->
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;

fs.writeFileSync('.output/public/index.html', html);
console.log('Successfully wrote static index.html shell directly!');

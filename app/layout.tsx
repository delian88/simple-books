import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import "../src/styles.css"; // Ensure global CSS is imported here
import NextTopLoader from 'nextjs-toploader';
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "KoboBooks — Simple Accounting for Small Businesses",
  description: "Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet with our simple accounting platform.",
  keywords: "accounting, small business, bookkeeping, ledger, financial statements, trial balance, receipt scanner",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    title: "KoboBooks — Simple Accounting for Small Businesses",
    description: "Capture inflows from your bank statement and outflows from scanned receipts, see your profit, and keep a live balance sheet.",
    type: "website",
    siteName: "KoboBooks",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"
        />
      </head>
      <body>
        <NextTopLoader
          color="#D4AF37"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #D4AF37,0 0 5px #D4AF37"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

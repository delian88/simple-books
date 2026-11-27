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
  metadataBase: new URL("https://mykobobooks.com"),
  title: "KoboBooks — Simple Accounting for Small Businesses",
  description: "Capture inflows from your bank statement and outflows from scanned receipts, track inventory, see real-time profit, and keep a live balance sheet with KoboBooks.",
  keywords: "accounting, small business, bookkeeping, ledger, financial statements, trial balance, receipt scanner, Nigeria, invoicing, stock purchases",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
  openGraph: {
    title: "KoboBooks — Simple Accounting for Small Businesses",
    description: "Capture inflows from your bank statement and outflows from scanned receipts, track inventory, see real-time profit, and keep a live balance sheet.",
    url: "https://mykobobooks.com",
    siteName: "KoboBooks",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://mykobobooks.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "KoboBooks — Simple Accounting for Small Businesses",
        type: "image/png",
      },
      {
        url: "https://mykobobooks.com/og-image-square.png",
        width: 400,
        height: 400,
        alt: "KoboBooks Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KoboBooks — Simple Accounting for Small Businesses",
    description: "Capture inflows from your bank statement and outflows from scanned receipts, track inventory, see real-time profit, and keep a live balance sheet.",
    images: ["https://mykobobooks.com/og-image.png"],
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* WhatsApp, Facebook & Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mykobobooks.com" />
        <meta property="og:site_name" content="KoboBooks" />
        <meta property="og:title" content="KoboBooks — Simple Accounting for Small Businesses" />
        <meta property="og:description" content="Capture inflows from your bank statement and outflows from scanned receipts, track inventory, see real-time profit, and keep a live balance sheet." />
        <meta property="og:image" content="https://mykobobooks.com/og-image.png" />
        <meta property="og:image:secure_url" content="https://mykobobooks.com/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="KoboBooks — Simple Accounting for Small Businesses" />

        {/* Square Preview (WhatsApp Thumbnail) */}
        <meta property="og:image" content="https://mykobobooks.com/og-image-square.png" />
        <meta property="og:image:secure_url" content="https://mykobobooks.com/og-image-square.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KoboBooks — Simple Accounting for Small Businesses" />
        <meta name="twitter:description" content="Capture inflows from your bank statement and outflows from scanned receipts, track inventory, see real-time profit, and keep a live balance sheet." />
        <meta name="twitter:image" content="https://mykobobooks.com/og-image.png" />

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

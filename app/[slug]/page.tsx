import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/cms.functions";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/cms.php?action=listPublishedPages`);
    if (res.ok) {
      const pages = await res.json();
      if (!pages || pages.length === 0) {
        return [{ slug: 'dummy-page' }];
      }
      return pages.map((page: any) => ({
        slug: page.slug,
      }));
    }
  } catch (e) {
    // Ignore errors during build
  }
  return [{ slug: 'dummy-page' }];
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header - same as landing page */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-primary/90 transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight font-display text-gray-900 group-hover:text-primary transition-colors">
                Kobo<span className="text-primary">Books</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900">Features</Link>
              <Link href="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-gray-900">How It Works</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900">Pricing</Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">About Us</Link>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth?mode=signin" className="text-sm font-medium text-gray-700 hover:text-gray-900">Sign in</Link>
              <Link href="/auth?mode=signup" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display mb-8">{page.title}</h1>
          <div className="prose prose-lg max-w-none text-gray-700 prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </div>
      </main>

      {/* Footer - minimal version */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>© {new Date().getFullYear()} KoboBooks Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

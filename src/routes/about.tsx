import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowRight, BookOpen, FileText, Lightbulb, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
    component: ResourcesPage,
});

const RESOURCES = [
    {
        category: "Getting Started",
        items: [
            {
                icon: BookOpen,
                title: "Quick Start Guide",
                description: "Learn the basics of Ledgerly in 5 minutes",
                link: "#"
            },
            {
                icon: Video,
                title: "Video Tutorials",
                description: "Step-by-step video guides for all features",
                link: "#"
            },
            {
                icon: FileText,
                title: "Documentation",
                description: "Complete documentation and user manual",
                link: "#"
            }
        ]
    },
    {
        category: "Learning Center",
        items: [
            {
                icon: Lightbulb,
                title: "Small Business Accounting 101",
                description: "Understanding the basics of business finance",
                link: "#"
            },
            {
                icon: FileText,
                title: "Tax Preparation Guide",
                description: "Preparing your books for tax season",
                link: "#"
            },
            {
                icon: BookOpen,
                title: "Financial Reports Explained",
                description: "Understanding P&L and balance sheets",
                link: "#"
            }
        ]
    },
    {
        category: "Best Practices",
        items: [
            {
                icon: Lightbulb,
                title: "Bookkeeping Tips",
                description: "Monthly bookkeeping best practices",
                link: "#"
            },
            {
                icon: FileText,
                title: "Receipt Management",
                description: "How to organize and store receipts",
                link: "#"
            },
            {
                icon: BookOpen,
                title: "Cash Flow Management",
                description: "Tips for maintaining healthy cash flow",
                link: "#"
            }
        ]
    }
];

const BLOG_POSTS = [
    {
        title: "5 Common Bookkeeping Mistakes to Avoid",
        excerpt: "Learn how to avoid these common pitfalls that cost small businesses thousands each year.",
        date: "March 15, 2024",
        readTime: "5 min read"
    },
    {
        title: "How to Prepare Your Books for Tax Season",
        excerpt: "A step-by-step guide to getting your financial records ready for your accountant.",
        date: "March 10, 2024",
        readTime: "7 min read"
    },
    {
        title: "Understanding Your Profit and Loss Statement",
        excerpt: "A beginner's guide to reading and interpreting your P&L statement.",
        date: "March 5, 2024",
        readTime: "6 min read"
    }
];

function ResourcesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                        <BookOpenText className="h-6 w-6 text-emerald-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                        <span className="font-display text-xl font-semibold">Ledgerly</span>
                    </Link>
                    <nav className="hidden items-center gap-8 md:flex">
                        <Link to="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            Features
                        </Link>
                        <Link to="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            How it works
                        </Link>
                        <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            Pricing
                        </Link>
                        <Link to="/resources" className="text-sm font-medium text-emerald-600 hover:underline underline-offset-4">
                            Resources
                        </Link>
                        <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            About
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/auth">Sign in</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/auth">Get started free <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="pt-20">
                {/* Hero Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <h1 className="font-display text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                        Resources to help you <span className="text-emerald-600">succeed</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                        Guides, tutorials, and best practices for managing your business finances.
                    </p>
                </section>

                {/* Resources Grid */}
                <section className="mx-auto max-w-7xl px-6 pb-20">
                    {RESOURCES.map((category) => (
                        <div key={category.category} className="mb-16">
                            <h2 className="mb-8 font-display text-2xl font-bold text-gray-900">
                                {category.category}
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {category.items.map((item) => (
                                    <a
                                        key={item.title}
                                        href={item.link}
                                        className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-emerald-200"
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-emerald-600">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
                                            Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* Blog Section */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 font-display text-3xl font-bold text-gray-900">
                                From the Blog
                            </h2>
                            <p className="text-lg text-gray-600">
                                Tips, insights, and best practices from our team
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {BLOG_POSTS.map((post) => (
                                <article
                                    key={post.title}
                                    className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                >
                                    <div className="mb-4 h-48 rounded-lg bg-gradient-to-br from-emerald-50 to-cyan-50"></div>
                                    <div className="mb-2 flex items-center gap-4 text-sm text-gray-500">
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                    </div>
                                    <h3 className="mb-2 font-display text-xl font-semibold text-gray-900 group-hover:text-emerald-600">
                                        {post.title}
                                    </h3>
                                    <p className="mb-4 text-gray-600">{post.excerpt}</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                        Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Help Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <h2 className="font-display text-4xl font-bold text-gray-900">
                        Need more help?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                        Our support team is here to answer your questions and help you get the most out of Ledgerly.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/auth">
                                Get started <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <a href="mailto:support@ledgerly.app">Contact support</a>
                        </Button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white py-8">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-sm text-gray-500">
                                Ledgerly — plain-language bookkeeping for small and medium businesses.
                            </p>
                            <p className="flex items-center gap-2 text-xs text-gray-400">
                                Powered by <span className="font-semibold text-emerald-600">Nutech</span>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

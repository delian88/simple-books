import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowRight, Heart, Target, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/resources")({
    component: AboutPage,
});

function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                        <BookOpenText className="h-6 w-6 text-emerald-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                        <span className="font-display text-xl font-semibold">KoboBooks</span>
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
                        <Link to="/resources" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            Resources
                        </Link>
                        <Link to="/about" className="text-sm font-medium text-emerald-600 hover:underline underline-offset-4">
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
                        Making accounting <span className="text-emerald-600">accessible</span> for everyone
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                        We believe every small business owner should be able to understand their finances without needing an accounting degree.
                    </p>
                </section>

                {/* Mission Section */}
                <section className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-8 md:grid-cols-3">
                        <article className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <Heart className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 font-display text-xl font-semibold text-gray-900">Our Mission</h3>
                            <p className="text-gray-600">
                                To empower small business owners with simple, intuitive accounting tools that don't require professional expertise.
                            </p>
                        </article>

                        <article className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 font-display text-xl font-semibold text-gray-900">Our Vision</h3>
                            <p className="text-gray-600">
                                A world where every entrepreneur can confidently manage their finances and make informed business decisions.
                            </p>
                        </article>

                        <article className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 font-display text-xl font-semibold text-gray-900">Our Values</h3>
                            <p className="text-gray-600">
                                Simplicity, transparency, and putting our customers first in everything we do.
                            </p>
                        </article>
                    </div>
                </section>

                {/* Story Section */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-8 text-center font-display text-3xl font-bold text-gray-900">
                            Our Story
                        </h2>
                        <div className="space-y-6 text-lg text-gray-700">
                            <p>
                                KoboBooks was born from a simple frustration: why is accounting software so complicated? As small business owners ourselves, we struggled with traditional accounting tools that required deep financial knowledge and hours of training.
                            </p>
                            <p>
                                We realized that most small business owners don't need complex double-entry bookkeeping systems. They need to know three things: how much money came in, how much went out, and what's left over. Everything else is just noise.
                            </p>
                            <p>
                                So we built KoboBooks—accounting software that speaks plain English, not accounting jargon. No debits and credits. No confusing journal entries. Just simple, straightforward bookkeeping that anyone can understand.
                            </p>
                            <p>
                                Today, KoboBooks serves thousands of small businesses worldwide, helping them stay on top of their finances without keeping an accountant on retainer.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="grid gap-8 md:grid-cols-4">
                        <div className="text-center">
                            <div className="mb-2 font-display text-5xl font-bold text-emerald-600">10,000+</div>
                            <div className="text-gray-600">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 font-display text-5xl font-bold text-emerald-600">50+</div>
                            <div className="text-gray-600">Countries</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 font-display text-5xl font-bold text-emerald-600">1M+</div>
                            <div className="text-gray-600">Transactions</div>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 font-display text-5xl font-bold text-emerald-600">99.9%</div>
                            <div className="text-gray-600">Uptime</div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="bg-emerald-600 py-20">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <Mail className="mx-auto mb-6 h-12 w-12 text-white" />
                        <h2 className="mb-4 font-display text-4xl font-bold text-white">
                            Get in touch
                        </h2>
                        <p className="mb-8 text-lg text-emerald-50">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                        <Button asChild size="lg" variant="secondary">
                            <a href="mailto:hello@kobobooks.app">
                                Contact us <ArrowRight className="ml-2 h-5 w-5" />
                            </a>
                        </Button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white py-8">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-sm text-gray-500">
                                KoboBooks — plain-language bookkeeping for small and medium businesses.
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

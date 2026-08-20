import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowRight, Upload, ScanLine, TrendingUp, FileCheck, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
    component: HowItWorksPage,
});

const STEPS = [
    {
        step: 1,
        icon: Upload,
        title: "Import Your Bank Statements",
        description: "Connect your bank account or upload statements in CSV format. KoboBooks automatically reads and categorizes your transactions.",
        details: [
            "Secure bank connection with 256-bit encryption",
            "Supports all major banks and credit unions",
            "Automatic transaction sync",
            "One-time setup takes less than 2 minutes"
        ]
    },
    {
        step: 2,
        icon: ScanLine,
        title: "Scan Your Receipts",
        description: "Use your phone to snap photos of receipts. Our AI extracts vendor name, amount, date, and category automatically.",
        details: [
            "OCR technology reads receipts in seconds",
            "Auto-categorizes expenses",
            "Stores receipts securely in the cloud",
            "Search and retrieve any receipt instantly"
        ]
    },
    {
        step: 3,
        icon: TrendingUp,
        title: "Watch Your Profit Grow",
        description: "KoboBooks automatically calculates your profit and loss in real-time. No accounting knowledge required.",
        details: [
            "Real-time P&L updates",
            "Visual charts and graphs",
            "Track trends over time",
            "Compare month-over-month performance"
        ]
    },
    {
        step: 4,
        icon: FileCheck,
        title: "Generate Reports",
        description: "Create beautiful financial reports with one click. Share with your accountant or use for tax filing.",
        details: [
            "Professional-grade reports",
            "Export to PDF or Excel",
            "Customizable date ranges",
            "Tax-ready documentation"
        ]
    },
];

function HowItWorksPage() {
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
                        <Link to="/how-it-works" className="text-sm font-medium text-emerald-600 hover:underline underline-offset-4">
                            How it works
                        </Link>
                        <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            Pricing
                        </Link>
                        <Link to="/resources" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
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
                        Simple accounting in <span className="text-emerald-600">4 easy steps</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                        No accounting degree needed. KoboBooks guides you through every step of managing your books.
                    </p>
                </section>

                {/* Steps Section */}
                <section className="mx-auto max-w-5xl px-6 pb-20">
                    <div className="space-y-16">
                        {STEPS.map((step, index) => (
                            <div key={step.step}>
                                <article className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                                    {/* Left side - Icon and Title */}
                                    <div className={`flex flex-col justify-center ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                                            <step.icon className="h-8 w-8" />
                                        </div>
                                        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">
                                            Step {step.step}
                                        </div>
                                        <h2 className="mb-4 font-display text-3xl font-bold text-gray-900">
                                            {step.title}
                                        </h2>
                                        <p className="mb-6 text-lg text-gray-600">{step.description}</p>
                                        <ul className="space-y-3">
                                            {step.details.map((detail, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <ArrowRight className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                                                    <span className="text-gray-700">{detail}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Right side - Visual */}
                                    <div className={`flex items-center justify-center ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                                        <div className="relative h-64 w-full rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-8 shadow-xl lg:h-80">
                                            <div className="flex h-full items-center justify-center">
                                                <step.icon className="h-32 w-32 text-emerald-600/20" />
                                            </div>
                                        </div>
                                    </div>
                                </article>

                                {/* Arrow between steps */}
                                {index < STEPS.length - 1 && (
                                    <div className="flex justify-center py-8">
                                        <ArrowDown className="h-8 w-8 text-emerald-600 animate-bounce" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Video Section */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-7xl px-6 text-center">
                        <h2 className="mb-4 font-display text-3xl font-bold text-gray-900">
                            See KoboBooks in action
                        </h2>
                        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600">
                            Watch how easy it is to manage your books with KoboBooks
                        </p>
                        <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 shadow-2xl">
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <BookOpenText className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
                                    <p className="text-lg font-medium text-gray-700">Demo video coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <h2 className="font-display text-4xl font-bold text-gray-900">
                        Ready to get started?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                        Start managing your books the easy way. No credit card required.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/auth">
                                Start your free trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link to="/features">Explore features</Link>
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

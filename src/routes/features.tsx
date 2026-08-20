import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, Landmark, Receipt, PieChart, Lock, ArrowRight, CheckCircle2, TrendingUp, Zap, FileText, Shield, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
    component: FeaturesPage,
});

const MAIN_FEATURES = [
    {
        icon: Landmark,
        title: "Bank Statement Import",
        description: "Connect your bank accounts and import transactions automatically. Securely sync your financial data in real-time.",
        benefits: ["Automatic reconciliation", "Multi-bank support", "Secure 256-bit encryption"]
    },
    {
        icon: Receipt,
        title: "Receipt Scanning",
        description: "Snap receipts with your phone and let AI extract vendor, amount, and date automatically.",
        benefits: ["OCR technology", "Auto-categorization", "Cloud storage"]
    },
    {
        icon: TrendingUp,
        title: "Real-time Profit Tracking",
        description: "See your profit and loss update instantly as you record transactions. No complex accounting needed.",
        benefits: ["Live P&L statements", "Visual charts", "Trend analysis"]
    },
    {
        icon: PieChart,
        title: "Balance Sheet",
        description: "Track what your business owns and owes at any moment. Clear visibility into your financial position.",
        benefits: ["Asset tracking", "Liability management", "Net worth monitoring"]
    },
    {
        icon: FileText,
        title: "Financial Reports",
        description: "Beautiful, easy-to-understand reports that help you make informed business decisions.",
        benefits: ["Customizable dashboards", "Export to PDF", "Share with stakeholders"]
    },
    {
        icon: Lock,
        title: "Bank-Level Security",
        description: "Your data is protected with the same security standards used by financial institutions.",
        benefits: ["256-bit encryption", "2FA authentication", "SOC 2 compliant"]
    },
];

const ADDITIONAL_FEATURES = [
    { icon: Zap, title: "Lightning Fast", description: "Optimized for speed and performance" },
    { icon: Clock, title: "Save Time", description: "Automate 90% of your bookkeeping" },
    { icon: DollarSign, title: "Affordable Pricing", description: "Plans starting at just $10/month" },
    { icon: Users, title: "Multi-user Access", description: "Collaborate with your team and accountant" },
    { icon: Shield, title: "Data Backup", description: "Automatic daily backups to secure cloud storage" },
    { icon: CheckCircle2, title: "Easy Setup", description: "Get started in less than 5 minutes" },
];

function FeaturesPage() {
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
                        <Link to="/features" className="text-sm font-medium text-emerald-600 hover:underline underline-offset-4">
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
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-600 mb-6">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Everything you need to manage your books</span>
                    </div>
                    <h1 className="font-display text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                        Powerful features for <span className="text-emerald-600">simple accounting</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                        KoboBooks combines powerful automation with intuitive design to make bookkeeping accessible for everyone.
                    </p>
                </section>

                {/* Main Features Grid */}
                <section className="mx-auto max-w-7xl px-6 py-16">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {MAIN_FEATURES.map((feature, index) => (
                            <article
                                key={feature.title}
                                className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-emerald-200"
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 font-display text-xl font-semibold text-gray-900">{feature.title}</h3>
                                <p className="mb-4 text-sm text-gray-600">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Additional Features */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-7xl px-6">
                        <h2 className="mb-12 text-center font-display text-3xl font-bold text-gray-900">
                            And there's more...
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ADDITIONAL_FEATURES.map((feature) => (
                                <div key={feature.title} className="flex items-start gap-4 rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-semibold text-gray-900">{feature.title}</h4>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <h2 className="font-display text-4xl font-bold text-gray-900">
                        Ready to simplify your accounting?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                        Join thousands of small businesses using KoboBooks to manage their books.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/auth">
                                Start your free trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link to="/pricing">View pricing</Link>
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

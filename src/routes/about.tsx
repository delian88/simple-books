import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowRight, BookOpen, FileText, Lightbulb, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
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
                <section className="mx-auto max-w-4xl px-6 py-20">
                    <div className="mb-12 text-center">
                        <h1 className="font-display text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                            About <span className="text-emerald-600">Us</span>
                        </h1>
                        <p className="mx-auto mt-6 text-lg text-gray-600 max-w-2xl">
                            Demystifying accounting for everyone. Here is what you need to know about the foundation of bookkeeping.
                        </p>
                    </div>

                    <div className="prose prose-lg prose-emerald mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-3xl font-display font-semibold text-gray-900 mb-6">The General Ledger</h2>
                        <p className="text-gray-700 leading-relaxed mb-10">
                            A general ledger is a master record of all financial transactions in a business. It sorts and summarizes every debit and credit into specific accounts like assets, liabilities, equity, revenue, and expenses. It acts as the central source used to build financial reports (trial balance, income statement and balance sheet)
                        </p>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-2xl font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Lightbulb className="h-6 w-6 text-emerald-600" />
                                    Why It Matters
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Creates the trial balance to check that all debits equal all credits.</span>
                                    </li>
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Feeds key reports like the balance sheet and income statement.</span>
                                    </li>
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Provides a clear audit trail to verify financial health.</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-2xl font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-emerald-600" />
                                    How It Works
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Uses double-entry bookkeeping so every transaction balances equal debits and credits.</span>
                                    </li>
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Organizes entries through a chart of accounts.</span>
                                    </li>
                                    <li className="flex gap-3 text-gray-700">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span>Collects data from the general journal where daily transactions are first written down.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowRight, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
    component: PricingPage,
});

const PLANS = [
    {
        name: "Starter",
        price: 10,
        period: "month",
        description: "Perfect for freelancers and side hustles",
        features: [
            "Up to 100 transactions/month",
            "1 bank account connection",
            "Receipt scanning (20/month)",
            "Basic reports",
            "Email support",
            "Mobile app access"
        ],
        cta: "Start free trial",
        popular: false
    },
    {
        name: "Professional",
        price: 25,
        period: "month",
        description: "Ideal for growing small businesses",
        features: [
            "Up to 500 transactions/month",
            "3 bank account connections",
            "Unlimited receipt scanning",
            "Advanced reports & analytics",
            "Priority email support",
            "Mobile app access",
            "Multi-user access (2 users)",
            "Export to Excel/PDF"
        ],
        cta: "Start free trial",
        popular: true
    },
    {
        name: "Business",
        price: 50,
        period: "month",
        description: "For established businesses",
        features: [
            "Unlimited transactions",
            "Unlimited bank connections",
            "Unlimited receipt scanning",
            "Premium reports & analytics",
            "Phone & email support",
            "Mobile app access",
            "Multi-user access (5 users)",
            "Export to Excel/PDF",
            "Custom categories",
            "API access"
        ],
        cta: "Start free trial",
        popular: false
    }
];

const FAQ = [
    {
        question: "Is there a free trial?",
        answer: "Yes! All plans come with a 14-day free trial. No credit card required to start."
    },
    {
        question: "Can I cancel anytime?",
        answer: "Absolutely. You can cancel your subscription at any time with no penalties or fees."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal."
    },
    {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with Mykobobooks."
    },
    {
        question: "Can I change plans later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, we use bank-level 256-bit encryption and are SOC 2 compliant to keep your data safe."
    }
];

function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                        <BookOpenText className="h-6 w-6 text-emerald-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                        <span className="font-display text-xl font-semibold">Mykobobooks</span>
                    </Link>
                    <nav className="hidden items-center gap-8 md:flex">
                        <Link to="/features" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            Features
                        </Link>
                        <Link to="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline underline-offset-4">
                            How it works
                        </Link>
                        <Link to="/pricing" className="text-sm font-medium text-emerald-600 hover:underline underline-offset-4">
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
                        Simple, <span className="text-emerald-600">transparent</span> pricing
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                        Choose the plan that fits your business. All plans include a 14-day free trial.
                    </p>
                </section>

                {/* Pricing Cards */}
                <section className="mx-auto max-w-7xl px-6 pb-20">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {PLANS.map((plan) => (
                            <article
                                key={plan.name}
                                className={`relative rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-xl ${plan.popular
                                    ? 'border-emerald-600 ring-2 ring-emerald-600 lg:scale-105'
                                    : 'border-gray-200'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                                            <Star className="h-4 w-4 fill-current" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="mb-2 font-display text-2xl font-bold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                                        <span className="text-gray-600">/{plan.period}</span>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    size="lg"
                                    className={`mb-6 w-full ${plan.popular
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-gray-900 hover:bg-gray-800'
                                        }`}
                                >
                                    <Link to="/auth">
                                        {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-3xl px-6">
                        <h2 className="mb-12 text-center font-display text-3xl font-bold text-gray-900">
                            Frequently asked questions
                        </h2>
                        <div className="space-y-6">
                            {FAQ.map((item) => (
                                <article key={item.question} className="rounded-lg bg-white p-6 shadow-sm">
                                    <h3 className="mb-2 font-semibold text-gray-900">{item.question}</h3>
                                    <p className="text-gray-600">{item.answer}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 text-center">
                    <h2 className="font-display text-4xl font-bold text-gray-900">
                        Still have questions?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                        We're here to help. Contact our team for personalized assistance.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/auth">
                                Start free trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link to="/about">Contact sales</Link>
                        </Button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white py-8">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-sm text-gray-500">
                                Mykobobooks — plain-language bookkeeping for small and medium businesses.
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

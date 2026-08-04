import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, ArrowDownLeft, ArrowUpRight, Scale, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledgerly — Simple Accounting for Small Businesses" },
      {
        name: "description",
        content:
          "Capture inflows from your bank statement, outflows from scanned receipts, see your profit and keep a live balance sheet. Built for SMEs.",
      },
      { property: "og:title", content: "Ledgerly — Simple Accounting for Small Businesses" },
      {
        property: "og:description",
        content: "Bank statement inflows, scanned receipt outflows, profit and balance sheet — in one simple ledger.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: ArrowDownLeft,
    title: "Money in",
    body: "Import your bank statement and tag each credit as capital, sales, a loan, or a payment from a debtor.",
  },
  {
    icon: ArrowUpRight,
    title: "Money out",
    body: "Photograph a third-party receipt. The vendor, amount and date are read for you and filed as an asset, expense, vendor payment or loan repayment.",
  },
  {
    icon: TrendingUp,
    title: "Profit",
    body: "Sales revenue minus business expenses, updated the moment you record an entry. No journals, no debits and credits.",
  },
  {
    icon: Scale,
    title: "Balance sheet",
    body: "List what the business owns and what it owes to see your net worth at any time.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="flex items-center gap-2 font-display text-xl">
          <BookOpenText className="h-5 w-5 text-accent" />
          Ledgerly
        </span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="ledger-grid border-y border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Accounting for small business</p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Keep your books without keeping an accountant on retainer.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Inflows come straight from your bank statement. Outflows come from the receipts already in your pocket.
            Ledgerly turns them into profit and a balance sheet you can actually read.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start your ledger</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {STEPS.map((step) => (
            <article key={step.title} className="rounded-lg border border-border bg-card p-6 shadow-ledger">
              <step.icon className="h-6 w-6 text-accent" />
              <h2 className="mt-4 font-display text-xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Ledgerly — plain-language bookkeeping for small and medium businesses.
      </footer>
    </div>
  );
}

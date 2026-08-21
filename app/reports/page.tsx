"use client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2, Scale, ScrollText } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Income Statement",
    description: "View your company's revenue, expenses, and net profit over a specific period.",
    icon: <FileText className="h-6 w-6 text-primary" />,
    href: "/income-statement",
  },
  {
    title: "Balance Sheet",
    description: "A snapshot of your company's assets, liabilities, and equity at a specific point in time.",
    icon: <Building2 className="h-6 w-6 text-primary" />,
    href: "/balance-sheet",
  },
  {
    title: "Trial Balance",
    description: "Check the mathematical accuracy of your bookkeeping by viewing all account balances.",
    icon: <Scale className="h-6 w-6 text-primary" />,
    href: "/trial-balance",
  },
  {
    title: "Account Statement",
    description: "Generate a detailed statement of legal and financial transactions for a specific period.",
    icon: <ScrollText className="h-6 w-6 text-primary" />,
    href: "/account-statement",
  },
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Generate and view financial reports and analytics.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {reports.map((report, idx) => (
          <Link href={report.href} key={idx} className="block transition-transform hover:-translate-y-1">
            <Card className="h-full hover:border-primary/50 transition-colors shadow-sm cursor-pointer">
              <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {report.icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-display">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mt-2 text-muted-foreground">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

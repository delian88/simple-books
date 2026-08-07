import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { 
  BookOpenText, 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  LogOut, 
  Search, 
  Bell,
  Sun,
  Moon,
  Users,
  Settings,
  CreditCard,
  FileText,
  Menu,
  X
} from "lucide-react";
import type { ReactNode } from "react";
import { logout, getSession } from "@/lib/auth.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIChatWidget } from "@/components/AIChatWidget";

const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/sales/invoices", label: "Sales Invoices", icon: FileText },
  { to: "/expenses", label: "Expenses (AI)", icon: ArrowUpRight },
  { to: "/money-in", label: "Money In", icon: ArrowDownLeft },
  { to: "/money-out", label: "Money Out", icon: ArrowUpRight },
  { to: "/balance-sheet", label: "Balance Sheet", icon: Scale },
  { to: "/chart-of-accounts", label: "Chart of Accounts", icon: BookOpenText },
  { to: "/ledger", label: "General Ledger", icon: FileText },
  { to: "/journal-templates", label: "Journal Templates", icon: FileText },
] as const;

const ADMIN_NAV = [
  { to: "/admin/cms", label: "CMS Management", icon: FileText },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: user } = useQuery({
    queryKey: ["session"],
    queryFn: () => getSession(),
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function signOut() {
    await logout();
    navigate({ to: "/auth" });
  }

  // Determine if it's the dashboard to show the custom header title instead of the page title
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/admin";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B3D2B] text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 lg:h-20 items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3 font-display text-xl font-bold">
            <div className="rounded border-2 border-[#D4AF37] p-1">
              <BookOpenText className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="leading-none">Ledgerly</div>
              {user?.role === "Admin" && (
                <div className="text-[10px] font-medium tracking-widest text-white/50 uppercase mt-1">Super Admin</div>
              )}
            </div>
          </Link>
          <button 
            className="lg:hidden text-white/70 hover:text-white" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1.5 px-3">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                activeProps={{ className: "bg-[#145C42] text-white font-semibold" }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}

            {user?.role === "Admin" && (
              <>
                <div className="mx-3 my-4 border-t border-white/10"></div>
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    activeProps={{ className: "bg-[#145C42] text-white font-semibold" }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto">
          {user?.role === "Admin" && (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                 <div className="text-[#D4AF37] text-xl leading-none">👑</div>
              </div>
              <p className="text-xs font-medium text-white pr-6">Manage with power.</p>
              <p className="mt-1 text-[11px] text-white/60">Monitor, control and grow your business from one place.</p>
              <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white h-8 text-xs">
                View Reports &rarr;
              </Button>
            </div>
          )}

          <div className="flex items-center rounded-full bg-black/20 p-1 mb-6">
            <button className="flex-1 rounded-full bg-[#145C42] py-1.5 text-xs font-medium flex items-center justify-center gap-1.5">
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button className="flex-1 rounded-full py-1.5 text-xs font-medium text-white/60 flex items-center justify-center gap-1.5 hover:text-white">
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
          </div>

          <div className="px-2 text-[10px] text-white/40 mb-2">
            <p>© 2025 Ledgerly</p>
            <p>All rights reserved.</p>
          </div>
          
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-white/60 hover:bg-white/10 hover:text-white px-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col lg:pl-64">
        {/* Main Header */}
        <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 lg:h-20 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              {isDashboard ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground lg:text-sm">Welcome back, 👋</p>
                  <h1 className="font-display text-lg font-bold lg:text-2xl">{user?.role === "Admin" ? "Super Admin" : "Dashboard"}</h1>
                </>
              ) : (
                <>
                  <h1 className="font-display text-lg font-bold lg:text-2xl">{title}</h1>
                  {subtitle && <p className="text-xs text-muted-foreground lg:text-sm">{subtitle}</p>}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="relative hidden w-64 md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search anything..." 
                className="pl-9 bg-muted/30 border-muted rounded-full h-9 focus-visible:ring-1" 
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <kbd className="rounded border bg-muted px-1">⌘</kbd>
                <kbd className="rounded border bg-muted px-1">K</kbd>
              </div>
            </div>

            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-background">
                8
              </span>
            </button>

            <div className="flex items-center gap-3 border-l border-border pl-3 lg:pl-6">
              <Avatar className="h-7 w-7 border lg:h-9 lg:w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-semibold">{user?.role === "Admin" ? "Super Admin" : "User"}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {isDashboard && (
             <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <p className="text-sm text-muted-foreground mt-1">Here's a running summary of everything you have recorded.</p>
                {actions}
             </div>
          )}
          {!isDashboard && actions && (
             <div className="mb-6 flex justify-end">
                {actions}
             </div>
          )}
          {children}
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}

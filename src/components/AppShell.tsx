import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  X,
  Printer,
  BarChart3,
} from "lucide-react";
import type { ReactNode } from "react";
import { logout, getSession } from "@/lib/auth.functions";
import { getPublicSettings } from "@/lib/app.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNotifications, relativeTime } from "@/contexts/NotificationContext";

const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/sales/invoices", label: "Sales Invoices", icon: FileText },
  { to: "/expenses", label: "Expenses (AI)", icon: ArrowUpRight },
  { to: "/money-in", label: "Money In", icon: ArrowDownLeft },
  { to: "/money-out", label: "Money Out", icon: ArrowUpRight },
  { to: "/chart-of-accounts", label: "Chart of Accounts", icon: BookOpenText },
  { to: "/ledger", label: "General Journal", icon: FileText },
  { to: "/account-statement", label: "General Ledger", icon: FileText },
  { to: "/trial-balance", label: "Trial Balance", icon: Scale },
  { to: "/income-statement", label: "Income Statement", icon: Scale },
  { to: "/balance-sheet", label: "Balance Sheet", icon: Scale },
  { to: "/reports", label: "Reports Hub", icon: BarChart3 },
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

  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => getPublicSettings(),
  });

  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  async function signOut() {
    await logout();
    router.push("/auth");
  }

  // Determine if it's the dashboard to show the custom header title instead of the page title
  const isDashboard = pathname === "/dashboard" || pathname === "/admin";

  // Real notifications from context
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // Derive displayName from user details
  const displayName =
    user?.businessName ||
    (user?.email ? user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "User");



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
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0B3D2B] text-white transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 lg:h-20 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-3 font-display text-xl font-bold">
            {appSettings?.appLogo ? (
              <img src={appSettings.appLogo} alt="App Logo" className="h-8 w-8 object-contain" />
            ) : (
              <div className="rounded border-2 border-[#D4AF37] p-1">
                <BookOpenText className="h-5 w-5 text-[#D4AF37]" />
              </div>
            )}
            <div>
              <div className="leading-none">{appSettings?.appName || "KoboBooks"}</div>
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
                href={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === item.to 
                    ? "bg-[#145C42] text-white font-semibold" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
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
                    href={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      pathname === item.to 
                        ? "bg-[#145C42] text-white font-semibold" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
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
              <Link href="/reports" className="block w-full mt-3">
                <Button variant="outline" size="sm" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white h-8 text-xs">
                  View Reports &rarr;
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center rounded-full bg-black/20 p-1 mb-6">
            <button 
              onClick={() => setIsDarkMode(false)}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${!isDarkMode ? "bg-[#145C42] text-white" : "text-white/60 hover:text-white"}`}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button 
              onClick={() => setIsDarkMode(true)}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${isDarkMode ? "bg-[#145C42] text-white" : "text-white/60 hover:text-white"}`}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
          </div>

          <div className="px-2 text-[10px] text-white/40 mb-2">
            <p>© {new Date().getFullYear()} {appSettings?.appName || "KoboBooks"}</p>
            <p>All rights reserved.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-white/60 hover:bg-white/10 hover:text-white px-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex h-full flex-1 min-w-0 flex-col lg:pl-64 print:pl-0">
        {/* Main Header */}
        <header className="flex min-h-[3.5rem] py-3 lg:h-20 lg:py-0 w-full shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 lg:px-8 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              {isDashboard ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground lg:text-sm">Welcome back, 👋</p>
                  <h1 className="font-display text-lg font-bold lg:text-2xl">{user?.role === "Admin" ? "Super Admin" : displayName}</h1>
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
                className="pl-9 bg-muted/30 border-muted rounded-full h-9 focus-visible:ring-1 cursor-pointer" 
                onClick={() => setIsSearchOpen(true)}
                readOnly
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-muted-foreground font-medium pointer-events-none">
                <kbd className="rounded border bg-muted px-1">⌘</kbd>
                <kbd className="rounded border bg-muted px-1">K</kbd>
              </div>
            </div>

            <button 
              className="relative text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => window.print()}
              title="Print"
            >
              <Printer className="h-5 w-5" />
            </button>

            {/* Notification Bell Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl border-border/40 shadow-xl" align="end">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card text-card-foreground rounded-t-2xl">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>
                </div>
                <div className="divide-y divide-border/40 max-h-80 overflow-y-auto bg-card text-card-foreground">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-muted/50 transition-colors flex gap-3 items-start">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-muted-foreground/30" : "bg-emerald-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                          {n.body && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.body}</p>}
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{relativeTime(n.time)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2.5 bg-muted/30 border-t border-border/40 text-center rounded-b-2xl">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-xs text-emerald-700 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Mark all as read
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 border-l border-border pl-3 lg:pl-6 hover:opacity-80 transition-opacity focus:outline-none">
                  <Avatar className="h-7 w-7 border lg:h-9 lg:w-9">
                    <AvatarImage src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                    <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col md:flex text-left">
                    <span className="text-sm font-semibold text-foreground">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => { router.push('/dashboard'); setIsSearchOpen(false); }}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => { router.push('/money-in'); setIsSearchOpen(false); }}>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  <span>Record Inflows</span>
                </CommandItem>
                <CommandItem onSelect={() => { router.push('/expenses'); setIsSearchOpen(false); }}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  <span>Scan Receipts</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Reports">
                <CommandItem onSelect={() => { router.push('/reports'); setIsSearchOpen(false); }}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Reports Hub</span>
                </CommandItem>
                <CommandItem onSelect={() => { router.push('/income-statement'); setIsSearchOpen(false); }}>
                  <Scale className="mr-2 h-4 w-4" />
                  <span>Income Statement</span>
                </CommandItem>
                <CommandItem onSelect={() => { router.push('/trial-balance'); setIsSearchOpen(false); }}>
                  <Scale className="mr-2 h-4 w-4" />
                  <span>Trial Balance</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => { router.push('/admin/settings'); setIsSearchOpen(false); }}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 print:p-0">
          {isDashboard && (
             <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
                <p className="text-sm text-muted-foreground mt-1">Here's a running summary of everything you have recorded.</p>
                {actions}
             </div>
          )}
          {!isDashboard && actions && (
             <div className="mb-6 flex justify-end print:hidden">
                {actions}
             </div>
          )}
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <AIChatWidget />
      </div>
    </div>
  );
}

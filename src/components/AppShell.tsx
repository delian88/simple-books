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
  Package,
  Boxes,
  Warehouse,
  Landmark,
  ChevronDown,
  ChevronRight,
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

export type NavItem = {
  to: string;
  label: string;
  icon: any;
};

export type NavGroup = {
  title?: string;
  icon?: any;
  items: NavItem[];
};

const PROFIT_BOOKS_NAV: NavGroup[] = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Income",
    icon: ArrowDownLeft,
    items: [
      { to: "/sales/invoices", label: "Invoices", icon: FileText },
      { to: "/recurring-invoices", label: "Recurring Invoices", icon: FileText },
      { to: "/receipts", label: "Receipts", icon: CreditCard },
      { to: "/estimates", label: "Estimate", icon: FileText },
      { to: "/sales-orders", label: "Sales Orders", icon: FileText },
      { to: "/credit-notes", label: "Credit Notes", icon: FileText },
      { to: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Expenses",
    icon: ArrowUpRight,
    items: [
      { to: "/expenses", label: "Business Expenses", icon: ArrowUpRight },
      { to: "/stock-purchases", label: "Stock Purchases", icon: Boxes },
      { to: "/purchase-orders", label: "Purchase Orders", icon: FileText },
      { to: "/vendor-payments", label: "Vendor Payments", icon: CreditCard },
      { to: "/vendors", label: "Vendors", icon: Users },
    ],
  },
  {
    title: "Banking",
    icon: Landmark,
    items: [
      { to: "/banking", label: "Banks", icon: Landmark },
      { to: "/bank-reconciliation", label: "Bank Reconciliation", icon: Landmark },
      { to: "/bank-rules", label: "Bank Rules", icon: Landmark },
    ],
  },
  {
    title: "Accounting",
    icon: BookOpenText,
    items: [
      { to: "/chart-of-accounts", label: "Chart of Accounts", icon: BookOpenText },
      { to: "/taxes", label: "Taxes", icon: FileText },
      { to: "/ledger", label: "Journal Entries", icon: FileText },
      { to: "/simple-accounting", label: "Simple Accounting Entries", icon: Scale },
      { to: "/reimbursements", label: "Reimbursements", icon: CreditCard },
      { to: "/projects", label: "Projects", icon: BarChart3 },
      { to: "/team", label: "Auditors & Team", icon: Users },
    ],
  },
  {
    title: "Items",
    icon: Package,
    items: [
      { to: "/products", label: "Products/Services", icon: Package },
      { to: "/inventory", label: "Stock Adjustments", icon: Boxes },
      { to: "/warehouses", label: "Warehouses", icon: Warehouse },
    ],
  },
  {
    title: "Employees",
    icon: Users,
    items: [
      { to: "/employees", label: "Employees", icon: Users },
      { to: "/payroll", label: "Manage Payroll", icon: CreditCard },
      { to: "/leave-requests", label: "Leave Requests", icon: FileText },
    ],
  },
  {
    items: [
      { to: "/reports", label: "Reports Hub", icon: BarChart3 },
    ],
  },
];

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

  // ProfitBooks nav group accordion state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    Income: true,
    Expenses: true,
    Banking: false,
    Accounting: false,
    Items: false,
    Employees: false,
  }));

  // Automatically expand group containing active pathname
  useEffect(() => {
    PROFIT_BOOKS_NAV.forEach((g) => {
      if (g.title && g.items.some((i) => i.to === pathname)) {
        setOpenGroups((prev) => ({ ...prev, [g.title!]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

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
            <img
              src={appSettings?.appLogo || "/logo.png"}
              alt="KoboBooks Logo"
              className="h-8 w-8 object-contain rounded"
            />
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

        <div className="flex-1 overflow-y-auto py-3">
          <nav className="space-y-1 px-3">
            {PROFIT_BOOKS_NAV.map((group, gIdx) => {
              if (!group.title) {
                // Direct items (e.g. Dashboard, Reports Hub)
                return group.items.map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.to
                        ? "bg-[#145C42] text-white font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ));
              }

              const isOpen = openGroups[group.title] ?? false;
              const hasActiveChild = group.items.some((i) => i.to === pathname);

              return (
                <div key={group.title} className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title!)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      hasActiveChild
                        ? "text-emerald-300 font-bold bg-white/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {group.icon && <group.icon className="h-3.5 w-3.5 text-[#D4AF37]" />}
                      <span>{group.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-0.5 space-y-0.5 pl-2 border-l border-white/15 ml-3">
                      {group.items.map((item) => {
                        const active = pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            href={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              active
                                ? "bg-[#145C42] text-white font-semibold shadow-sm"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {user?.role === "Admin" && (
              <>
                <div className="mx-3 my-3 border-t border-white/10"></div>
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Super Admin</div>
                {ADMIN_NAV.map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      pathname === item.to 
                        ? "bg-[#145C42] text-white font-semibold" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
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
            <CommandInput placeholder="Type a command or search any ProfitBooks module..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {PROFIT_BOOKS_NAV.map((g, idx) => (
                <CommandGroup key={g.title || idx} heading={g.title || "Quick Links"}>
                  {g.items.map((item) => (
                    <CommandItem
                      key={item.to}
                      onSelect={() => {
                        router.push(item.to);
                        setIsSearchOpen(false);
                      }}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
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

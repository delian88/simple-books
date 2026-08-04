import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, Landmark, Receipt, PieChart, Lock, ArrowRight, CheckCircle2, ChevronDown, MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

const FEATURES = [
  {
    icon: Landmark,
    title: "Connect your bank",
    body: "Securely connect your bank accounts and import transactions automatically.",
  },
  {
    icon: Receipt,
    title: "Track your receipts",
    body: "Snap receipts on the go. Ledgerly extracts the details so you never lose a write-off.",
  },
  {
    icon: PieChart,
    title: "Get clear reports",
    body: "Beautiful financial reports that help you understand your business at a glance.",
  },
  {
    icon: Lock,
    title: "Your data is safe",
    body: "Bank-level encryption and privacy-first by design. Your data, always protected.",
  },
];

const TRUST_LOGOS = [
  "Acme Co.",
  "Bloom",
  "PULSE",
  "CLEANORA",
  "NORTHWAY",
  "velocity",
];

function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [chartHeights, setChartHeights] = useState([40, 65, 45, 70, 55, 80, 60]);
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([
    { text: "Hi! I'm Ledgerly AI Assistant. How can I help you today?", isUser: false, timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const heroWords = ["Keep", "your", "books", "without", "keeping", "an", "accountant", "on", "retainer."];
  const fullText = "Inflows come straight from your bank statement. Outflows come from the receipts already in your pocket. Ledgerly turns them into profit and a balance sheet you can actually read.";

  // AI Assistant responses
  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("pricing")) {
      return "Our pricing starts at just $10/month for the Starter plan. We also offer Professional ($25/month) and Business ($50/month) plans. All plans include a 14-day free trial with no credit card required!";
    }
    if (lowerMessage.includes("feature") || lowerMessage.includes("what can") || lowerMessage.includes("capabilities")) {
      return "Ledgerly offers bank statement import, receipt scanning with OCR, real-time profit tracking, balance sheet management, and beautiful financial reports. Everything you need for simple bookkeeping!";
    }
    if (lowerMessage.includes("how") && lowerMessage.includes("work")) {
      return "It's simple! 1) Import your bank statements, 2) Scan receipts with your phone, 3) Watch your profit update in real-time, 4) Generate reports with one click. No accounting knowledge needed!";
    }
    if (lowerMessage.includes("secure") || lowerMessage.includes("security") || lowerMessage.includes("safe")) {
      return "Yes! We use bank-level 256-bit encryption, 2FA authentication, and are SOC 2 compliant. Your financial data is protected with the same security standards used by banks.";
    }
    if (lowerMessage.includes("trial") || lowerMessage.includes("free")) {
      return "Absolutely! All plans come with a 14-day free trial. No credit card required to start, and you can cancel anytime with no penalties.";
    }
    if (lowerMessage.includes("support") || lowerMessage.includes("help") || lowerMessage.includes("contact")) {
      return "We offer email support for all plans, with priority support for Professional users and phone support for Business plans. You can also browse our knowledge base and video tutorials.";
    }
    if (lowerMessage.includes("mobile") || lowerMessage.includes("app") || lowerMessage.includes("phone")) {
      return "Yes! Ledgerly has mobile apps for both iOS and Android. You can scan receipts, check your profit, and manage transactions on the go.";
    }
    if (lowerMessage.includes("accountant") || lowerMessage.includes("cpa")) {
      return "Ledgerly is designed to work seamlessly with your accountant. You can invite them to access your books, export reports in their preferred format, and share real-time data.";
    }
    if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
      return "You're welcome! Feel free to ask if you have any other questions. Ready to get started? Click 'Start your ledger' above!";
    }
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return "Hello! 👋 I'm here to help you learn about Ledgerly. What would you like to know?";
    }

    return "Great question! I'd recommend checking out our Features or How It Works pages for more details. Or you can start a free trial to experience Ledgerly firsthand. Is there anything specific you'd like to know?";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg = { text: inputMessage, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      const aiMsg = { text: aiResponse, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  useEffect(() => {
    setIsVisible(true);

    // Animate chart bars
    const interval = setInterval(() => {
      setChartHeights(prev => prev.map(() => Math.random() * 60 + 40));
    }, 3000);

    // Typing animation for description - faster speed
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 15); // Changed from 30ms to 15ms (2x faster)

    // Word by word animation for title - faster reveals
    const wordInterval = setInterval(() => {
      setWordIndex(prev => {
        if (prev < heroWords.length - 1) {
          return prev + 1;
        }
        clearInterval(wordInterval);
        return prev;
      });
    }, 100); // Changed from 200ms to 100ms (2x faster)

    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
      clearInterval(wordInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm animate-in fade-in slide-in-from-top duration-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <BookOpenText className="h-6 w-6 text-emerald-600 transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span className="font-display text-xl font-semibold">Ledgerly</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/features" className="group flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
              Features <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline underline-offset-4">
              How it works
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline underline-offset-4">
              Pricing
            </Link>
            <Link to="/resources" className="group flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
              Resources <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </Link>
            <Link to="/about" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 hover:underline underline-offset-4">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="transition-all hover:scale-105">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="group bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-200">
              <Link to="/auth">
                Get started free <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-20">

        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-12 sm:pb-16 pt-8 sm:pt-12 overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-100 opacity-30 blur-3xl animate-blob"></div>
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-100 opacity-30 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100 opacity-20 blur-3xl animate-blob animation-delay-4000"></div>

          {/* Accounting Background Elements */}
          {/* Calculator Icon */}
          <div className="absolute top-10 left-10 opacity-5 animate-float">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="16" y2="14" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
          </div>

          {/* Pie Chart */}
          <div className="absolute top-32 right-20 opacity-5 animate-float-delay-1000">
            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2 L12 12 L21.5 8.5" />
              <path d="M12 12 L6.5 19" />
            </svg>
          </div>

          {/* Dollar Sign */}
          <div className="absolute bottom-20 left-20 opacity-5 animate-float-delay-500">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>

          {/* Receipt Icon */}
          <div className="absolute bottom-32 right-16 opacity-5 animate-float-delay-1500">
            <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
          </div>

          {/* Coins Stack */}
          <div className="absolute top-1/2 left-5 opacity-5 animate-float-delay-2000">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <ellipse cx="12" cy="5" rx="7" ry="3" />
              <path d="M5 5v8c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
              <path d="M5 9v4c0 1.66 3.13 3 7 3s7-1.34 7-3V9" />
            </svg>
          </div>

          {/* Bar Chart */}
          <div className="absolute top-20 right-1/4 opacity-5 animate-float-delay-800">
            <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>

          {/* Invoice/Document */}
          <div className="absolute bottom-10 left-1/3 opacity-5 animate-float-delay-1200">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
          </div>

          {/* Trend Line Arrow */}
          <div className="absolute top-40 left-1/4 opacity-5 animate-float-delay-1800">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>

          {/* Credit Card */}
          <div className="absolute bottom-40 right-1/3 opacity-5 animate-float-delay-2500">
            <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>

          {/* Percentage Sign */}
          <div className="absolute top-2/3 right-10 opacity-5 animate-float-delay-300">
            <svg width="95" height="95" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          </div>

          {/* Balance Scale */}
          <div className="hidden lg:block absolute top-1/3 right-5 opacity-5 animate-float-delay-1300">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-600">
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M3 10h6l-3-6z" />
              <path d="M15 10h6l-3-6z" />
              <line x1="3" y1="10" x2="9" y2="10" />
              <line x1="15" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          {/* Decorative Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(to right, rgb(5, 150, 105) 1px, transparent 1px),
                               linear-gradient(to bottom, rgb(5, 150, 105) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Horizontal Scrolling Background Images */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Top Scrolling Row */}
            <div className="absolute top-10 left-0 w-full h-32 flex gap-16 animate-scroll-left">
              {/* Image 1: Laptop with Charts */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Laptop Screen */}
                  <rect x="20" y="10" width="160" height="90" rx="4" fill="currentColor" className="text-emerald-600" opacity="0.3" />
                  <rect x="30" y="20" width="140" height="70" fill="white" opacity="0.8" />
                  {/* Chart Lines */}
                  <polyline points="40,70 70,50 100,60 130,35 160,45" stroke="currentColor" strokeWidth="3" fill="none" className="text-emerald-600" />
                  <circle cx="70" cy="50" r="4" fill="currentColor" className="text-emerald-600" />
                  <circle cx="100" cy="60" r="4" fill="currentColor" className="text-emerald-600" />
                  <circle cx="130" cy="35" r="4" fill="currentColor" className="text-emerald-600" />
                  {/* Laptop Base */}
                  <path d="M10 100 L190 100 L180 110 L20 110 Z" fill="currentColor" className="text-emerald-600" opacity="0.3" />
                </svg>
              </div>

              {/* Image 2: Documents Stack */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Stack of Papers */}
                  <rect x="50" y="35" width="100" height="70" rx="3" fill="white" opacity="0.9" />
                  <rect x="45" y="30" width="100" height="70" rx="3" fill="currentColor" className="text-cyan-600" opacity="0.2" />
                  <rect x="40" y="25" width="100" height="70" rx="3" fill="currentColor" className="text-cyan-600" opacity="0.3" />
                  {/* Text Lines */}
                  <line x1="60" y1="45" x2="130" y2="45" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="55" x2="125" y2="55" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="65" x2="120" y2="65" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="75" x2="130" y2="75" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  {/* Checkmark */}
                  <polyline points="100,85 110,95 130,75" stroke="currentColor" strokeWidth="3" fill="none" className="text-emerald-600" />
                </svg>
              </div>

              {/* Image 3: Calculator */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Calculator Body */}
                  <rect x="60" y="10" width="80" height="100" rx="5" fill="currentColor" className="text-blue-600" opacity="0.3" />
                  {/* Display */}
                  <rect x="67" y="17" width="66" height="20" rx="2" fill="white" opacity="0.9" />
                  <text x="125" y="32" textAnchor="end" fontSize="12" fill="currentColor" className="text-blue-600" fontFamily="monospace">123.45</text>
                  {/* Buttons */}
                  {[0, 1, 2].map(row =>
                    [0, 1, 2].map(col => (
                      <rect key={`${row}-${col}`} x={70 + col * 20} y={45 + row * 18} width="15" height="14" rx="2" fill="white" opacity="0.8" />
                    ))
                  )}
                  {/* Equals Button */}
                  <rect x="70" y="99" width="60" height="14" rx="2" fill="currentColor" className="text-emerald-600" opacity="0.6" />
                </svg>
              </div>

              {/* Image 4: Coins & Money */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Coins */}
                  <circle cx="70" cy="60" r="30" fill="currentColor" className="text-yellow-600" opacity="0.4" />
                  <circle cx="70" cy="60" r="25" fill="white" opacity="0.8" />
                  <text x="70" y="68" textAnchor="middle" fontSize="24" fontWeight="bold" fill="currentColor" className="text-yellow-600">$</text>

                  <circle cx="120" cy="70" r="25" fill="currentColor" className="text-yellow-600" opacity="0.4" />
                  <circle cx="120" cy="70" r="20" fill="white" opacity="0.8" />
                  <text x="120" y="76" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="text-yellow-600">$</text>

                  <circle cx="95" cy="40" r="20" fill="currentColor" className="text-yellow-600" opacity="0.4" />
                  <circle cx="95" cy="40" r="16" fill="white" opacity="0.8" />
                  <text x="95" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor" className="text-yellow-600">$</text>
                </svg>
              </div>

              {/* Image 5: Growth Chart */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-green-50 to-green-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Chart Background */}
                  <rect x="30" y="20" width="140" height="80" fill="white" opacity="0.9" rx="3" />
                  {/* Bars */}
                  <rect x="45" y="70" width="20" height="20" fill="currentColor" className="text-emerald-600" opacity="0.5" />
                  <rect x="75" y="55" width="20" height="35" fill="currentColor" className="text-emerald-600" opacity="0.6" />
                  <rect x="105" y="45" width="20" height="45" fill="currentColor" className="text-emerald-600" opacity="0.7" />
                  <rect x="135" y="30" width="20" height="60" fill="currentColor" className="text-emerald-600" opacity="0.8" />
                  {/* Arrow */}
                  <polyline points="40,75 160,35" stroke="currentColor" strokeWidth="2" fill="none" className="text-emerald-600" strokeDasharray="3,3" />
                  <polygon points="160,35 155,40 165,40" fill="currentColor" className="text-emerald-600" />
                </svg>
              </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <rect x="20" y="10" width="160" height="90" rx="4" fill="currentColor" className="text-emerald-600" opacity="0.3" />
                  <rect x="30" y="20" width="140" height="70" fill="white" opacity="0.8" />
                  <polyline points="40,70 70,50 100,60 130,35 160,45" stroke="currentColor" strokeWidth="3" fill="none" className="text-emerald-600" />
                  <circle cx="70" cy="50" r="4" fill="currentColor" className="text-emerald-600" />
                  <circle cx="100" cy="60" r="4" fill="currentColor" className="text-emerald-600" />
                  <circle cx="130" cy="35" r="4" fill="currentColor" className="text-emerald-600" />
                  <path d="M10 100 L190 100 L180 110 L20 110 Z" fill="currentColor" className="text-emerald-600" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <rect x="50" y="35" width="100" height="70" rx="3" fill="white" opacity="0.9" />
                  <rect x="45" y="30" width="100" height="70" rx="3" fill="currentColor" className="text-cyan-600" opacity="0.2" />
                  <rect x="40" y="25" width="100" height="70" rx="3" fill="currentColor" className="text-cyan-600" opacity="0.3" />
                  <line x1="60" y1="45" x2="130" y2="45" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="55" x2="125" y2="55" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="65" x2="120" y2="65" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <line x1="60" y1="75" x2="130" y2="75" stroke="currentColor" strokeWidth="2" className="text-cyan-600" />
                  <polyline points="100,85 110,95 130,75" stroke="currentColor" strokeWidth="3" fill="none" className="text-emerald-600" />
                </svg>
              </div>
            </div>

            {/* Bottom Scrolling Row (Opposite Direction) */}
            <div className="absolute bottom-10 left-0 w-full h-32 flex gap-16 animate-scroll-right">
              {/* Image 1: Pie Chart Dashboard */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Pie Chart */}
                  <circle cx="70" cy="60" r="35" fill="white" opacity="0.9" />
                  <path d="M 70 25 A 35 35 0 0 1 95 80 L 70 60 Z" fill="currentColor" className="text-purple-600" opacity="0.6" />
                  <path d="M 70 60 L 95 80 A 35 35 0 0 1 45 80 Z" fill="currentColor" className="text-blue-600" opacity="0.6" />
                  <path d="M 70 60 L 45 80 A 35 35 0 0 1 70 25 Z" fill="currentColor" className="text-emerald-600" opacity="0.6" />
                  {/* Stats */}
                  <rect x="115" y="30" width="60" height="8" rx="2" fill="currentColor" className="text-purple-600" opacity="0.4" />
                  <rect x="115" y="45" width="45" height="8" rx="2" fill="currentColor" className="text-blue-600" opacity="0.4" />
                  <rect x="115" y="60" width="50" height="8" rx="2" fill="currentColor" className="text-emerald-600" opacity="0.4" />
                </svg>
              </div>

              {/* Image 2: Bank Building */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Building */}
                  <polygon points="100,20 40,50 160,50" fill="currentColor" className="text-gray-600" opacity="0.4" />
                  <rect x="50" y="50" width="100" height="55" fill="white" opacity="0.9" />
                  {/* Columns */}
                  <rect x="60" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="85" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="110" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="135" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  {/* Base */}
                  <rect x="40" y="100" width="120" height="8" fill="currentColor" className="text-gray-600" opacity="0.4" />
                  {/* Dollar Sign */}
                  <text x="100" y="78" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="text-emerald-600">$</text>
                </svg>
              </div>

              {/* Image 3: Invoice */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Paper */}
                  <rect x="50" y="15" width="100" height="90" rx="3" fill="white" opacity="0.9" />
                  {/* Header */}
                  <rect x="60" y="25" width="80" height="10" fill="currentColor" className="text-orange-600" opacity="0.4" />
                  {/* Lines */}
                  <line x1="60" y1="45" x2="140" y2="45" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
                  <line x1="60" y1="55" x2="130" y2="55" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
                  <line x1="60" y1="65" x2="135" y2="65" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
                  <line x1="60" y1="75" x2="125" y2="75" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
                  {/* Total */}
                  <rect x="100" y="85" width="40" height="12" fill="currentColor" className="text-emerald-600" opacity="0.5" />
                  <text x="120" y="94" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">$2,450</text>
                </svg>
              </div>

              {/* Image 4: Credit Cards */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Card 1 */}
                  <rect x="40" y="30" width="90" height="55" rx="5" fill="currentColor" className="text-indigo-600" opacity="0.5" />
                  <rect x="45" y="38" width="80" height="10" fill="currentColor" className="text-indigo-800" opacity="0.6" />
                  <rect x="50" y="55" width="30" height="6" rx="1" fill="white" opacity="0.9" />
                  {/* Card 2 */}
                  <rect x="70" y="45" width="90" height="55" rx="5" fill="currentColor" className="text-emerald-600" opacity="0.5" />
                  <rect x="75" y="53" width="80" height="10" fill="currentColor" className="text-emerald-800" opacity="0.6" />
                  <rect x="80" y="70" width="30" height="6" rx="1" fill="white" opacity="0.9" />
                  <circle cx="140" cy="85" r="8" fill="white" opacity="0.7" />
                  <circle cx="148" cy="85" r="8" fill="white" opacity="0.7" />
                </svg>
              </div>

              {/* Image 5: Handshake Deal */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  {/* Left Hand */}
                  <rect x="40" y="50" width="50" height="30" rx="5" fill="currentColor" className="text-teal-600" opacity="0.4" />
                  {/* Right Hand */}
                  <rect x="110" y="50" width="50" height="30" rx="5" fill="currentColor" className="text-blue-600" opacity="0.4" />
                  {/* Handshake */}
                  <ellipse cx="100" cy="65" rx="25" ry="15" fill="white" opacity="0.9" />
                  <ellipse cx="100" cy="65" rx="20" ry="12" fill="currentColor" className="text-emerald-600" opacity="0.3" />
                  {/* Sparkles */}
                  <circle cx="85" cy="40" r="3" fill="currentColor" className="text-yellow-500" opacity="0.7" />
                  <circle cx="115" cy="40" r="3" fill="currentColor" className="text-yellow-500" opacity="0.7" />
                  <circle cx="100" cy="30" r="4" fill="currentColor" className="text-yellow-500" opacity="0.7" />
                </svg>
              </div>

              {/* Duplicate for seamless loop */}
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <circle cx="70" cy="60" r="35" fill="white" opacity="0.9" />
                  <path d="M 70 25 A 35 35 0 0 1 95 80 L 70 60 Z" fill="currentColor" className="text-purple-600" opacity="0.6" />
                  <path d="M 70 60 L 95 80 A 35 35 0 0 1 45 80 Z" fill="currentColor" className="text-blue-600" opacity="0.6" />
                  <path d="M 70 60 L 45 80 A 35 35 0 0 1 70 25 Z" fill="currentColor" className="text-emerald-600" opacity="0.6" />
                  <rect x="115" y="30" width="60" height="8" rx="2" fill="currentColor" className="text-purple-600" opacity="0.4" />
                  <rect x="115" y="45" width="45" height="8" rx="2" fill="currentColor" className="text-blue-600" opacity="0.4" />
                  <rect x="115" y="60" width="50" height="8" rx="2" fill="currentColor" className="text-emerald-600" opacity="0.4" />
                </svg>
              </div>
              <div className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 opacity-20 shadow-lg p-4">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <polygon points="100,20 40,50 160,50" fill="currentColor" className="text-gray-600" opacity="0.4" />
                  <rect x="50" y="50" width="100" height="55" fill="white" opacity="0.9" />
                  <rect x="60" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="85" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="110" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="135" y="50" width="10" height="50" fill="currentColor" className="text-gray-600" opacity="0.3" />
                  <rect x="40" y="100" width="120" height="8" fill="currentColor" className="text-gray-600" opacity="0.4" />
                  <text x="100" y="78" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="text-emerald-600">$</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left Column */}
            <div className={`flex flex-col justify-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <div className="mb-3 sm:mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-emerald-600 animate-in fade-in slide-in-from-left duration-500">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 animate-in zoom-in duration-300" />
                <span className="font-medium tracking-wide">
                  {"Accounting for Small Business".split("").map((char, i) => {
                    const delayClass = `fade-in-delay-${((i % 10) + 1) * 10}`;
                    return (
                      <span
                        key={i}
                        className={`inline-block ${delayClass}`}
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    );
                  })}
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900 lg:text-6xl">
                {heroWords.map((word, i) => {
                  const isHighlighted = i >= 3 && i <= 5;
                  return (
                    <span key={i}>
                      <span
                        className={`inline-block transition-all duration-300 ${i <= wordIndex
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-4'
                          } ${isHighlighted ? 'relative text-emerald-600' : ''}`}
                        style={{
                          transitionDelay: `${i * 50}ms`,
                        }}
                      >
                        {isHighlighted && i === 3 && (
                          <span
                            className="absolute -bottom-2 left-0 h-3 w-full bg-emerald-200 -z-10 transition-all duration-300"
                            style={{
                              width: i <= wordIndex ? '100%' : '0%',
                              transitionDelay: `${(i + 1) * 50}ms`
                            }}
                          ></span>
                        )}
                        {word.split("").map((char, charIndex) => (
                          <span
                            key={charIndex}
                            className="inline-block hover:text-emerald-500 transition-colors duration-200 hover:scale-110"
                            style={{
                              animation: i <= wordIndex ? 'bounce-subtle 0.4s ease-out both' : 'none',
                              animationDelay: `${i * 50 + charIndex * 15}ms`
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                      {i < heroWords.length - 1 && " "}
                    </span>
                  );
                })}
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-gray-600 min-h-[100px] sm:min-h-[120px]">
                <span className="inline-block">
                  {displayedText}
                  <span className="inline-block w-0.5 h-5 bg-emerald-600 ml-1 animate-pulse align-middle"></span>
                </span>
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 animate-in fade-in slide-in-from-left duration-500">
                <Button asChild size="default" className="group bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-200 sm:text-base">
                  <Link to="/auth">
                    Start your ledger <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="transition-all hover:scale-105 hover:border-emerald-600 hover:text-emerald-600 sm:text-base">
                  <Link to="/auth">I already have an account</Link>
                </Button>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 group cursor-default">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className={`relative transition-all duration-1000 delay-300 hidden md:block ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-cyan-50 to-blue-100 opacity-60 blur-3xl animate-pulse-slow"></div>
              <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] animate-in fade-in zoom-in-95 duration-700 delay-400">
                <div className="mb-4 flex items-center justify-between border-b pb-4 animate-in fade-in duration-500 delay-500">
                  <div className="flex items-center gap-2">
                    <BookOpenText className="h-5 w-5 text-emerald-600 animate-in spin-in-0 duration-700 delay-600" />
                    <span className="font-semibold">Ledgerly</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Overview</span>
                </div>

                {/* Mock Dashboard Content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="group animate-in fade-in slide-in-from-bottom duration-500 delay-700">
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 transition-all group-hover:text-emerald-600">$24,980</p>
                      <p className="text-xs text-emerald-600 animate-pulse">↑ 18.1% vs last month</p>
                    </div>
                    <div className="group animate-in fade-in slide-in-from-bottom duration-500 delay-[800ms]">
                      <p className="text-xs text-gray-500">Income</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 transition-all group-hover:text-cyan-600">$68,540</p>
                      <p className="text-xs text-cyan-600 animate-pulse">↑ 12.3% vs last month</p>
                    </div>
                    <div className="group animate-in fade-in slide-in-from-bottom duration-500 delay-[900ms]">
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 transition-all group-hover:text-red-600">$43,560</p>
                      <p className="text-xs text-red-600 animate-pulse">↑ 7.6% vs last month</p>
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="h-48 rounded-lg bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 animate-in fade-in duration-500 delay-1000">
                    <div className="flex h-full items-end justify-between gap-2">
                      {chartHeights.map((height, i) => (
                        <div key={i} className="flex-1 group cursor-pointer">
                          <div
                            className="rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-700 ease-out hover:from-emerald-600 hover:to-emerald-500"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="space-y-2 animate-in fade-in duration-500 delay-[1100ms]">
                    <p className="text-sm font-semibold text-gray-700">Recent Transactions</p>
                    {[
                      { name: "Invoice from Acme Corp", amount: "+$1,250", color: "text-emerald-600" },
                      { name: "Office Supplies", amount: "-$129.99", color: "text-red-600" },
                      { name: "Payment to Jane Smith", amount: "-$850.00", color: "text-red-600" },
                    ].map((tx, i) => {
                      const animationClass = i === 0 ? 'slide-in-from-right-delay-1200' :
                        i === 1 ? 'slide-in-from-right-delay-1300' :
                          'slide-in-from-right-delay-1400';
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition-all duration-300 hover:scale-[1.02] hover:border-gray-200 hover:shadow-md cursor-pointer ${animationClass}`}
                        >
                          <span className="text-sm text-gray-700">{tx.name}</span>
                          <span className={`text-sm font-semibold ${tx.color}`}>{tx.amount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="border-y border-gray-200 bg-white py-8 animate-in fade-in duration-1000 delay-700">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Trusted by 10,000+ small businesses
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {TRUST_LOGOS.map((logo, i) => {
                const animationClass = i === 0 ? 'fade-in-zoom-delay-800' :
                  i === 1 ? 'fade-in-zoom-delay-900' :
                    i === 2 ? 'fade-in-zoom-delay-1000' :
                      i === 3 ? 'fade-in-zoom-delay-1100' :
                        i === 4 ? 'fade-in-zoom-delay-1200' :
                          'fade-in-zoom-delay-1200'; // fallback
                return (
                  <div
                    key={i}
                    className={`text-lg font-semibold text-gray-400 transition-all duration-300 hover:text-gray-600 hover:scale-110 cursor-pointer ${animationClass}`}
                  >
                    {logo}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => {
              const animationClass = index === 0 ? 'slide-in-from-bottom-delay-1000' :
                index === 1 ? 'slide-in-from-bottom-delay-1150' :
                  index === 2 ? 'slide-in-from-bottom-delay-1300' :
                    'slide-in-from-bottom-delay-1450';
              return (
                <article
                  key={feature.title}
                  className={`group ${animationClass} hover:scale-105 transition-all cursor-pointer`}
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all duration-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-200 group-hover:rotate-6">
                    <feature.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-gray-900 transition-colors group-hover:text-emerald-600">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{feature.body}</p>
                </article>
              );
            })}
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

      {/* AI Chat Widget */}
      {!isChatOpen ? (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl animate-bounce"
        >
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      ) : (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex h-[85vh] max-h-[600px] sm:h-[500px] w-auto sm:w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
          {/* Chat Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Ledgerly AI</h3>
                <p className="text-xs text-emerald-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="rounded-2xl bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce-delay-0"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce-delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce-delay-300"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-center text-gray-500">
              Powered by Ledgerly AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

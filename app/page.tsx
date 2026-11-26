'use client';

import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getSession, logout } from "@/lib/auth.functions";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/app.functions";
import "../src/profitbooks-landing.css";

export default function Landing() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: appSettings } = useQuery({
    queryKey: ["public_settings"],
    queryFn: () => getPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const appName = appSettings?.appName || "KoboBooks";
  const appLogo = appSettings?.appLogo || null;
  const brandInitial = appName.charAt(0).toUpperCase() || "K";

  useEffect(() => {
    getSession().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push("/");
  };

  // Run all ProfitBooks interactive animations (tabs, persona picker, feature cloud tour,
  // rotating paper report sheets, team time-back counter & rings, owner+CA live ledger collaboration,
  // pricing currency/billing toggles, live clock, and YouTube inline player).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];

    /* ---- 1. Feature showcase tabs ---- */
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".tab"));
    function selectTab(t: HTMLButtonElement, focus?: boolean) {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        const ctrlId = x.getAttribute("aria-controls");
        const p = ctrlId ? root?.querySelector<HTMLElement>(`#${ctrlId}`) : null;
        if (p) {
          p.hidden = !on;
          if (on) {
            p.classList.remove("in");
            void p.offsetWidth;
            p.classList.add("in");
          }
        }
      });
      if (focus) t.focus();
    }
    tabs.forEach((t, i) => {
      const onClick = () => selectTab(t);
      const onKey = (e: KeyboardEvent) => {
        let n: HTMLButtonElement | null = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) {
          e.preventDefault();
          selectTab(n, true);
        }
      };
      t.addEventListener("click", onClick);
      t.addEventListener("keydown", onKey);
      cleanupFns.push(() => {
        t.removeEventListener("click", onClick);
        t.removeEventListener("keydown", onKey);
      });
    });

    /* ---- 2. Feature cloud: staggered float + filters + auto-tour ---- */
    try {
      const chips = Array.from(root.querySelectorAll<HTMLElement>(".ft"));
      chips.forEach((c, i) => {
        c.style.setProperty("--d", 7 + ((i * 37) % 5) + "s");
        c.style.setProperty("--dl", -((i * 53) % 9) + "s");
      });
      const cloud = root.querySelector<HTMLElement>("#cloud");
      const cbtns = Array.from(root.querySelectorAll<HTMLButtonElement>(".cat-btn"));
      cbtns.forEach((b) => {
        b.dataset.n = String(chips.filter((c) => c.dataset.c === b.dataset.f).length);
      });
      function setCat(b: HTMLButtonElement | null, on: boolean) {
        const f = b ? b.dataset.f : null;
        cbtns.forEach((x) => x.setAttribute("aria-pressed", String(on && x === b)));
        cloud?.classList.toggle("filtered", !!on);
        chips.forEach((c) => c.classList.toggle("on", !!on && c.dataset.c === f));
      }
      const tap = root.querySelector<HTMLElement>("#demoTap");
      let tourOn = false,
        stopped = false,
        hover = false,
        timers: Array<ReturnType<typeof setTimeout>> = [],
        order: HTMLButtonElement[] = [],
        k = 0;
      const rmq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function later(fn: () => void, ms: number) {
        timers.push(setTimeout(fn, ms));
      }
      function clearT() {
        timers.forEach(clearTimeout);
        timers = [];
      }
      function shuffle(a: HTMLButtonElement[]) {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = a[i];
          a[i] = a[j];
          a[j] = t;
        }
        return a;
      }
      function moveTo(b: HTMLButtonElement) {
        if (!cloud || !tap) return;
        const cr = cloud.getBoundingClientRect();
        const r = b.getBoundingClientRect();
        tap.style.setProperty("--tx", r.left - cr.left + r.width * 0.62 + "px");
        tap.style.setProperty("--ty", r.top - cr.top + r.height * 0.55 + "px");
      }
      function step() {
        if (!tourOn || stopped || !tap) return;
        if (hover) {
          later(step, 800);
          return;
        }
        if (k >= order.length) {
          setCat(null, false);
          tap.classList.remove("show");
          order = shuffle(cbtns.slice());
          k = 0;
          later(step, 1800);
          return;
        }
        const b = order[k++];
        tap.classList.add("show");
        moveTo(b);
        later(() => {
          if (stopped || hover || !tap) return;
          tap.classList.add("press");
          setCat(b, true);
          later(() => tap.classList.remove("press"), 300);
          later(step, 2300);
        }, 800);
      }
      function startTour() {
        if (tourOn || stopped || rmq) return;
        tourOn = true;
        order = shuffle(cbtns.slice());
        k = 0;
        later(step, 600);
      }
      function pauseTour() {
        tourOn = false;
        clearT();
        tap?.classList.remove("show", "press");
      }
      function stopTour() {
        stopped = true;
        pauseTour();
      }
      cbtns.forEach((b) => {
        const onClick = (e: MouseEvent) => {
          if (e.isTrusted) stopTour();
          setCat(b, b.getAttribute("aria-pressed") !== "true");
        };
        b.addEventListener("click", onClick);
        cleanupFns.push(() => b.removeEventListener("click", onClick));
      });
      if (cloud) {
        const onEnter = () => {
          hover = true;
        };
        const onLeave = () => {
          hover = false;
        };
        cloud.addEventListener("mouseenter", onEnter);
        cloud.addEventListener("mouseleave", onLeave);
        cleanupFns.push(() => {
          cloud.removeEventListener("mouseenter", onEnter);
          cloud.removeEventListener("mouseleave", onLeave);
          clearT();
        });
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver(
            (es) => {
              es.forEach((e) => {
                if (e.isIntersecting) {
                  startTour();
                } else {
                  pauseTour();
                  if (!stopped) setCat(null, false);
                }
              });
            },
            { threshold: 0.35 }
          );
          io.observe(cloud);
          cleanupFns.push(() => io.disconnect());
        }
      }
    } catch (e) {}

    /* ---- 3. Persona picker ---- */
    const pcs = Array.from(root.querySelectorAll<HTMLButtonElement>(".ps-opt"));
    function pickPersona(t: HTMLButtonElement, focus?: boolean) {
      pcs.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        const ctrlId = x.getAttribute("aria-controls");
        const panel = ctrlId ? root?.querySelector<HTMLElement>(`#${ctrlId}`) : null;
        if (panel) panel.hidden = !on;
      });
      if (focus) t.focus();
    }
    pcs.forEach((t, i) => {
      const onClick = () => pickPersona(t);
      const onKey = (e: KeyboardEvent) => {
        let n: HTMLButtonElement | null = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = pcs[(i + 1) % pcs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = pcs[(i - 1 + pcs.length) % pcs.length];
        if (n) {
          e.preventDefault();
          pickPersona(n, true);
        }
      };
      t.addEventListener("click", onClick);
      t.addEventListener("keydown", onKey);
      cleanupFns.push(() => {
        t.removeEventListener("click", onClick);
        t.removeEventListener("keydown", onKey);
      });
    });

    /* ---- 4. Paper reports: cycle the front sheet ---- */
    try {
      const asof = root.querySelector<HTMLElement>("#asof");
      if (asof) {
        asof.textContent =
          "Updated live \u00b7 " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      }
      const sheets = Array.from(root.querySelectorAll<HTMLElement>("#sheets .sheet"));
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let paused = false;
      function cycle() {
        if (paused) return;
        sheets.forEach((sh) => {
          sh.dataset.pos = String((Number(sh.dataset.pos || 0) + 3) % 4);
        });
      }
      sheets.forEach((sh) => {
        const onClick = () => {
          const k = Number(sh.dataset.pos || 0);
          sheets.forEach((x) => {
            x.dataset.pos = String((Number(x.dataset.pos || 0) - k + 4) % 4);
          });
        };
        const onEnter = () => {
          paused = true;
        };
        const onLeave = () => {
          paused = false;
        };
        sh.addEventListener("click", onClick);
        sh.addEventListener("mouseenter", onEnter);
        sh.addEventListener("mouseleave", onLeave);
        cleanupFns.push(() => {
          sh.removeEventListener("click", onClick);
          sh.removeEventListener("mouseenter", onEnter);
          sh.removeEventListener("mouseleave", onLeave);
        });
      });
      if (!reduce && sheets.length) {
        const iv = setInterval(cycle, 3800);
        cleanupFns.push(() => clearInterval(iv));
      }
    } catch (e) {}

    /* ---- 5. Team time-back: play once when scrolled into view ---- */
    try {
      const tsec = root.querySelector<HTMLElement>("#results");
      const rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (tsec && "IntersectionObserver" in window && !rm) {
        const io = new IntersectionObserver(
          (es) => {
            es.forEach((e) => {
              if (!e.isIntersecting) return;
              io.disconnect();
              tsec.classList.add("tm-on");
              Array.from(tsec.querySelectorAll<HTMLElement>(".cnt")).forEach((c) => {
                const to = Number(c.dataset.to || 0);
                let t0: number | null = null;
                const dur = 1500;
                function step(t: number) {
                  if (!t0) t0 = t;
                  const k = Math.min(1, (t - t0) / dur);
                  c.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
                  if (k < 1) requestAnimationFrame(step);
                }
                c.textContent = "0";
                requestAnimationFrame(step);
              });
            });
          },
          { threshold: 0.35 }
        );
        io.observe(tsec);
        cleanupFns.push(() => io.disconnect());
      }
    } catch (e) {}

    /* ---- 6. Owner + accountant: live entries and access preview ---- */
    try {
      const st = root.querySelector<HTMLElement>("#duoStage");
      const notes: Record<string, string> = {
        you: "You have full control: create, edit, approve and manage who has access.",
        acct: "Your CA records, reconciles and posts journals. Can’t change users or settings.",
        aud: "Auditors see every number and report. They can’t change or delete anything.",
      };
      const vas = Array.from(root.querySelectorAll<HTMLButtonElement>(".va"));
      const vaNote = root.querySelector<HTMLElement>("#vaNote");
      vas.forEach((b) => {
        const onClick = () => {
          vas.forEach((x) => x.setAttribute("aria-checked", String(x === b)));
          const view = b.dataset.view || "you";
          if (st) st.dataset.view = view;
          if (vaNote) vaNote.textContent = notes[view];
        };
        b.addEventListener("click", onClick);
        cleanupFns.push(() => b.removeEventListener("click", onClick));
      });
      const rowsEl = root.querySelector<HTMLElement>("#lgRows");
      const bY = root.querySelector<HTMLElement>("#bubYou");
      const bC = root.querySelector<HTMLElement>("#bubCa");
      const nY = root.querySelector<HTMLElement>("#nodeYou");
      const nC = root.querySelector<HTMLElement>("#nodeCa");
      const bar = root.querySelector<HTMLElement>("#closeBar");
      const pct = root.querySelector<HTMLElement>("#closePct");
      let close = 80;
      const ev = [
        ["you", "Quote · Kavre Consulting", "+₹58,000", "pos", "Sent a quote to Kavre"],
        ["ca", "Bank rules · 6 matched", "45 / 45", "", "Finished bank reconciliation"],
        ["you", "Invoice · Asha Wellness", "+₹21,000", "pos", "Invoiced Asha Wellness"],
        ["ca", "Journal · Prepaid rent", "−₹15,000", "neg", "Posting month-end entries"],
        ["you", "Payment · Kavre · UPI", "Matched ✓", "", "Kavre paid via UPI"],
        ["ca", "GST summary · October", "Ready ✓", "", "October GST data ready"],
      ];
      let i = 0;
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function swap(el: HTMLElement | null, txt: string) {
        if (!el) return;
        el.classList.add("swap");
        setTimeout(() => {
          el.textContent = txt;
          el.classList.remove("swap");
        }, 250);
      }
      function tick() {
        if (!rowsEl) return;
        const e = ev[i++ % ev.length];
        const r = document.createElement("div");
        r.className = "lg-row new";
        r.dataset.who = e[0];
        r.innerHTML =
          '<span class="tag-a ' +
          e[0] +
          '">' +
          (e[0] === "you" ? "You" : "CA") +
          '</span><span class="lg-t"></span><span class="lg-v ' +
          e[3] +
          '"></span><span class="perm"></span>';
        r.children[1].textContent = e[1];
        r.children[2].textContent = e[2];
        rowsEl.insertBefore(r, rowsEl.firstChild);
        while (rowsEl.children.length > 4) {
          if (rowsEl.lastChild) rowsEl.removeChild(rowsEl.lastChild);
        }
        const n = e[0] === "you" ? nY : nC;
        swap(e[0] === "you" ? bY : bC, e[4]);
        if (n) {
          n.classList.remove("ping");
          void n.offsetWidth;
          n.classList.add("ping");
        }
        if (e[0] === "ca" && bar && pct) {
          close = close >= 100 ? 70 : close + 10;
          bar.style.width = close + "%";
          pct.textContent = close + "%";
        }
      }
      if (st && !reduce) {
        const iv = setInterval(tick, 2600);
        cleanupFns.push(() => clearInterval(iv));
      }
    } catch (e) {}

    /* ---- 7. Pricing: currency + billing toggles ---- */
    try {
      let cur = "inr";
      let bill = "y";
      const billSeg = root.querySelector<HTMLElement>("#billSeg");
      function paint() {
        Array.from(root?.querySelectorAll<HTMLElement>(".amt") || []).forEach((a) => {
          const key = cur === "inr" ? "inr" : bill === "y" ? "usdy" : "usdm";
          const raw = a.dataset[key] || "";
          const v = raw.split("|");
          if (a.children[0]) a.children[0].textContent = v[0] || "";
          if (a.children[1]) a.children[1].textContent = v[1] || "";
        });
        if (billSeg) billSeg.hidden = cur === "inr";
      }
      const sgs = Array.from(root.querySelectorAll<HTMLButtonElement>(".sg"));
      sgs.forEach((b) => {
        const onClick = () => {
          const grp = b.parentElement;
          if (grp) {
            Array.from(grp.children).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
          }
          if (b.dataset.cur) cur = b.dataset.cur;
          if (b.dataset.bill) bill = b.dataset.bill;
          paint();
        };
        b.addEventListener("click", onClick);
        cleanupFns.push(() => b.removeEventListener("click", onClick));
      });
    } catch (e) {}

    /* ---- 8. Live clock line ---- */
    try {
      const el = root.querySelector<HTMLElement>("#clockline");
      function tickClock() {
        if (!el) return;
        const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        el.innerHTML = "It’s <b>" + t + "</b>. Your books could be up to date before the day ends.";
      }
      tickClock();
      const iv = setInterval(tickClock, 30000);
      cleanupFns.push(() => clearInterval(iv));
    } catch (e) {}

    /* ---- 9. Video walkthrough inline YouTube player ---- */
    try {
      const hosts = Array.from(root.querySelectorAll<HTMLElement>(".player[data-youtube-id]"));
      function cmd(f: HTMLIFrameElement, fn: string) {
        try {
          f.contentWindow?.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*");
        } catch (e) {}
      }
      function mount(host: HTMLElement, id: string, label: string) {
        const layer = document.createElement("div");
        layer.className = "pbv";
        const f = document.createElement("iframe");
        f.className = "pbv-frame";
        f.title = label;
        f.setAttribute("tabindex", "-1");
        f.allow = "autoplay; encrypted-media; picture-in-picture";
        f.src =
          "https://www.youtube-nocookie.com/embed/" +
          id +
          "?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&enablejsapi=1&origin=" +
          encodeURIComponent(location.origin);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pbv-btn";
        b.setAttribute("aria-label", "Pause video");
        b.innerHTML = '<span class="pbv-ic" aria-hidden="true"></span>';
        layer.appendChild(f);
        layer.appendChild(b);
        host.appendChild(layer);
        host.classList.add("is-playing");
        let playing = true;
        function set(p: boolean) {
          playing = p;
          layer.classList.toggle("is-paused", !p);
          b.setAttribute("aria-label", p ? "Pause video" : "Play video");
        }
        function onMsg(e: MessageEvent) {
          if (e.source !== f.contentWindow) return;
          let d: any;
          try {
            d = JSON.parse(e.data);
          } catch (x) {
            return;
          }
          const st = !d
            ? undefined
            : d.event === "onStateChange"
            ? d.info
            : d.info && typeof d.info === "object"
            ? d.info.playerState
            : undefined;
          if (st === 1) set(true);
          else if (st === 2 || st === 5) set(false);
          else if (st === 0) stop();
        }
        function stop() {
          window.removeEventListener("message", onMsg);
          layer.remove();
          host.classList.remove("is-playing");
        }
        window.addEventListener("message", onMsg);
        f.addEventListener("load", () => {
          try {
            f.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
          } catch (e) {}
        });
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          cmd(f, playing ? "pauseVideo" : "playVideo");
          set(!playing);
        });
        b.focus();
      }
      hosts.forEach((host) => {
        const id = host.getAttribute("data-youtube-id") || "tExzdK9F9aI";
        const label = host.getAttribute("aria-label") || "Video walkthrough";
        const onClick = (e: MouseEvent) => {
          e.preventDefault();
          if (host.classList.contains("is-playing")) return;
          mount(host, id, label);
        };
        host.addEventListener("click", onClick);
        cleanupFns.push(() => host.removeEventListener("click", onClick));
      });
    } catch (e) {}

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  const primaryCtaHref = user ? "/dashboard" : "/auth?mode=signup";
  const signInHref = user ? "/dashboard" : "/auth?mode=signin";

  return (
    <div className="pb-landing" ref={rootRef}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* ============ NAVBAR ============ */}
      <nav aria-label="Primary">
        <div className="wrap nav-in">
          <Link className="logo" href="/" aria-label={`${appName} home`}>
            {appLogo ? (
              <img src={appLogo} width="193" height="39" alt={appName} />
            ) : (
              <>
                <span className="mark">{brandInitial}</span>
                <span>
                  {appName === "KoboBooks" ? (
                    <>
                      Kobo<span className="p2">Books</span>
                    </>
                  ) : (
                    appName
                  )}
                </span>
              </>
            )}
          </Link>

          <div className="nav-links">
            <div className="nav-dd">
              <button type="button" aria-haspopup="true">
                Features
              </button>
              <ul>
                <li>
                  <a href="#features">Invoicing &amp; Billing</a>
                </li>
                <li>
                  <a href="#for-you">Inventory Management</a>
                </li>
                <li>
                  <a href="#sales">Accounts Receivables &amp; Payables</a>
                </li>
                <li>
                  <a href="#features">Business Accounting</a>
                </li>
                <li>
                  <a href="#features">Expense Tracking</a>
                </li>
                <li>
                  <a href="#features">Bank Reconciliation</a>
                </li>
                <li>
                  <a href="#for-you">Project Profitability</a>
                </li>
                <li>
                  <a href="#features">Accounting &amp; Taxes</a>
                </li>
                <li>
                  <a href="#reports">Financial Reporting</a>
                </li>
                <li>
                  <a href="#all-features">All features →</a>
                </li>
              </ul>
            </div>

            <div className="nav-dd">
              <button type="button" aria-haspopup="true">
                Solutions For
              </button>
              <ul>
                <li>
                  <a href="#for-you">Service Providers</a>
                </li>
                <li>
                  <a href="#for-you">Traders &amp; Wholesalers</a>
                </li>
                <li>
                  <a href="#how">Accountants &amp; Bookkeeping Firms</a>
                </li>
                <li>
                  <a href="#for-you">Solopreneurs</a>
                </li>
                <li>
                  <a href="#for-you">Startups</a>
                </li>
                <li>
                  <a href="#for-you">Choose your industry →</a>
                </li>
              </ul>
            </div>

            <div className="nav-dd">
              <button type="button" aria-haspopup="true">
                Resources
              </button>
              <ul>
                <li>
                  <a href="#demo">{appName} Demo</a>
                </li>
                <li>
                  <a href="#support">Guides &amp; Tutorials</a>
                </li>
                <li>
                  <a href="#ai">Compare {appName}</a>
                </li>
                <li>
                  <a href="#demo">Training Videos</a>
                </li>
                <li>
                  <a href="#support">Support</a>
                </li>
              </ul>
            </div>

            <a href="#pricing">Pricing</a>
          </div>

          <div className="nav-cta">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="login"
                  style={{ background: "none", border: 0, cursor: "pointer" }}
                >
                  Sign out
                </button>
                <Link className="btn btn-green" href="/dashboard">
                  Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link className="login" href={signInHref}>
                  Login
                </Link>
                <Link className="btn btn-green" href={primaryCtaHref}>
                  Try it Free
                </Link>
              </>
            )}
          </div>

          <details className="nav-m">
            <summary aria-label="Menu">
              <span></span>
            </summary>
            <div className="nav-m-panel">
              <span className="nav-m-h">Features</span>
              <a href="#features">Invoicing &amp; Billing</a>
              <a href="#for-you">Inventory Management</a>
              <a href="#sales">Accounts Receivables &amp; Payables</a>
              <a href="#features">Business Accounting</a>
              <a href="#features">Expense Tracking</a>
              <a href="#features">Bank Reconciliation</a>
              <a href="#reports">Financial Reporting</a>
              <a href="#all-features">All features →</a>
              <span className="nav-m-h">Solutions for</span>
              <a href="#for-you">Service Providers</a>
              <a href="#for-you">Traders &amp; Wholesalers</a>
              <a href="#how">Accountants &amp; Bookkeeping Firms</a>
              <a href="#for-you">Solopreneurs</a>
              <a href="#for-you">Startups</a>
              <span className="nav-m-h">Resources</span>
              <a href="#demo">Walkthrough Demo</a>
              <a href="#support">Support &amp; Guides</a>
              <a href="#pricing">Pricing</a>
              {user ? (
                <Link href="/dashboard">Dashboard</Link>
              ) : (
                <Link href={signInHref}>Login</Link>
              )}
            </div>
          </details>
        </div>
      </nav>

      <main id="main">
        {/* ============ HERO ============ */}
        <section className="hero" data-block="hero" aria-labelledby="hero-title">
          <div className="glow"></div>
          <div className="gridlines"></div>
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="badge">
                <span className="dotp"></span>New: automatic bank reconciliation in 15 minutes
              </span>
              <h1 id="hero-title">
                Accounting that runs itself. <span className="grad">You just send invoices.</span>
              </h1>
              <p className="lede" data-block="answer">
                {appName} is online accounting software for small businesses, built for agencies, consultants and
                service firms. Send tax-ready invoices in under a minute, track expenses and get paid faster, while
                every ledger entry, tax line and report is created automatically. No accounting degree needed.
              </p>
              <div className="hero-ctas">
                <Link className="btn btn-green" href={primaryCtaHref}>
                  {user ? "Go to Dashboard" : `Try ${appName} For Free`}
                </Link>
                <a className="btn btn-white" href="#demo">
                  ▶ Watch walkthrough
                </a>
              </div>
              <div className="hero-trust">
                <span>
                  <b className="stars">★★★★★</b> 4.5 on Capterra &amp; G2
                </span>
                <span>
                  <b>1,00,000+</b> businesses
                </span>
                <span>
                  <b>Free</b> forever plan
                </span>
              </div>
            </div>

            <div className="stage">
              <div
                className="dash"
                role="img"
                aria-label={`${appName} dashboard with revenue chart and recent invoices`}
              >
                <div className="win-top">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span>mykobobooks.com · Dashboard</span>
                </div>
                <div className="dash-body">
                  <div className="dash-main">
                    <div className="kpis">
                      <div className="kpi">
                        <small>Revenue · Oct</small>
                        <b>₹4,82,000</b>
                        <span className="up">▲ 12%</span>
                      </div>
                      <div className="kpi">
                        <small>Outstanding</small>
                        <b>₹1,10,900</b>
                      </div>
                      <div className="kpi">
                        <small>Tax payable</small>
                        <b>₹1,23,180</b>
                      </div>
                    </div>
                    <div>
                      <div className="spark" aria-hidden="true">
                        <i className="lo" style={{ height: "38%" }}></i>
                        <i className="lo" style={{ height: "52%" }}></i>
                        <i style={{ height: "46%" }}></i>
                        <i style={{ height: "64%" }}></i>
                        <i className="lo" style={{ height: "57%" }}></i>
                        <i style={{ height: "72%" }}></i>
                        <i style={{ height: "66%" }}></i>
                        <i style={{ height: "84%" }}></i>
                        <i style={{ height: "78%" }}></i>
                        <i style={{ height: "96%" }}></i>
                      </div>
                      <div className="spark-cap">
                        <span>Jan</span>
                        <span>Revenue by month</span>
                        <span>Oct</span>
                      </div>
                    </div>
                  </div>
                  <div className="dash-side">
                    <p className="dash-h">Recent invoices</p>
                    <div className="row">
                      <span className="nm">
                        Meridian Design Studio<small>INV-0248 · ₹1,56,940</small>
                      </span>
                      <span className="tag tag-ok">Paid</span>
                    </div>
                    <div className="row">
                      <span className="nm">
                        Kavre Consulting<small>INV-0246 · ₹58,000</small>
                      </span>
                      <span className="tag tag-ok">Paid</span>
                    </div>
                    <div className="row">
                      <span className="nm">
                        Northfield Tech<small>INV-0243 · ₹92,400</small>
                      </span>
                      <span className="tag tag-due">Reminder sent</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="float f1">
                <span className="ic">⚡</span>
                <span>
                  <b>GST applied automatically</b>
                  <small>18% · service, interstate</small>
                </span>
              </div>
              <div className="float f2">
                <span className="ic">🔔</span>
                <span>
                  <b>Reminder sent</b>
                  <small>INV-0243 · 7 days overdue</small>
                </span>
              </div>
              <div className="float f3">
                <span className="ic">🏦</span>
                <span>
                  <b>42 bank entries matched</b>
                  <small>3 need your review</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MARQUEE ============ */}
        <div className="marquee-sec" data-block="logos">
          <p>Trusted by 1,00,000+ businesses worldwide</p>
          <div className="marquee" aria-hidden="true">
            <span>Design studios</span>
            <span>CA firms</span>
            <span>IT services</span>
            <span>Marketing agencies</span>
            <span>Consultants</span>
            <span>Clinics</span>
            <span>Law practices</span>
            <span>Training institutes</span>
            <span>Design studios</span>
            <span>CA firms</span>
            <span>IT services</span>
            <span>Marketing agencies</span>
            <span>Consultants</span>
            <span>Clinics</span>
            <span>Law practices</span>
            <span>Training institutes</span>
          </div>
        </div>

        {/* ============ PERSONA PICKER ============ */}
        <section className="persona-sec" id="for-you" data-block="audience" aria-labelledby="for-you-title">
          <div className="wrap">
            <div className="ps-head center">
              <h2 id="for-you-title">
                Built around <span className="grad">your kind of business.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Pick what describes you best and see what {appName} does for you.
              </p>
            </div>
            <div className="ps-grid">
              <div className="ps-left">
                <div className="ps-list" role="tablist" aria-label="Choose your business type">
                  <button
                    className="ps-opt"
                    role="tab"
                    id="pt-svc"
                    aria-controls="pp-svc"
                    aria-selected="true"
                  >
                    <svg className="ill" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <path
                        d="M26 24v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"
                        fill="none"
                        stroke="#087a2f"
                        strokeWidth="3"
                      />
                      <rect className="i-a" x="13" y="24" width="34" height="22" rx="4" />
                      <rect className="i-b" x="13" y="31" width="34" height="3" />
                      <circle className="i-c" cx="46" cy="43" r="9" />
                      <path
                        d="M46 38.5v4.8l3 2"
                        stroke="#fff"
                        strokeWidth="2.2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="ps-t">
                      <b>Service provider</b>
                      <small>Agency, consultant</small>
                    </span>
                  </button>

                  <button
                    className="ps-opt"
                    role="tab"
                    id="pt-trd"
                    aria-controls="pp-trd"
                    aria-selected="false"
                    tabIndex={-1}
                  >
                    <svg className="ill" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <rect className="i-c" x="13" y="31" width="17" height="16" rx="2" />
                      <rect className="i-a" x="32" y="31" width="17" height="16" rx="2" />
                      <rect className="i-b" x="22.5" y="14" width="17" height="16" rx="2" />
                      <path d="M21.5 31v6M40.5 31v6M31 14v6" stroke="#fff" strokeWidth="2.2" />
                    </svg>
                    <span className="ps-t">
                      <b>Trader or retailer</b>
                      <small>Distributor, wholesaler</small>
                    </span>
                  </button>

                  <button
                    className="ps-opt"
                    role="tab"
                    id="pt-acc"
                    aria-controls="pp-acc"
                    aria-selected="false"
                    tabIndex={-1}
                  >
                    <svg className="ill" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <rect className="i-a" x="17" y="11" width="25" height="38" rx="4" />
                      <rect className="i-d" x="21" y="15" width="17" height="8" rx="1.5" />
                      <g className="i-k">
                        <rect x="21" y="27" width="4" height="4" rx="1" />
                        <rect x="27.5" y="27" width="4" height="4" rx="1" />
                        <rect x="34" y="27" width="4" height="4" rx="1" />
                        <rect x="21" y="34" width="4" height="4" rx="1" />
                        <rect x="27.5" y="34" width="4" height="4" rx="1" />
                        <rect x="34" y="34" width="4" height="11" rx="1" />
                        <rect x="21" y="41" width="10.5" height="4" rx="1" />
                      </g>
                      <circle className="i-c" cx="45" cy="44" r="9" />
                      <path
                        d="M41 44.3l3 3 5-5.6"
                        stroke="#fff"
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="ps-t">
                      <b>Accountant or CA</b>
                      <small>Practice, bookkeeper</small>
                    </span>
                  </button>

                  <button
                    className="ps-opt"
                    role="tab"
                    id="pt-solo"
                    aria-controls="pp-solo"
                    aria-selected="false"
                    tabIndex={-1}
                  >
                    <svg className="ill" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <circle className="i-c" cx="45" cy="19" r="6" />
                      <path className="i-c" d="M35 36c0-6.5 4.5-10.5 10-10.5S55 29.5 55 36z" />
                      <rect className="i-a" x="11" y="22" width="31" height="20" rx="3" />
                      <rect className="i-d" x="14" y="25" width="25" height="14" rx="1.5" />
                      <rect className="i-b" x="18" y="29" width="10" height="2.5" rx="1" />
                      <rect className="i-b" x="18" y="33" width="16" height="2.5" rx="1" opacity=".5" />
                      <rect className="i-a" x="7" y="42" width="39" height="4" rx="2" />
                    </svg>
                    <span className="ps-t">
                      <b>Solopreneur</b>
                      <small>Freelancer, creator</small>
                    </span>
                  </button>

                  <button
                    className="ps-opt"
                    role="tab"
                    id="pt-stp"
                    aria-controls="pp-stp"
                    aria-selected="false"
                    tabIndex={-1}
                  >
                    <svg className="ill" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <path className="i-c fl" d="M27 40h10l-5 13z" />
                      <path className="i-b" d="M23.5 30l-6.5 9h7.5zM40.5 30l6.5 9h-7.5z" />
                      <path
                        className="i-a"
                        d="M32 9c8.5 6.5 11.5 16 9.5 31h-19C20.5 25 23.5 15.5 32 9z"
                      />
                      <circle className="i-d" cx="32" cy="24" r="4.5" />
                      <circle className="i-b" cx="32" cy="24" r="2.2" />
                    </svg>
                    <span className="ps-t">
                      <b>Startup</b>
                      <small>Funded or bootstrapped</small>
                    </span>
                  </button>
                </div>
              </div>

              <div className="ps-right">
                {/* Service provider */}
                <div className="ps-panel" role="tabpanel" id="pp-svc" aria-labelledby="pt-svc">
                  <div className="ps-copy">
                    <h3>Bill for your time. Get paid without chasing.</h3>
                    <ul className="checks">
                      <li>Retainer and project invoices with SAC codes and the right GST</li>
                      <li>Payment links and automatic reminders for late payers</li>
                      <li>Profit by client and project, so you know which work pays</li>
                    </ul>
                    <Link className="btn btn-green" href={primaryCtaHref}>
                      Start free
                    </Link>
                    <a className="btn btn-white" href="#features">
                      For service providers →
                    </a>
                  </div>
                  <div
                    className="scr2"
                    role="img"
                    aria-label="Animated preview: an invoice being created and paid"
                  >
                    <div className="s-bar">
                      <i></i>
                      <i></i>
                      <i></i>
                      <span>Invoice · INV-0249</span>
                    </div>
                    <div className="s-body">
                      <div className="s-row a1">
                        <span>Brand identity system</span>
                        <b>₹65,000</b>
                      </div>
                      <div className="s-row a2">
                        <span>Monthly retainer · Nov</span>
                        <b>₹40,000</b>
                      </div>
                      <div className="s-row a3 mute">
                        <span>CGST + SGST 18% (auto)</span>
                        <b>₹18,900</b>
                      </div>
                      <div className="s-row tot a4">
                        <span>Total</span>
                        <b>₹1,23,900</b>
                      </div>
                      <div className="s-pay a5">
                        <span className="pl">UPI payment link added</span>
                        <span className="pl">Reminder on 15 Nov</span>
                      </div>
                      <span className="stamp2">PAID ✓</span>
                    </div>
                  </div>
                </div>

                {/* Trader */}
                <div className="ps-panel" role="tabpanel" id="pp-trd" aria-labelledby="pt-trd" hidden>
                  <div className="ps-copy">
                    <h3>Know what&apos;s in stock and what it&apos;s earning you.</h3>
                    <ul className="checks">
                      <li>Stock updates automatically with every sale and purchase</li>
                      <li>Purchase orders, sales orders and delivery notes</li>
                      <li>Multiple warehouses, stock transfers and inventory reports</li>
                    </ul>
                    <Link className="btn btn-green" href={primaryCtaHref}>
                      Start free
                    </Link>
                    <a className="btn btn-white" href="#features">
                      For traders →
                    </a>
                  </div>
                  <div
                    className="scr2"
                    role="img"
                    aria-label="Animated preview: inventory levels updating after a sale"
                  >
                    <div className="s-bar">
                      <i></i>
                      <i></i>
                      <i></i>
                      <span>Inventory · All warehouses</span>
                    </div>
                    <div className="s-body has-toast">
                      <div className="wh">
                        <span className="on">Pune</span>
                        <span>Mumbai</span>
                        <span>Nagpur</span>
                      </div>
                      <div className="inv a1">
                        <span>A4 copier paper (box)</span>
                        <span className="lvl">
                          <i className="sold" style={{ width: "82%" }}></i>
                        </span>
                        <b className="qty">
                          <span className="q1">248</span>
                          <span className="q2">236</span>
                        </b>
                      </div>
                      <div className="inv a2">
                        <span>Printer toner TN-2365</span>
                        <span className="lvl">
                          <i style={{ width: "24%", background: "#f0a46a" }}></i>
                        </span>
                        <b>36</b>
                      </div>
                      <div className="inv a3">
                        <span>Stapler HD-45</span>
                        <span className="lvl">
                          <i style={{ width: "55%" }}></i>
                        </span>
                        <b>120</b>
                      </div>
                      <div className="inv a4">
                        <span>Whiteboard markers (pk)</span>
                        <span className="lvl">
                          <i style={{ width: "12%", background: "#f0a46a" }}></i>
                        </span>
                        <b>18</b>
                      </div>
                      <span className="toast2">🧾 INV-0311 · 12 boxes sold · stock updated</span>
                    </div>
                  </div>
                </div>

                {/* Accountant */}
                <div className="ps-panel" role="tabpanel" id="pp-acc" aria-labelledby="pt-acc" hidden>
                  <div className="ps-copy">
                    <h3>All your clients&apos; books, one login.</h3>
                    <ul className="checks">
                      <li>Every {appName} client listed in one dashboard</li>
                      <li>Live reports and GST data. No emailed files.</li>
                      <li>Audit trail on every entry your clients make</li>
                    </ul>
                    <Link className="btn btn-green" href={primaryCtaHref}>
                      Start free
                    </Link>
                    <a className="btn btn-white" href="#how">
                      For accountants →
                    </a>
                  </div>
                  <div
                    className="scr2"
                    role="img"
                    aria-label="Animated preview: an accountant's list of client companies with their status"
                  >
                    <div className="s-bar">
                      <i></i>
                      <i></i>
                      <i></i>
                      <span>My clients · 12</span>
                    </div>
                    <div className="s-body cl">
                      <div className="cli a1">
                        <span className="ci">SK</span>
                        <span>Studio Kalaa</span>
                        <span className="st ok">GST data ready</span>
                      </div>
                      <div className="cli a2">
                        <span className="ci">MD</span>
                        <span>Meridian Design</span>
                        <span className="st wait">3 to reconcile</span>
                      </div>
                      <div className="cli a3">
                        <span className="ci">KC</span>
                        <span>Kavre Consulting</span>
                        <span className="st ok">Up to date</span>
                      </div>
                      <div className="cli a4">
                        <span className="ci">AW</span>
                        <span>Asha Wellness</span>
                        <span className="st wait">Return due 20 Nov</span>
                      </div>
                      <div className="cli a5">
                        <span className="ci">NT</span>
                        <span>Northfield Tech</span>
                        <span className="st ok">Up to date</span>
                      </div>
                      <span className="sweep"></span>
                    </div>
                  </div>
                </div>

                {/* Solopreneur */}
                <div className="ps-panel" role="tabpanel" id="pp-solo" aria-labelledby="pt-solo" hidden>
                  <div className="ps-copy">
                    <h3>Look like a company of ten. Pay nothing to start.</h3>
                    <ul className="checks">
                      <li>Professional, branded GST invoices from day one</li>
                      <li>Expenses tracked as you go, so tax time takes minutes</li>
                      <li>A free plan with no time limit, plus the mobile app</li>
                    </ul>
                    <Link className="btn btn-green" href={primaryCtaHref}>
                      Start free
                    </Link>
                    <a className="btn btn-white" href="#pricing">
                      For solopreneurs →
                    </a>
                  </div>
                  <div
                    className="scr2"
                    role="img"
                    aria-label="Animated preview: a solopreneur's monthly income summary"
                  >
                    <div className="s-bar">
                      <i></i>
                      <i></i>
                      <i></i>
                      <span>Dashboard · November</span>
                    </div>
                    <div className="s-body">
                      <div className="solo-k">
                        <span className="a1">
                          <small>Billed</small>
                          <b>₹1,85,000</b>
                        </span>
                        <span className="a2">
                          <small>Expenses</small>
                          <b>₹22,400</b>
                        </span>
                        <span className="a3 keep">
                          <small>You keep</small>
                          <b>₹1,62,600</b>
                        </span>
                      </div>
                      <div className="s-row a4">
                        <span>INV-007 · Acme Labs, USA</span>
                        <b>
                          $2,400 <em className="pd">Paid ✓</em>
                        </b>
                      </div>
                      <div className="s-row a5">
                        <span>Expense · Adobe subscription</span>
                        <b>₹4,230</b>
                      </div>
                      <div className="freeb a5">Free plan · no time limit</div>
                    </div>
                  </div>
                </div>

                {/* Startup */}
                <div className="ps-panel" role="tabpanel" id="pp-stp" aria-labelledby="pt-stp" hidden>
                  <div className="ps-copy">
                    <h3>Clean books your investors and auditors can trust.</h3>
                    <ul className="checks">
                      <li>Balance Sheet, P&amp;L and Cash Flow, always current</li>
                      <li>Roles for co-founders, your bookkeeper and your CA</li>
                      <li>Audit trail on every entry, from day one</li>
                    </ul>
                    <Link className="btn btn-green" href={primaryCtaHref}>
                      Start free
                    </Link>
                    <a className="btn btn-white" href="#reports">
                      For startups →
                    </a>
                  </div>
                  <div
                    className="scr2"
                    role="img"
                    aria-label="Animated preview: six months of cash in and out, and the team's access roles"
                  >
                    <div className="s-bar">
                      <i></i>
                      <i></i>
                      <i></i>
                      <span>Cash flow · last 6 months</span>
                    </div>
                    <div className="s-body">
                      <div className="cfb">
                        <div>
                          <i className="in" style={{ height: "40%" }}></i>
                          <i className="out" style={{ height: "55%" }}></i>
                          <span>Jun</span>
                        </div>
                        <div>
                          <i className="in" style={{ height: "48%" }}></i>
                          <i className="out" style={{ height: "58%" }}></i>
                          <span>Jul</span>
                        </div>
                        <div>
                          <i className="in" style={{ height: "60%" }}></i>
                          <i className="out" style={{ height: "60%" }}></i>
                          <span>Aug</span>
                        </div>
                        <div>
                          <i className="in" style={{ height: "72%" }}></i>
                          <i className="out" style={{ height: "62%" }}></i>
                          <span>Sep</span>
                        </div>
                        <div>
                          <i className="in" style={{ height: "85%" }}></i>
                          <i className="out" style={{ height: "64%" }}></i>
                          <span>Oct</span>
                        </div>
                        <div>
                          <i className="in" style={{ height: "96%" }}></i>
                          <i className="out" style={{ height: "66%" }}></i>
                          <span>Nov</span>
                        </div>
                      </div>
                      <div className="cfl">
                        <span style={{ ["--c" as any]: "var(--brand)" }}>Cash in</span>
                        <span style={{ ["--c" as any]: "#f0a46a" }}>Cash out</span>
                      </div>
                      <div className="team">
                        <span className="tm">
                          AR<small>Admin</small>
                        </span>
                        <span className="tm">
                          NK<small>Co-founder</small>
                        </span>
                        <span className="tm">
                          SB<small>Bookkeeper</small>
                        </span>
                        <span className="tm ca">
                          CA<small>View-only</small>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="ps-all">
              <a href="#all-features">Not listed? Explore all 50+ features →</a>
            </p>
          </div>
        </section>

        {/* ============ FEATURE SHOWCASE (tabs) ============ */}
        <section className="show-sec" id="features" data-block="benefits" aria-labelledby="features-title">
          <div className="wrap">
            <div className="center">
              <h2 id="features-title">
                The four jobs that eat your week, <span className="grad">handled.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Pick one and see exactly what it looks like inside {appName}.
              </p>
            </div>

            <div className="tabs" role="tablist" aria-label="Product features">
              <button className="tab" role="tab" id="tab-inv" aria-controls="p-inv" aria-selected="true">
                🧾 Invoicing
              </button>
              <button
                className="tab"
                role="tab"
                id="tab-exp"
                aria-controls="p-exp"
                aria-selected="false"
                tabIndex={-1}
              >
                💳 Expense management
              </button>
              <button
                className="tab"
                role="tab"
                id="tab-tax"
                aria-controls="p-tax"
                aria-selected="false"
                tabIndex={-1}
              >
                📋 Tax preparation
              </button>
              <button
                className="tab"
                role="tab"
                id="tab-bank"
                aria-controls="p-bank"
                aria-selected="false"
                tabIndex={-1}
              >
                🏦 Bank reconciliation
              </button>
            </div>

            {/* Invoicing */}
            <div className="panel" role="tabpanel" id="p-inv" aria-labelledby="tab-inv">
              <div>
                <h3>Invoices that look professional and get paid faster</h3>
                <p className="sub">
                  Choose a client and add your services. {appName} applies the right tax, adds a payment link, and
                  follows up when a client pays late.
                </p>
                <ul className="checks">
                  <li>Branded templates with your logo, colours and bank details</li>
                  <li>Estimates and quotations that convert to invoices in one click</li>
                  <li>CGST/SGST or IGST picked automatically from place of supply</li>
                  <li>UPI, card and bank-transfer payment links on every invoice</li>
                  <li>Automatic reminders before and after the due date</li>
                </ul>
                <Link className="link" href={primaryCtaHref}>
                  Explore invoicing →
                </Link>
              </div>
              <div className="shot" role="img" aria-label="Sample GST invoice from a design studio">
                <div className="win-top">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span>Invoice · INV-0248</span>
                </div>
                <div className="shot-body">
                  <div className="inv-top">
                    <div className="inv-brand">
                      <span className="sq">S</span>
                      <span>
                        <b>Studio Kalaa</b>
                        <small>GSTIN 27ABCDE1234F1Z5 · Pune</small>
                      </span>
                    </div>
                    <div className="inv-meta">
                      <b>INVOICE</b>
                      <small>INV-0248 · 26 Oct 2026</small>
                    </div>
                  </div>
                  <div className="billto">
                    <span>
                      Billed to<b>Meridian Design Pvt Ltd</b>Mumbai, Maharashtra
                    </span>
                    <span>
                      Due date<b>10 Nov 2026</b>Net 15
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>SAC</th>
                          <th className="r">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Brand identity system</td>
                          <td>998391</td>
                          <td className="r">₹65,000</td>
                        </tr>
                        <tr>
                          <td>Social media kit (20 posts)</td>
                          <td>998391</td>
                          <td className="r">₹28,000</td>
                        </tr>
                        <tr>
                          <td>Monthly retainer · October</td>
                          <td>998391</td>
                          <td className="r">₹40,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="tot">
                    <div>
                      <span>Subtotal</span>
                      <span>₹1,33,000</span>
                    </div>
                    <div>
                      <span>CGST 9%</span>
                      <span>₹11,970</span>
                    </div>
                    <div>
                      <span>SGST 9%</span>
                      <span>₹11,970</span>
                    </div>
                    <div className="g">
                      <span>Total</span>
                      <span>₹1,56,940</span>
                    </div>
                  </div>
                  <div className="inv-actions">
                    <span className="auto-note">⚡ Tax split by place of supply, applied automatically</span>
                    <span className="paybtn">Pay via UPI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="panel" role="tabpanel" id="p-exp" aria-labelledby="tab-exp" hidden>
              <div>
                <h3>Know where every rupee goes</h3>
                <p className="sub">
                  Record an expense in seconds and attach the bill. Every purchase is categorised, its tax credit is
                  tracked, and it shows up in your P&amp;L right away.
                </p>
                <ul className="checks">
                  <li>Record rent, software, travel and vendor bills in seconds</li>
                  <li>Attach receipts and bills to every entry</li>
                  <li>Input tax credit captured from GST-compliant purchase bills</li>
                  <li>Vendor balances, advances and payables in one view</li>
                  <li>Category breakdown of spend for any period</li>
                </ul>
                <Link className="link" href={primaryCtaHref}>
                  Explore expense management →
                </Link>
              </div>
              <div className="shot" role="img" aria-label="Expense list with category breakdown">
                <div className="win-top">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span>Expenses · October 2026</span>
                </div>
                <div className="shot-body">
                  <div className="splitbox">
                    <span>
                      <small>Total spend this month</small>
                      <br />
                      <b>₹1,86,450</b>
                    </span>
                    <span className="auto-note">ITC claimable ₹18,240</span>
                  </div>
                  <div className="catbar" aria-hidden="true">
                    <i style={{ width: "38%", background: "var(--brand-700)" }}></i>
                    <i style={{ width: "24%", background: "var(--brand)" }}></i>
                    <i style={{ width: "16%", background: "#6fd08f" }}></i>
                    <i style={{ width: "12%", background: "var(--brand-200)" }}></i>
                    <i style={{ width: "10%", background: "#d9eec2" }}></i>
                  </div>
                  <div className="legend">
                    <span style={{ ["--c" as any]: "var(--brand-700)" }}>Salaries 38%</span>
                    <span style={{ ["--c" as any]: "var(--brand)" }}>Office rent 24%</span>
                    <span style={{ ["--c" as any]: "#6fd08f" }}>Software 16%</span>
                    <span style={{ ["--c" as any]: "var(--brand-200)" }}>Travel 12%</span>
                    <span style={{ ["--c" as any]: "#d9eec2" }}>Other 10%</span>
                  </div>
                  <div>
                    <div className="exp">
                      <span className="ic">🏢</span>
                      <span className="nm">
                        Office rent · Baner<small>Kulkarni Properties · 01 Oct</small>
                      </span>
                      <span className="rc">Bill ✓</span>
                      <b>₹45,000</b>
                    </div>
                    <div className="exp">
                      <span className="ic">💻</span>
                      <span className="nm">
                        Figma &amp; Google Workspace<small>Software · 05 Oct</small>
                      </span>
                      <span className="rc">Bill ✓</span>
                      <b>₹12,380</b>
                    </div>
                    <div className="exp">
                      <span className="ic">✈️</span>
                      <span className="nm">
                        Client visit · Mumbai<small>Travel · 14 Oct</small>
                      </span>
                      <span className="rc">Receipt ✓</span>
                      <b>₹8,650</b>
                    </div>
                    <div className="exp">
                      <span className="ic">🖨️</span>
                      <span className="nm">
                        Printing for pitch deck<small>Vendor: Print Hub · 19 Oct</small>
                      </span>
                      <span className="rc">Bill ✓</span>
                      <b>₹3,420</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="panel" role="tabpanel" id="p-tax" aria-labelledby="tab-tax" hidden>
              <div>
                <h3>Tax prep is ready before the deadline</h3>
                <p className="sub">
                  Every invoice and bill is categorised by tax type and rate when you create it. At month-end your
                  return data is already organised, so you review it and file.
                </p>
                <ul className="checks">
                  <li>Tax codes pre-loaded for India, UAE, Australia and more</li>
                  <li>Outward supplies, input credit and net liability calculated live</li>
                  <li>Credit notes, debit notes and amendments tracked correctly</li>
                  <li>Purchase data reconciled before you file</li>
                  <li>Export filing-ready data or share with your CA</li>
                </ul>
                <Link className="link" href={primaryCtaHref}>
                  Explore tax compliance →
                </Link>
              </div>
              <div className="shot" role="img" aria-label="Monthly GST return summary marked ready to file">
                <div className="win-top">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span>GST return summary · October 2026</span>
                </div>
                <div className="shot-body">
                  <div className="taxgrid">
                    <div className="taxcell">
                      <small>Output tax</small>
                      <b>₹1,84,320</b>
                    </div>
                    <div className="taxcell">
                      <small>Input credit</small>
                      <b>₹61,140</b>
                    </div>
                    <div className="taxcell hl">
                      <small>Net payable</small>
                      <b>₹1,23,180</b>
                    </div>
                  </div>
                  <div className="prog">
                    <div className="st">
                      <span className="bx">✓</span>
                      <span>Sales invoices categorised</span>
                      <em>128 / 128</em>
                    </div>
                    <div className="st">
                      <span className="bx">✓</span>
                      <span>Credit &amp; debit notes included</span>
                      <em>4 notes</em>
                    </div>
                    <div className="st">
                      <span className="bx">✓</span>
                      <span>Purchase bills reconciled</span>
                      <em>63 / 63</em>
                    </div>
                    <div className="st">
                      <span className="bx">✓</span>
                      <span>B2B / B2C split by place of supply</span>
                      <em>Done</em>
                    </div>
                    <div className="st">
                      <span className="bx wait">→</span>
                      <span>Review and file</span>
                      <em>Due 20 Nov</em>
                    </div>
                  </div>
                  <div className="ready">
                    <span>✓ Return data ready</span>
                    <span className="paybtn">Export for filing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank */}
            <div className="panel" role="tabpanel" id="p-bank" aria-labelledby="tab-bank" hidden>
              <div>
                <h3>Your bank and your books, always in agreement</h3>
                <p className="sub">
                  Upload a statement from any bank. {appName} matches each line to an invoice, bill or expense and
                  flags only what needs your attention.
                </p>
                <ul className="checks">
                  <li>Import CSV or Excel statements from any bank</li>
                  <li>Receipts auto-matched to invoices, payments to bills</li>
                  <li>Unrecorded transactions flagged before they become problems</li>
                  <li>Record deposits, withdrawals and contra entries</li>
                  <li>Full audit trail for every matched transaction</li>
                </ul>
                <Link className="link" href={primaryCtaHref}>
                  Explore banking →
                </Link>
              </div>
              <div className="shot" role="img" aria-label="Bank reconciliation showing matched transactions">
                <div className="win-top">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span>Bank reconciliation · HDFC Current A/c</span>
                </div>
                <div className="shot-body">
                  <div className="bankhead">
                    <b>42 of 45 transactions matched</b>
                    <span className="auto-note">Took 14 minutes</span>
                  </div>
                  <div className="meterline">
                    <i></i>
                  </div>
                  <div className="match">
                    <span className="side">
                      <small>Bank · 18 Oct</small>UPI/MERIDIAN DESIGN · +₹1,56,940
                    </span>
                    <span className="lnk">✓</span>
                    <span className="side">
                      <small>{appName}</small>Payment for INV-0248
                    </span>
                  </div>
                  <div className="match">
                    <span className="side">
                      <small>Bank · 01 Oct</small>NEFT/KULKARNI PROP · −₹45,000
                    </span>
                    <span className="lnk">✓</span>
                    <span className="side">
                      <small>{appName}</small>Bill · Office rent
                    </span>
                  </div>
                  <div className="match">
                    <span className="side">
                      <small>Bank · 05 Oct</small>CARD/GOOGLE WORKSPACE · −₹12,380
                    </span>
                    <span className="lnk">✓</span>
                    <span className="side">
                      <small>{appName}</small>Expense · Software
                    </span>
                  </div>
                  <div className="match">
                    <span className="side">
                      <small>Bank · 22 Oct</small>ATM WDL PUNE · −₹5,000
                    </span>
                    <span className="lnk q">?</span>
                    <span className="side">
                      <small>Needs review</small>Record as petty cash?
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SALES WORKFLOW ============ */}
        <section className="sales-sec" id="sales" data-block="how-it-works" aria-labelledby="sales-title">
          <div className="wrap">
            <div className="center">
              <h2 id="sales-title">
                From quote to cash, <span className="grad">without the chasing.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Send the quote. {appName} carries it all the way to money in the bank.
              </p>
            </div>

            <div
              className="flow"
              role="img"
              aria-label="Sales workflow: quote sent, accepted, invoiced, reminder sent, paid"
            >
              <div className="flow-line">
                <i></i>
              </div>
              <div className="fn n1">
                <span className="fi">📝</span>
                <b>Quote sent</b>
                <small>QT-0042 · ₹1,23,900</small>
              </div>
              <div className="fn n2">
                <span className="fi">🤝</span>
                <b>Accepted</b>
                <small>Client says yes</small>
              </div>
              <div className="fn n3">
                <span className="fi">🧾</span>
                <b>Invoiced</b>
                <small>INV-0249 in one click</small>
              </div>
              <div className="fn n4">
                <span className="fi">🔔</span>
                <b>Reminder sent</b>
                <small>Automatically, on schedule</small>
              </div>
              <div className="fn n5">
                <span className="fi">💸</span>
                <b>Paid</b>
                <small>UPI · matched to invoice</small>
              </div>
            </div>

            <div className="sgrid">
              <div className="sc">
                <div className="sc-h">
                  <b>Quotes &amp; estimates</b>
                  <small>Win the work, then bill it without retyping.</small>
                </div>
                <div className="sm quote">
                  <span>QT-0042 · ₹1,23,900</span>
                  <span className="conv">Convert to invoice →</span>
                </div>
              </div>
              <div className="sc">
                <div className="sc-h">
                  <b>Professional GST invoices</b>
                  <small>Your logo, SAC codes and the right tax, every time.</small>
                </div>
                <div className="sm doc">
                  <span className="dl w1"></span>
                  <span className="dl w2"></span>
                  <span className="dr">
                    <em>CGST 9%</em>
                    <em>SGST 9%</em>
                    <b>₹1,23,900</b>
                  </span>
                </div>
              </div>
              <div className="sc">
                <div className="sc-h">
                  <b>Payment links</b>
                  <small>Clients pay straight from the invoice.</small>
                </div>
                <div className="sm pays">
                  <span>UPI</span>
                  <span>Cards</span>
                  <span>Net banking</span>
                </div>
              </div>
              <div className="sc">
                <div className="sc-h">
                  <b>Automated reminders</b>
                  <small>Polite follow-ups go out so you don&apos;t have to.</small>
                </div>
                <div className="sm rem">
                  <span className="rd">−3 days</span>
                  <span className="rd on">Due date</span>
                  <span className="rd">+7 days</span>
                </div>
              </div>
              <div className="sc">
                <div className="sc-h">
                  <b>Customer portal</b>
                  <small>Clients view, download and pay their invoices anytime.</small>
                </div>
                <div className="sm portal">
                  <span className="pb">Meridian · your invoices</span>
                  <span className="pr">
                    <span>INV-0249</span>
                    <span className="pp">Pay now</span>
                  </span>
                  <span className="pr">
                    <span>INV-0231</span>
                    <span className="pd2">Paid</span>
                  </span>
                </div>
              </div>
              <div className="sc">
                <div className="sc-h">
                  <b>Receivables at a glance</b>
                  <small>See who owes what, and send statements in one click.</small>
                </div>
                <div className="sm aging">
                  <span>
                    <i style={{ width: "100%" }}></i>
                    <em>₹2.14L</em>
                  </span>
                  <span>
                    <i className="o" style={{ width: "43%" }}></i>
                    <em>₹92K</em>
                  </span>
                  <span>
                    <i className="o2" style={{ width: "9%" }}></i>
                    <em>₹18K</em>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ OWNER + ACCOUNTANT ============ */}
        <section className="auto-sec duo-sec" id="how" data-block="collaboration" aria-labelledby="how-title">
          <div className="gridlines"></div>
          <div className="wrap duo-grid">
            <div className="duo-copy">
              <h2 id="how-title">
                You close deals. <span className="grad">Your CA closes the books.</span>
              </h2>
              <p className="sub">
                Same books, same moment, two different jobs. You stay in front of clients while your accountant works
                quietly in the background, seeing only what you allow.
              </p>
              <ul className="duo-pts">
                <li>
                  <span className="pi">⚡</span>
                  <span>
                    <b>Work at the same time</b>No waiting for files, backups or &quot;send me last month&apos;s
                    data&quot;.
                  </span>
                </li>
                <li>
                  <span className="pi">🔐</span>
                  <span>
                    <b>Access you control</b>Full control for you, entry access for your accountant, view-only for
                    auditors.
                  </span>
                </li>
                <li>
                  <span className="pi">🧾</span>
                  <span>
                    <b>Every change signed</b>The audit trail shows who did what, and when.
                  </span>
                </li>
              </ul>
              <div className="viewas">
                <span className="va-l">Preview access as</span>
                <div className="va-seg" role="radiogroup" aria-label="Preview access as">
                  <button className="va" role="radio" aria-checked="true" data-view="you">
                    You
                  </button>
                  <button className="va" role="radio" aria-checked="false" data-view="acct">
                    Your CA
                  </button>
                  <button className="va" role="radio" aria-checked="false" data-view="aud">
                    Auditor
                  </button>
                </div>
              </div>
              <Link className="btn btn-green" href={primaryCtaHref}>
                Invite your accountant, free
              </Link>
            </div>

            <div
              className="duo-stage"
              id="duoStage"
              data-view="you"
              role="img"
              aria-label="You and your accountant adding entries to the same live books at the same time, with access limited by role"
            >
              <svg className="duo-links" viewBox="0 0 500 460" preserveAspectRatio="none" aria-hidden="true">
                <path
                  className="lk you"
                  d="M70 92 C 70 170, 120 190, 168 205"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="lk ca"
                  d="M430 368 C 430 300, 380 285, 332 268"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="who-node owner" id="nodeYou">
                <span className="av">
                  🧑‍💼<i className="dot"></i>
                </span>
                <span className="bub">
                  <small>You · at a client meeting</small>
                  <b id="bubYou">Sent INV-0249 to Meridian</b>
                </span>
              </div>

              <div className="ledger">
                <div className="lg-top">
                  <span className="lg-logo">{brandInitial}</span>
                  <b>Live books</b>
                  <span className="sync">
                    <i></i>2 people editing
                  </span>
                </div>
                <div className="lg-rows" id="lgRows">
                  <div className="lg-row" data-who="you">
                    <span className="tag-a you">You</span>
                    <span className="lg-t">Invoice · Meridian Design</span>
                    <span className="lg-v pos">+₹1,23,900</span>
                    <span className="perm"></span>
                  </div>
                  <div className="lg-row" data-who="ca">
                    <span className="tag-a ca">CA</span>
                    <span className="lg-t">Bank reconciliation · Oct</span>
                    <span className="lg-v">42 / 45</span>
                    <span className="perm"></span>
                  </div>
                  <div className="lg-row" data-who="you">
                    <span className="tag-a you">You</span>
                    <span className="lg-t">Payment received · UPI</span>
                    <span className="lg-v">Matched ✓</span>
                    <span className="perm"></span>
                  </div>
                  <div className="lg-row" data-who="ca">
                    <span className="tag-a ca">CA</span>
                    <span className="lg-t">Journal · Depreciation</span>
                    <span className="lg-v neg">−₹8,200</span>
                    <span className="perm"></span>
                  </div>
                </div>
                <div className="lg-row sys">
                  <span className="tag-a sy">⚙</span>
                  <span className="lg-t">Users &amp; settings</span>
                  <span className="lg-v"></span>
                  <span className="perm"></span>
                </div>
                <div className="lg-foot">
                  <span>October close</span>
                  <span className="lg-prog">
                    <i id="closeBar" style={{ width: "80%" }}></i>
                  </span>
                  <b id="closePct">80%</b>
                </div>
                <div className="va-note" id="vaNote">
                  You have full control: create, edit, approve and manage who has access.
                </div>
                <span className="pcur c-you" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M1 1l5 14 2-6 6-2z" />
                  </svg>
                  <em>You</em>
                </span>
                <span className="pcur c-ca" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M1 1l5 14 2-6 6-2z" />
                  </svg>
                  <em>Priya · CA</em>
                </span>
              </div>

              <div className="who-node acct" id="nodeCa">
                <span className="bub">
                  <small>Priya, your CA · from her office</small>
                  <b id="bubCa">Reconciling October&apos;s bank</b>
                </span>
                <span className="av">
                  🧮<i className="dot"></i>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ REPORTS ============ */}
        <section className="rep-sec" id="reports" data-block="reports" aria-labelledby="reports-title">
          <div className="wrap rep-grid">
            <div className="rep-copy">
              <h2 id="reports-title">
                Every number you need. <span className="grad">One click away.</span>
              </h2>
              <p className="sub">
                45+ reports update the moment you record a transaction. No waiting for month-end and no asking your
                accountant how the business is doing.
              </p>
              <ul className="checks">
                <li>Balance Sheet, Profit &amp; Loss and Cash Flow, always current</li>
                <li>Sales by client, item and month to see what&apos;s working</li>
                <li>Tax summaries, aging and ledgers ready for your CA</li>
              </ul>
              <Link className="link" href={primaryCtaHref}>
                See all 45+ reports →
              </Link>
            </div>

            <div
              className="desk"
              role="img"
              aria-label="Sample printed reports: Balance Sheet, Profit and Loss, Sales by client and Cash Flow, all up to date"
            >
              <div className="sheets" id="sheets">
                <div className="sheet" data-pos="0">
                  <div className="sheet-h">
                    <small>Studio Kalaa Pvt Ltd</small>
                    <p className="sheet-t">Balance Sheet</p>
                    <span>As of 31 Oct 2026</span>
                  </div>
                  <div className="ln hd">
                    <span>Assets</span>
                  </div>
                  <div className="ln">
                    <span>Bank</span>
                    <b>6,40,000</b>
                  </div>
                  <div className="ln">
                    <span>Receivables</span>
                    <b>1,10,900</b>
                  </div>
                  <div className="ln">
                    <span>Fixed assets</span>
                    <b>2,85,000</b>
                  </div>
                  <div className="ln">
                    <span>Other assets</span>
                    <b>64,100</b>
                  </div>
                  <div className="ln tt">
                    <span>Total assets</span>
                    <b>11,00,000</b>
                  </div>
                  <div className="ln hd">
                    <span>Liabilities &amp; equity</span>
                  </div>
                  <div className="ln">
                    <span>Payables</span>
                    <b>1,42,000</b>
                  </div>
                  <div className="ln">
                    <span>GST payable</span>
                    <b>1,23,180</b>
                  </div>
                  <div className="ln">
                    <span>Loan</span>
                    <b>2,00,000</b>
                  </div>
                  <div className="ln">
                    <span>Equity</span>
                    <b>6,34,820</b>
                  </div>
                  <div className="ln tt">
                    <span>Total</span>
                    <b>11,00,000</b>
                  </div>
                  <span className="seal">✓ Balanced</span>
                </div>

                <div className="sheet" data-pos="1">
                  <div className="sheet-h">
                    <small>Studio Kalaa Pvt Ltd</small>
                    <p className="sheet-t">Profit &amp; Loss</p>
                    <span>1–31 Oct 2026</span>
                  </div>
                  <div className="ln">
                    <span>Revenue</span>
                    <b>4,82,000</b>
                  </div>
                  <div className="ln hd">
                    <span>Less: expenses</span>
                  </div>
                  <div className="ln in">
                    <span>Salaries</span>
                    <b>70,850</b>
                  </div>
                  <div className="ln in">
                    <span>Office rent</span>
                    <b>45,000</b>
                  </div>
                  <div className="ln in">
                    <span>Software</span>
                    <b>29,830</b>
                  </div>
                  <div className="ln in">
                    <span>Travel</span>
                    <b>22,380</b>
                  </div>
                  <div className="ln in">
                    <span>Other</span>
                    <b>18,390</b>
                  </div>
                  <div className="ln sbt">
                    <span>Total expenses</span>
                    <b>(1,86,450)</b>
                  </div>
                  <div className="ln tt">
                    <span>Net profit</span>
                    <b>2,95,550</b>
                  </div>
                  <div className="margin">
                    <span>Net margin</span>
                    <span className="mg">
                      <i style={{ width: "61%" }}></i>
                    </span>
                    <b>61%</b>
                  </div>
                </div>

                <div className="sheet" data-pos="2">
                  <div className="sheet-h">
                    <small>Studio Kalaa Pvt Ltd</small>
                    <p className="sheet-t">Sales by Client</p>
                    <span>1–31 Oct 2026</span>
                  </div>
                  <div className="bars">
                    <div>
                      <span>12 other clients</span>
                      <i style={{ width: "100%" }}></i>
                      <b>1,92,000</b>
                    </div>
                    <div>
                      <span>Meridian Design</span>
                      <i style={{ width: "69%" }}></i>
                      <b>1,33,000</b>
                    </div>
                    <div>
                      <span>Northfield Tech</span>
                      <i style={{ width: "41%" }}></i>
                      <b>78,000</b>
                    </div>
                    <div>
                      <span>Kavre Consulting</span>
                      <i style={{ width: "30%" }}></i>
                      <b>58,000</b>
                    </div>
                    <div>
                      <span>Asha Wellness</span>
                      <i style={{ width: "11%" }}></i>
                      <b>21,000</b>
                    </div>
                  </div>
                  <div className="ln tt">
                    <span>Total sales</span>
                    <b>4,82,000</b>
                  </div>
                </div>

                <div className="sheet" data-pos="3">
                  <div className="sheet-h">
                    <small>Studio Kalaa Pvt Ltd</small>
                    <p className="sheet-t">Cash Flow</p>
                    <span>1–31 Oct 2026</span>
                  </div>
                  <div className="ln">
                    <span>Opening balance</span>
                    <b>4,20,000</b>
                  </div>
                  <div className="ln">
                    <span>Cash in</span>
                    <b>5,10,000</b>
                  </div>
                  <div className="ln">
                    <span>Cash out</span>
                    <b>(2,90,000)</b>
                  </div>
                  <div className="ln tt">
                    <span>Closing balance</span>
                    <b>6,40,000</b>
                  </div>
                  <svg className="spark2" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M0 46 L28 42 L56 44 L84 30 L112 34 L140 22 L168 18 L200 10 L200 60 L0 60Z"
                      fill="rgba(12,170,65,.12)"
                    />
                    <path
                      d="M0 46 L28 42 L56 44 L84 30 L112 34 L140 22 L168 18 L200 10"
                      fill="none"
                      stroke="#0caa41"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>
              <span className="dchip c-live">
                <i></i>
                <span id="asof">Updated live</span>
              </span>
              <span className="dchip c-exp">⬇ PDF · Excel</span>
              <span className="dchip c-more">+41 more reports</span>
            </div>
          </div>
        </section>

        {/* ============ VIDEO WALKTHROUGH ============ */}
        <section className="vid-sec" id="demo" data-block="video" aria-labelledby="demo-title">
          <div className="vid-glow"></div>
          <div className="gridlines"></div>
          <div className="wrap">
            <div className="center">
              <h2 id="demo-title">
                Watch a service business run on <span className="grad">{appName}</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                A complete tour, from your first branded invoice to tax reports. Grab a chai and watch it end to end.
              </p>
            </div>

            <div
              className="player"
              role="button"
              tabIndex={0}
              data-youtube-id="tExzdK9F9aI"
              aria-label={`Play the ${appName} walkthrough video, 28 minutes`}
              style={{ cursor: "pointer" }}
            >
              <span className="poster" aria-hidden="true">
                <span className="pg-grid"></span>
                <span className="pcard pc1">
                  <span className="pc-h">
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="pc-t">INVOICE</span>
                  <span className="pc-l w80"></span>
                  <span className="pc-l w60"></span>
                  <span className="pc-l w70"></span>
                  <span className="pc-total">₹1,56,940</span>
                </span>
                <span className="pcard pc2">
                  <span className="pc-h">
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span className="pc-bars">
                    <i style={{ height: "40%" }}></i>
                    <i style={{ height: "58%" }}></i>
                    <i style={{ height: "50%" }}></i>
                    <i style={{ height: "72%" }}></i>
                    <i style={{ height: "66%" }}></i>
                    <i style={{ height: "90%" }}></i>
                  </span>
                </span>
                <span className="pcard pc3">
                  <span className="pc-chip">✓ Tax ready</span>
                </span>
              </span>
              <span className="ptitle">
                <small>{appName}</small>Free invoicing software for service providers
              </span>
              <span className="play">
                <span className="tri"></span>
              </span>
              <span className="pbar">
                <span className="pb-play"></span>
                <span className="pb-time">0:00 / 27:59</span>
                <span className="pb-track">
                  <i></i>
                </span>
                <span className="pb-yt">Play video</span>
              </span>
            </div>

            <div style={{ textAlign: "center", marginTop: "34px", position: "relative" }}>
              <Link className="btn btn-green" href={primaryCtaHref}>
                Try {appName} For Free →
              </Link>
            </div>
          </div>
        </section>

        {/* ============ AI-FIRST + LEGACY ============ */}
        <section className="ai-sec" id="ai" data-block="differentiator" aria-labelledby="ai-title">
          <div className="gridlines"></div>
          <div className="wrap">
            <div className="center">
              <h2 id="ai-title">
                Built for the AI era. <span className="grad">Not the desktop era.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Legacy software was designed for a trained operator typing vouchers into one office PC. {appName} runs
                in the cloud and automates the routine work, and it gets smarter every release.
              </p>
            </div>

            <div className="ai-grid">
              <div className="ai-card">
                <div className="ai-top">
                  <span className="stamp">Ask your books</span>
                  <span className="live">Live</span>
                </div>
                <h3>Ask a question, get the answer</h3>
                <p>No report hunting. Ask in plain language and get the number with a next step.</p>
                <div className="chat">
                  <span className="q">How much does Northfield Tech owe us?</span>
                  <span className="a">
                    ₹92,400 on INV-0243, now 7 days overdue.<span className="act">Send reminder</span>
                  </span>
                </div>
              </div>
              <div className="ai-card">
                <div className="ai-top">
                  <span className="stamp">Bill scanning</span>
                  <span className="live">Live</span>
                </div>
                <h3>Snap a bill, skip the typing</h3>
                <p>Take a photo of a purchase bill and the vendor, GSTIN, amount and tax are filled in for you.</p>
                <div className="scan">
                  <span className="rcpt">
                    <i className="w90"></i>
                    <i className="w60"></i>
                    <i className="w75"></i>
                    <i className="w40"></i>
                    <span className="beam"></span>
                  </span>
                  <span className="fields">
                    <span>
                      <small>Vendor</small>Print Hub
                    </span>
                    <span>
                      <small>Amount</small>₹3,420
                    </span>
                    <span>
                      <small>GST</small>₹522 · 18%
                    </span>
                  </span>
                </div>
              </div>
              <div className="ai-card">
                <div className="ai-top">
                  <span className="stamp">Bank rules</span>
                  <span className="live">Live</span>
                </div>
                <h3>Rules that learn your bank</h3>
                <p>
                  Tell it once how to treat a recurring transaction, and it categorises every future one automatically.
                </p>
                <div className="rule">
                  <span className="rl">
                    <small>When narration contains</small>
                    <b>GOOGLE WORKSPACE</b>
                  </span>
                  <span className="rl">
                    <small>Categorise as</small>
                    <b>Software expense · 18% GST</b>
                  </span>
                  <span className="rl ok">✓ Applied to 18 transactions this year</span>
                </div>
              </div>
            </div>

            <div className="vs">
              <div className="vs-col vs-old">
                <span className="vs-tag">Legacy desktop software</span>
                <h3>Tally, QuickBooks Desktop and similar</h3>
                <ul>
                  <li>Installed on one office computer</li>
                  <li>Needs a trained operator to enter vouchers</li>
                  <li>Remote access needs add-ons or extra setup</li>
                  <li>Bank entries matched by hand</li>
                  <li>Backups are your job</li>
                  <li>Designed before AI existed</li>
                </ul>
              </div>
              <div className="vs-mid" aria-hidden="true">
                <span>→</span>
              </div>
              <div className="vs-col vs-new">
                <span className="vs-tag">{appName}</span>
                <h3>Cloud-native, automation-first</h3>
                <ul>
                  <li>Works in any browser and on your phone</li>
                  <li>Owners use it on day one, no training needed</li>
                  <li>Your CA logs in from anywhere, read-only</li>
                  <li>Bank rules match transactions automatically</li>
                  <li>Encrypted cloud backups, automatically</li>
                  <li>New features arrive with nothing to install</li>
                </ul>
              </div>
            </div>
            <div className="switch">
              <span>
                <b>Still on Tally or QuickBooks?</b> Start free and run both side by side for a month before you switch.
              </span>
              <Link className="btn btn-green" href={primaryCtaHref}>
                Start my side-by-side trial
              </Link>
            </div>
          </div>
        </section>

        {/* ============ MOBILE APP ============ */}
        <section className="mob-sec" id="mobile" data-block="mobile-app" aria-labelledby="mobile-title">
          <div className="wrap mob-grid">
            <div className="phones" aria-hidden="true">
              <div className="phone back">
                <div className="scr">
                  <div className="notch"></div>
                  <div className="ms-head">
                    <small>Good morning</small>
                    <b>Studio Kalaa</b>
                  </div>
                  <div className="ms-kpi">
                    <small>Receivables</small>
                    <b>₹1,10,900</b>
                  </div>
                  <div className="ms-bars">
                    <i style={{ height: "40%" }}></i>
                    <i style={{ height: "62%" }}></i>
                    <i style={{ height: "54%" }}></i>
                    <i style={{ height: "80%" }}></i>
                    <i style={{ height: "70%" }}></i>
                    <i style={{ height: "95%" }}></i>
                  </div>
                  <div className="ms-row">
                    <span>Meridian</span>
                    <span className="tag tag-ok">Paid</span>
                  </div>
                  <div className="ms-row">
                    <span>Northfield</span>
                    <span className="tag tag-due">Due</span>
                  </div>
                </div>
              </div>
              <div className="phone front">
                <div className="scr">
                  <div className="notch"></div>
                  <div className="ms-title">New invoice</div>
                  <div className="ms-field">
                    <small>Client</small>Meridian Design Pvt Ltd
                  </div>
                  <div className="ms-field">
                    <small>Item</small>Monthly retainer · Oct
                  </div>
                  <div className="ms-field two">
                    <span>
                      <small>Amount</small>₹40,000
                    </span>
                    <span>
                      <small>GST 18%</small>₹7,200
                    </span>
                  </div>
                  <div className="ms-total">
                    <span>Total</span>
                    <b>₹47,200</b>
                  </div>
                  <div className="ms-btn">Send invoice</div>
                </div>
                <div className="toast">💸 Payment received · ₹1,56,940</div>
              </div>
            </div>
            <div>
              <h2 id="mobile-title">
                Invoice at the client&apos;s office. <span className="grad">Get paid before you leave.</span>
              </h2>
              <p className="sub">
                The {appName} app for iOS and Android puts invoicing, expenses and your dashboard on your phone, always
                in sync with the web app.
              </p>
              <ul className="checks">
                <li>Create and send invoices and estimates from your phone</li>
                <li>Record expenses and payments as they happen</li>
                <li>Check your dashboard and outstanding dues anywhere</li>
              </ul>
              <div className="stores">
                <Link className="store" href={primaryCtaHref}>
                  <span className="si">📱</span>
                  <span>
                    <small>Download on the</small>App Store
                  </span>
                </Link>
                <Link className="store" href={primaryCtaHref}>
                  <span className="si">▶</span>
                  <span>
                    <small>Get it on</small>Google Play
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RESULTS: TIME BACK FOR THE TEAM ============ */}
        <section className="tm-sec" id="results" data-block="outcomes" aria-labelledby="results-title">
          <div className="wrap">
            <div className="center">
              <h2 id="results-title">
                Time back for <span className="grad">everyone on your team.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                The routine work shrinks for each role, so the people doing it can get back to the work that matters.
              </p>
            </div>

            <div className="tm-grid">
              <article className="tm-card" style={{ ["--pct" as any]: 75 }}>
                <div className="tm-top">
                  <div className="ring">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <circle className="rg-bg" cx="60" cy="60" r="50" />
                      <circle className="rg-fg" cx="60" cy="60" r="50" pathLength={100} />
                    </svg>
                    <span className="rg-c">
                      <b className="cnt" data-to="20">
                        20
                      </b>
                      <small>
                        hrs saved
                        <br />a month
                      </small>
                    </span>
                  </div>
                  <div className="tm-who">
                    <svg className="ill ill-s" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <path className="i-a" d="M12 33l38-17-10 34-9-11z" />
                      <path className="i-b" d="M31 39l19-23-25 21z" />
                      <path className="i-c" d="M31 39l1 10 5-6z" />
                    </svg>
                    <b>Your sales team</b>
                    <small>Quotes, invoices and follow-ups</small>
                  </div>
                </div>
                <div className="tk">
                  <label>
                    <span>Create and send an invoice</span>
                    <em>15 min → 1 min</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "7%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>Chase late payments</span>
                    <em>2 hrs/week → automatic</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "4%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>Send a client statement</span>
                    <em>20 min → 1 click</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "5%" }}></i>
                  </span>
                </div>
              </article>

              <article className="tm-card" style={{ ["--pct" as any]: 70 }}>
                <div className="tm-top">
                  <div className="ring">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <circle className="rg-bg" cx="60" cy="60" r="50" />
                      <circle className="rg-fg" cx="60" cy="60" r="50" pathLength={100} />
                    </svg>
                    <span className="rg-c">
                      <b className="cnt" data-to="12">
                        12
                      </b>
                      <small>
                        hrs saved
                        <br />a month
                      </small>
                    </span>
                  </div>
                  <div className="tm-who">
                    <svg className="ill ill-s" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <rect className="i-a" x="17" y="11" width="25" height="38" rx="4" />
                      <rect className="i-d" x="21" y="15" width="17" height="8" rx="1.5" />
                      <g className="i-k">
                        <rect x="21" y="27" width="4" height="4" rx="1" />
                        <rect x="27.5" y="27" width="4" height="4" rx="1" />
                        <rect x="34" y="27" width="4" height="4" rx="1" />
                        <rect x="21" y="34" width="4" height="4" rx="1" />
                        <rect x="27.5" y="34" width="4" height="4" rx="1" />
                        <rect x="34" y="34" width="4" height="11" rx="1" />
                        <rect x="21" y="41" width="10.5" height="4" rx="1" />
                      </g>
                      <circle className="i-c" cx="45" cy="44" r="9" />
                      <path
                        d="M41 44.3l3 3 5-5.6"
                        stroke="#fff"
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <b>Your accountant</b>
                    <small>Tax prep and reconciliation</small>
                  </div>
                </div>
                <div className="tk">
                  <label>
                    <span>Bank reconciliation</span>
                    <em>4.5 hrs → 15 min</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "6%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>GST return prep</span>
                    <em>4 hrs → 20 min</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "9%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>Month-end close</span>
                    <em>6 days → 3 days</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "50%" }}></i>
                  </span>
                </div>
              </article>

              <article className="tm-card" style={{ ["--pct" as any]: 80 }}>
                <div className="tm-top">
                  <div className="ring">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <circle className="rg-bg" cx="60" cy="60" r="50" />
                      <circle className="rg-fg" cx="60" cy="60" r="50" pathLength={100} />
                    </svg>
                    <span className="rg-c">
                      <b className="cnt" data-to="6">
                        6
                      </b>
                      <small>
                        hrs saved
                        <br />a month
                      </small>
                    </span>
                  </div>
                  <div className="tm-who">
                    <svg className="ill ill-s" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="i-bg" cx="32" cy="32" r="30" />
                      <rect className="i-b" x="16" y="34" width="7" height="13" rx="1.5" />
                      <rect className="i-b" x="26" y="27" width="7" height="20" rx="1.5" />
                      <rect className="i-a" x="36" y="20" width="7" height="27" rx="1.5" />
                      <path
                        d="M14 30l11-8 8 5 13-11"
                        stroke="#f0a46a"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path className="i-c" d="M41 13h8v8z" />
                    </svg>
                    <b>You, the owner</b>
                    <small>Quick, confident decisions</small>
                  </div>
                </div>
                <div className="tk">
                  <label>
                    <span>Check your cash position</span>
                    <em>wait a day → live</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "3%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>See who owes you</span>
                    <em>30 min of calls → a glance</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "4%" }}></i>
                  </span>
                </div>
                <div className="tk">
                  <label>
                    <span>Profit before a pricing call</span>
                    <em>next month → today</em>
                  </label>
                  <span className="tb">
                    <i style={{ ["--a" as any]: "3%" }}></i>
                  </span>
                </div>
              </article>
            </div>

            <div className="tm-total">
              <span className="tt-av">
                <i>S</i>
                <i>CA</i>
                <i>You</i>
              </span>
              <span className="tt-txt">
                Together, that&apos;s about{" "}
                <b>
                  <span className="cnt" data-to="38">
                    38
                  </span>{" "}
                  hours back every month.
                </b>{" "}
                Nearly a full work week.
              </span>
              <span className="tt-key">
                <i className="kb"></i>Before <i className="ka"></i>With {appName}
              </span>
            </div>
            <p className="res-note">
              Illustrative estimates for a 10-person service business. Your results depend on volume and setup.
            </p>
          </div>
        </section>

        {/* ============ FEATURE CLOUD ============ */}
        <section
          className="cloud-sec"
          id="all-features"
          data-block="feature-index"
          aria-labelledby="all-features-title"
        >
          <div className="halo"></div>
          <div className="rings"></div>
          <div className="wrap">
            <div className="center">
              <h2 id="all-features-title">
                One app. <span className="grad">50+ features.</span> Zero add-ons.
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Every one of these is included in {appName}. Tap a colour to see each area.
              </p>
            </div>

            <div className="cloud" id="cloud">
              <span className="demo-tap" id="demoTap" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 3l14 7-6.2 1.8L10 18z" />
                </svg>
                <i></i>
              </span>
              <span className="ft s" data-c="sales">
                Delivery notes
              </span>
              <span className="ft" data-c="tax">
                Place of supply
              </span>
              <span className="ft l" data-c="sales">
                Estimates &amp; quotes
              </span>
              <span className="ft s" data-c="spend">
                Vendor advances
              </span>
              <span className="ft" data-c="reports">
                Day book
              </span>
              <span className="ft l" data-c="bank">
                Bank statement import
              </span>
              <span className="ft s" data-c="stock">
                Stock transfer
              </span>
              <span className="ft" data-c="team">
                Audit trail
              </span>
              <span className="ft xl" data-c="sales">
                Invoicing
              </span>
              <span className="ft s" data-c="reports">
                Ledger
              </span>
              <span className="ft" data-c="sales">
                Sales orders
              </span>
              <span className="ft l" data-c="tax">
                Automatic GST
              </span>
              <span className="ft s" data-c="bank">
                Contra entries
              </span>
              <span className="ft" data-c="spend">
                Purchase orders
              </span>
              <span className="ft xl" data-c="spend">
                Expense tracking
              </span>
              <span className="ft s" data-c="team">
                Data backups
              </span>
              <span className="ft" data-c="sales">
                Payment reminders
              </span>
              <span className="ft l" data-c="reports">
                Profit &amp; Loss
              </span>
              <span className="ft s" data-c="sales">
                Customer portal
              </span>

              <div className="hub" role="group" aria-label="Explore features by area">
                <button className="cat-btn" data-f="sales" aria-pressed="false">
                  Sales &amp; invoicing
                </button>
                <button className="cat-btn" data-f="spend" aria-pressed="false">
                  Expenses
                </button>
                <button className="cat-btn" data-f="tax" aria-pressed="false">
                  Tax
                </button>
                <button className="cat-btn" data-f="bank" aria-pressed="false">
                  Banking
                </button>
                <div className="hub-in">
                  <span className="mark">{brandInitial}</span>
                  <b>{appName}</b>
                </div>
                <button className="cat-btn" data-f="reports" aria-pressed="false">
                  Reports
                </button>
                <button className="cat-btn" data-f="team" aria-pressed="false">
                  Team &amp; access
                </button>
                <button className="cat-btn" data-f="stock" aria-pressed="false">
                  Inventory
                </button>
              </div>

              <span className="ft" data-c="tax">
                Credit &amp; debit notes
              </span>
              <span className="ft s" data-c="spend">
                Vendor statements
              </span>
              <span className="ft l" data-c="bank">
                Auto reconciliation
              </span>
              <span className="ft" data-c="reports">
                Balance Sheet
              </span>
              <span className="ft s" data-c="stock">
                Multiple warehouses
              </span>
              <span className="ft xl" data-c="tax">
                Tax preparation
              </span>
              <span className="ft" data-c="sales">
                Multi-currency
              </span>
              <span className="ft s" data-c="reports">
                Aging reports
              </span>
              <span className="ft l" data-c="team">
                Accountant access
              </span>
              <span className="ft" data-c="spend">
                Purchase bills
              </span>
              <span className="ft s" data-c="sales">
                Invoice templates
              </span>
              <span className="ft" data-c="reports">
                Cash flow
              </span>
              <span className="ft s" data-c="tax">
                Tax codes
              </span>
              <span className="ft l" data-c="sales">
                Payment gateways
              </span>
              <span className="ft" data-c="team">
                Role-based access
              </span>
              <span className="ft s" data-c="bank">
                Deposits &amp; withdrawals
              </span>
              <span className="ft" data-c="stock">
                Production &amp; wastage
              </span>
              <span className="ft s" data-c="spend">
                Input tax credit
              </span>
              <span className="ft l" data-c="reports">
                45+ live reports
              </span>
              <span className="ft s" data-c="sales">
                Customer statements
              </span>
              <span className="ft" data-c="team">
                iOS &amp; Android apps
              </span>
              <span className="ft s" data-c="reports">
                Chart of accounts
              </span>
              <span className="ft" data-c="reports">
                Journal entries
              </span>
              <span className="ft s" data-c="sales">
                Advance receipts
              </span>
              <span className="ft" data-c="stock">
                Inventory tracking
              </span>
              <span className="ft s" data-c="team">
                Multi-user
              </span>
              <span className="ft" data-c="tax">
                Filing-ready exports
              </span>
              <span className="ft s" data-c="reports">
                Project-wise tracking
              </span>
              <span className="ft" data-c="reports">
                Sales reports
              </span>
              <span className="ft s" data-c="spend">
                Expense reports
              </span>
              <span className="ft l" data-c="team">
                Chat support in 3 languages
              </span>
            </div>
            <p className="cloud-foot">
              Missing something you need?{" "}
              <Link className="link" href={primaryCtaHref}>
                Tell us
              </Link>
              . Half of these started as customer requests.
            </p>
          </div>
        </section>

        {/* ============ SUPPORT ============ */}
        <section className="sup-sec" id="support" data-block="support" aria-labelledby="support-title">
          <div className="wrap sup2">
            <div className="sup-copy">
              <h2 id="support-title">
                Your success is <span className="grad">our success.</span>
              </h2>
              <p className="sub">
                We only win when you do. From the day you sign up, real people and practical resources are on your
                side.
              </p>
              <div className="promise">
                <span>
                  <b>Real people</b>
                  <small>not bots</small>
                </span>
                <span>
                  <b>3 languages</b>
                  <small>in-app chat</small>
                </span>
                <span>
                  <b>Mon–Fri</b>
                  <small>5 days a week</small>
                </span>
              </div>
              <nav className="res-list" aria-label="Help and resources">
                <a href="#faq">
                  <span className="ri2">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
                      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7.5h6M9 11h6" />
                    </svg>
                  </span>
                  <span>
                    <b>Support Center</b>
                    <small>Step-by-step guides for every feature</small>
                  </span>
                  <em>↗</em>
                </a>
                <a href="#demo">
                  <span className="ri2">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="4" />
                      <path className="fillc" d="M10 9.2v5.6l4.8-2.8z" />
                    </svg>
                  </span>
                  <span>
                    <b>Video tutorials</b>
                    <small>Demos you can follow along on YouTube</small>
                  </span>
                  <em>↗</em>
                </a>
                <a href="#demo">
                  <span className="ri2 hi">अ</span>
                  <span>
                    <b>हिंदी training videos</b>
                    <small>Learn {appName} in Hindi</small>
                  </span>
                  <em>↗</em>
                </a>
                <Link href={primaryCtaHref}>
                  <span className="ri2">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="13" height="12" rx="2.5" />
                      <path d="M16 9.5l5-3v9.5l-5-3" />
                    </svg>
                  </span>
                  <span>
                    <b>Live demos &amp; webinars</b>
                    <small>See the product with our team and ask anything</small>
                  </span>
                  <em>→</em>
                </Link>
              </nav>
            </div>

            <div className="hub2" aria-hidden="true">
              <div className="orb-ring r1"></div>
              <div className="orb-ring r2"></div>
              <div className="orbit o1">
                <span className="oc" style={{ ["--a" as any]: "0deg", ["--r" as any]: "var(--r1)" }}>
                  <span className="oc-in">💬 Chat</span>
                </span>
                <span className="oc" style={{ ["--a" as any]: "180deg", ["--r" as any]: "var(--r1)" }}>
                  <span className="oc-in">📚 Guides</span>
                </span>
              </div>
              <div className="orbit o2">
                <span className="oc" style={{ ["--a" as any]: "40deg", ["--r" as any]: "var(--r2)" }}>
                  <span className="oc-in">▶ Videos</span>
                </span>
                <span className="oc" style={{ ["--a" as any]: "160deg", ["--r" as any]: "var(--r2)" }}>
                  <span className="oc-in">अ हिंदी</span>
                </span>
                <span className="oc" style={{ ["--a" as any]: "280deg", ["--r" as any]: "var(--r2)" }}>
                  <span className="oc-in">🎓 Webinars</span>
                </span>
              </div>
              <div className="agent">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="58" fill="#e6f7ec" />
                  <path d="M22 112c4-22 20-34 38-34s34 12 38 34z" fill="#0caa41" />
                  <path d="M48 80l12 12 12-12" fill="#fff" opacity=".9" />
                  <circle cx="60" cy="50" r="20" fill="#f6c49c" />
                  <path
                    d="M40 48c0-14 9-22 20-22s20 8 20 22c-4-7-11-10-20-10s-16 3-20 10z"
                    fill="#2a3530"
                  />
                  <path
                    d="M37 52a23 23 0 0 1 46 0"
                    fill="none"
                    stroke="#11241a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <rect x="32" y="48" width="9" height="14" rx="4" fill="#11241a" />
                  <rect x="79" y="48" width="9" height="14" rx="4" fill="#11241a" />
                  <path
                    d="M84 62c0 8-6 12-14 12"
                    fill="none"
                    stroke="#11241a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="68" cy="74" r="3" fill="#11241a" />
                  <circle cx="53" cy="52" r="2" fill="#2a3530" />
                  <circle cx="67" cy="52" r="2" fill="#2a3530" />
                  <path d="M55 59q5 4 10 0" fill="none" stroke="#2a3530" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="online">
                  <i></i>Online now
                </span>
              </div>
              <div className="bubble2">
                <span className="b-av">RK</span>
                <span>
                  <small>{appName} Support</small>Hi Ankit 👋 How can we help today?
                </span>
              </div>
              <div className="bubble2 me2">
                <span className="dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section className="pr-sec" id="pricing" data-block="pricing-link" aria-labelledby="pricing-title">
          <div className="wrap">
            <div className="center">
              <h2 id="pricing-title">
                Start free. <span className="grad">Upgrade when you grow.</span>
              </h2>
              <p className="sub" style={{ textAlign: "center" }}>
                Every new account starts with a free 15-day SMB Pro trial, then moves to the free Startup plan unless
                you upgrade.
              </p>
            </div>

            <div className="pr-ctrl">
              <div className="seg" role="radiogroup" aria-label="Currency">
                <button className="sg" role="radio" aria-checked="true" data-cur="inr">
                  ₹ INR
                </button>
                <button className="sg" role="radio" aria-checked="false" data-cur="usd">
                  $ USD
                </button>
              </div>
              <div className="seg" id="billSeg" role="radiogroup" aria-label="Billing period" hidden>
                <button className="sg" role="radio" aria-checked="true" data-bill="y">
                  Yearly <em>save 17%</em>
                </button>
                <button className="sg" role="radio" aria-checked="false" data-bill="m">
                  Monthly
                </button>
              </div>
            </div>

            <div className="plans">
              <article className="plan">
                <h3>Startup</h3>
                <p className="pt">For trying it out or very small volumes</p>
                <div className="amt" data-inr="₹0|forever" data-usdy="$0|forever" data-usdm="$0|forever">
                  <b>₹0</b>
                  <span>forever</span>
                </div>
                <Link className="btn btn-line" href={primaryCtaHref}>
                  Start free
                </Link>
                <ul>
                  <li>1 user</li>
                  <li>10 invoices a month</li>
                  <li>10 journal vouchers a month</li>
                  <li>Basic financial reports</li>
                  <li>1 warehouse</li>
                </ul>
              </article>

              <article className="plan">
                <h3>Essential</h3>
                <p className="pt">For solopreneurs filing GST</p>
                <div
                  className="amt"
                  data-inr="₹2,499|per year"
                  data-usdy="$99|per year"
                  data-usdm="$9.95|per month"
                >
                  <b>₹2,499</b>
                  <span>per year</span>
                </div>
                <Link className="btn btn-line" href={primaryCtaHref}>
                  Start free trial
                </Link>
                <ul>
                  <li>1 user</li>
                  <li>1,000 invoices a year</li>
                  <li>GSTR-1 and GSTR-3B</li>
                  <li>Invoice reminders and signature</li>
                  <li className="add">WhatsApp integration add-on</li>
                </ul>
              </article>

              <article className="plan pop">
                <span className="ribbon">Most popular</span>
                <h3>Growth</h3>
                <p className="pt">For growing teams and service firms</p>
                <div className="amt" data-inr="₹4,999|per year" data-usdy="$199|per year" data-usdm="$20|per month">
                  <b>₹4,999</b>
                  <span>per year</span>
                </div>
                <Link className="btn btn-green" href={primaryCtaHref}>
                  Start free trial
                </Link>
                <ul>
                  <li className="inh">Everything in Essential, plus</li>
                  <li>10 users</li>
                  <li>5,000 invoices a year</li>
                  <li>Payroll and multi-currency</li>
                  <li>3 warehouses</li>
                </ul>
              </article>

              <article className="plan">
                <h3>SMB Pro</h3>
                <p className="pt">For established businesses</p>
                <div
                  className="amt"
                  data-inr="₹7,500|per year · or ₹750/month"
                  data-usdy="$349|per year"
                  data-usdm="$35|per month"
                >
                  <b>₹7,500</b>
                  <span>per year · or ₹750/month</span>
                </div>
                <Link className="btn btn-line" href={primaryCtaHref}>
                  Start free trial
                </Link>
                <ul>
                  <li className="inh">Everything in Growth, plus</li>
                  <li>25 users with custom roles</li>
                  <li>Unlimited invoices</li>
                  <li>Unlimited warehouses</li>
                  <li>Projects and auditor access</li>
                </ul>
              </article>
            </div>
            <p className="pr-note">
              Prices exclude GST. Pay by card, net banking, American Express or PayPal.{" "}
              <a href="#all-features">Compare every feature →</a>
            </p>
          </div>
        </section>

        {/* ============ PROOF ============ */}
        <section className="tq-sec" id="proof" data-block="proof" aria-labelledby="proof-title">
          <div className="wrap">
            <h2 id="proof-title" className="sr-only">
              What customers say
            </h2>
            <figure className="tq" data-kind="testimonial">
              <span className="tq-mark" aria-hidden="true">
                “
              </span>
              <blockquote>
                I was spending 3–4 hours every month on tax filing. With {appName},{" "}
                <mark>it&apos;s done in 20 minutes.</mark> The software categorises everything, so I just review and
                file.
              </blockquote>
              <figcaption>
                <span className="hs" aria-hidden="true">
                  <svg viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="32" fill="#dcf4e3" />
                    <path d="M14 64c2-13 9-20 18-20s16 7 18 20z" fill="#0a9339" />
                    <path
                      d="M19 30c0-11 6-18 13-18s13 7 13 18c0 6-1 10-3 13H22c-2-3-3-7-3-13z"
                      fill="#2a3530"
                    />
                    <circle cx="32" cy="31" r="10" fill="#f2c29a" />
                    <path
                      d="M22 29c1-7 5-11 10-11s9 4 10 9c-5-1-10-3-13-6-2 3-4 6-7 8z"
                      fill="#2a3530"
                    />
                    <path d="M28 47h8l-4 5z" fill="#f2c29a" />
                  </svg>
                </span>
                <span className="who">
                  <b>Priya Sharma</b>
                  <small>Accountant &amp; business consultant</small>
                </span>
                <span className="src">
                  ★★★★★ <em>on G2</em>
                </span>
              </figcaption>
            </figure>

            <div className="badges" aria-label="Average ratings on review sites">
              <div className="bdg">
                <b>Capterra</b>
                <span className="rstars" style={{ ["--r" as any]: 4.5 }} aria-hidden="true"></span>
                <small>4.5 / 5</small>
              </div>
              <div className="bdg">
                <b>G2</b>
                <span className="rstars" style={{ ["--r" as any]: 4.5 }} aria-hidden="true"></span>
                <small>4.5 / 5</small>
              </div>
              <div className="bdg">
                <b>GetApp</b>
                <span className="rstars" style={{ ["--r" as any]: 4.5 }} aria-hidden="true"></span>
                <small>4.5 / 5</small>
              </div>
              <div className="bdg">
                <b>SoftwareSuggest</b>
                <span className="rstars" style={{ ["--r" as any]: 4.5 }} aria-hidden="true"></span>
                <small>4.5 / 5</small>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="faq-sec" id="faq" data-block="faq" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="center">
              <h2 id="faq-title">Before you sign up</h2>
            </div>
            <div className="faq">
              <details open>
                <summary>Can I use {appName} without any accounting knowledge?</summary>
                <p>
                  Yes. It&apos;s built for owners, not accountants. You create invoices, record expenses, and import
                  your bank statement; the double-entry bookkeeping happens automatically in the background. Most users
                  are up and running in under 30 minutes.
                </p>
              </details>
              <details>
                <summary>Does it work for service businesses with no inventory?</summary>
                <p>
                  That&apos;s exactly who it&apos;s for. Invoicing, receivables, expenses, tax, and reports work without
                  touching inventory. If you later sell products too, inventory features are there when you need them.
                </p>
              </details>
              <details>
                <summary>How does tax preparation work?</summary>
                <p>
                  Tax codes are pre-loaded for your region and applied automatically based on the client and location.
                  Every invoice and bill is categorised by tax type and rate, so filing-ready data is available whenever
                  you need it. Review, export, and file.
                </p>
              </details>
              <details>
                <summary>Can I switch from Tally or QuickBooks?</summary>
                <p>
                  Yes. Start on the free plan, add your opening balances, customers and vendors, and run {appName}{" "}
                  alongside your old software for a month. Switch fully once you&apos;re confident the numbers match.
                </p>
              </details>
              <details>
                <summary>Can my accountant access my books?</summary>
                <p>
                  Yes. Invite your accountant or auditor as a read-only user. They see the reports they need and you
                  keep control of everything else.
                </p>
              </details>
              <details>
                <summary>What does the free plan include?</summary>
                <p>
                  The Startup plan is free forever for one user, with 10 invoices and 10 journal vouchers a month,
                  basic financial reports and one warehouse. Paid plans start at ₹2,499 a year and add GST returns, more
                  invoices, more users, payroll and multi-currency.
                </p>
              </details>
              <details>
                <summary>Is my business financial data safe?</summary>
                <p>
                  Your data lives on secure cloud servers with encryption, automatic backups, and role-based access
                  control. That&apos;s safer than a spreadsheet on one laptop, and you decide who sees what.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="final" id="signup" data-block="final-cta" aria-labelledby="signup-title">
          <div className="glow2"></div>
          <div className="gridlines"></div>
          <div className="wrap in">
            <h2 id="signup-title">
              Your books, handled. <span className="grad">Starting today.</span>
            </h2>
            <p>Create your free account and send your first invoice before lunch.</p>
            <Link className="btn btn-green" href={primaryCtaHref}>
              Try {appName} For Free →
            </Link>
            <p className="clockline" id="clockline">
              Your books could be up to date before the day ends.
            </p>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link className="logo" href="/" aria-label={`${appName} home`}>
                {appLogo ? (
                  <img src={appLogo} width="193" height="39" alt={appName} />
                ) : (
                  <>
                    <span className="mark">{brandInitial}</span>
                    <span>
                      {appName === "KoboBooks" ? (
                        <>
                          Kobo<span className="p2">Books</span>
                        </>
                      ) : (
                        appName
                      )}
                    </span>
                  </>
                )}
              </Link>
              <p data-entity="description" style={{ fontSize: "13.5px", marginTop: "12px" }}>
                {appName} is online accounting and invoicing software for small businesses, with invoicing, expenses,
                bank reconciliation, tax reports and 45+ financial reports in one place.
              </p>
            </div>
            <div>
              <h2 className="fh">Product</h2>
              <ul>
                <li>
                  <a href="#features">Invoicing &amp; billing</a>
                </li>
                <li>
                  <a href="#sales">Receivables &amp; payables</a>
                </li>
                <li>
                  <a href="#features">Business accounting</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="fh">Free tools</h2>
              <ul>
                <li>
                  <a href="#features">Tax calculator</a>
                </li>
                <li>
                  <a href="#features">Invoice generator</a>
                </li>
                <li>
                  <a href="#sales">Estimate generator</a>
                </li>
                <li>
                  <a href="#reports">Financial reports</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="fh">Countries</h2>
              <ul className="foot-cc">
                <li>
                  <a href="#pricing">
                    <img src="/flags/in.svg" width="20" height="15" alt="" loading="lazy" /> India
                  </a>
                </li>
                <li>
                  <a href="#pricing">
                    <img src="/flags/au.svg" width="20" height="15" alt="" loading="lazy" /> Australia
                  </a>
                </li>
                <li>
                  <a href="#pricing">
                    <img src="/flags/ae.svg" width="20" height="15" alt="" loading="lazy" /> UAE
                  </a>
                </li>
                <li>
                  <a href="#pricing">
                    <img src="/flags/za.svg" width="20" height="15" alt="" loading="lazy" /> South Africa
                  </a>
                </li>
                <li>
                  <a href="#pricing">
                    <img src="/flags/om.svg" width="20" height="15" alt="" loading="lazy" /> Oman
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="fh">Company</h2>
              <ul>
                <li>
                  <a href="#support">Support center</a>
                </li>
                <li>
                  <a href="#faq">Trust &amp; security</a>
                </li>
                <li>
                  <Link href={signInHref}>Sign in</Link>
                </li>
                <li>
                  <Link href={primaryCtaHref}>Get started</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="foot-base">
            <span>
              © {new Date().getFullYear()} {appName} · Powered by Nutech
            </span>
            <span>
              <a href="#faq">Privacy</a> · <a href="#faq">Terms</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

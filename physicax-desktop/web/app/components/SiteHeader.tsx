"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "./SiteNav";
import { UserMenu } from "./UserMenu";
import { useRailState } from "./useRailState";
import { useLocale } from "./LocaleProvider";

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return { r, g, b };
};

const mixRgb = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t)
});

const rgbToHex = (color: { r: number; g: number; b: number }) =>
  `#${[color.r, color.g, color.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const applyAccent = (value: string) => {
  if (typeof document === "undefined") return;
  const rgb = hexToRgb(value);
  if (!rgb) return;
  const accent3 = mixRgb(rgb, { r: 255, g: 255, b: 255 }, 0.35);
  document.documentElement.style.setProperty("--accent-2", value);
  document.documentElement.style.setProperty("--accent-3", rgbToHex(accent3));
  document.documentElement.style.setProperty("--ring", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
};

const fetchWithTimeout = async (input: string, timeoutMs = 3000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { signal: controller.signal, cache: "no-store" });
  } finally {
    window.clearTimeout(timer);
  }
};

export function SiteHeader() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [hidden, setHidden] = useState(true);
  const [desktopAvailable, setDesktopAvailable] = useState(false);
  const [gpuMode, setGpuMode] = useState<"high" | "low">("high");
  const [gpuBusy, setGpuBusy] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("#2563eb");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [recentLabs, setRecentLabs] = useState<Array<{ id: string; href: string; title: string; ts: number }>>([]);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const { collapsed: railCollapsed, toggle: toggleRail, setCollapsed: setRailCollapsed } = useRailState();
  const { locale, setLocale, t } = useLocale();
  const RECENT_LABS_KEY = "physicaxRecentLabs";
  const primaryLinks = [
    { href: "/", label: t("overview") },
    { href: "/labs", label: t("labs") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/cfd", label: t("cfd") },
    ...(desktopAvailable ? [{ href: "/desktop", label: "Desktop" }] : [])
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem("physicaxNavCollapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
    const hiddenStored = window.localStorage.getItem("physicaxHeaderHidden");
    if (hiddenStored !== null) {
      setHidden(hiddenStored === "true");
    }
    const desktopBridge = (window as typeof window & { physicaxDesktop?: unknown }).physicaxDesktop as
      | {
          getSettings?: () => Promise<{ gpuMode?: "high" | "low" } | null | undefined>;
        }
      | undefined;
    const desktopReady = Boolean(desktopBridge);
    setDesktopAvailable(desktopReady);
    if (desktopReady) {
      desktopBridge
        ?.getSettings?.()
        .then((settings) => {
          if (settings?.gpuMode === "low") {
            setGpuMode("low");
          } else {
            setGpuMode("high");
          }
        })
        .catch(() => {});
    }

    const storedTheme = window.localStorage.getItem("physicaxTheme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : prefersDark ? "dark" : "light";
    setTheme(nextTheme as "light" | "dark");
    document.documentElement.dataset.theme = nextTheme;

    const storedAccent = window.localStorage.getItem("physicaxAccent");
    if (storedAccent) {
      setAccent(storedAccent);
      applyAccent(storedAccent);
    }

    const storedRecent = window.localStorage.getItem(RECENT_LABS_KEY);
    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent);
        if (Array.isArray(parsed)) {
          setRecentLabs(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    setActionsOpen(false);
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("physicaxNavCollapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("physicaxHeaderHidden", String(hidden));
    document.body.classList.toggle("header-hidden", hidden);
  }, [hidden]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("physicaxTheme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("physicaxAccent", accent);
    applyAccent(accent);
  }, [accent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setRecentLabs(detail);
      }
    };
    const storageHandler = (event: StorageEvent) => {
      if (event.key !== RECENT_LABS_KEY) return;
      if (!event.newValue) {
        setRecentLabs([]);
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          setRecentLabs(parsed);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("physicax-recent-labs", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("physicax-recent-labs", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  useEffect(() => {
    if (!actionsOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (actionsRef.current && target && !actionsRef.current.contains(target)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [actionsOpen]);

  const toggleGpuMode = async () => {
    if (!window.physicaxDesktop) return;
    try {
      setGpuBusy(true);
      const nextMode = gpuMode === "high" ? "low" : "high";
      await window.physicaxDesktop.setGpuMode(nextMode);
    } finally {
      setGpuBusy(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!desktopAvailable) {
      setBackendStatus("checking");
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const desktopBridge = (window as typeof window & {
          physicaxDesktop?: { getBackendUrl?: () => Promise<string> };
        }).physicaxDesktop;
        const runtimeBackendUrl = await desktopBridge?.getBackendUrl?.();
        if (!runtimeBackendUrl) {
          if (!cancelled) setBackendStatus("offline");
          return;
        }
        const res = await fetchWithTimeout(`${runtimeBackendUrl}/status`);
        if (!cancelled) setBackendStatus(res.ok ? "online" : "offline");
      } catch {
        if (!cancelled) setBackendStatus("offline");
      }
    };
    void check();
    const interval = window.setInterval(check, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [desktopAvailable]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;
        if (currentY <= 32 || delta < -10 || actionsOpen) {
          setHidden(false);
        } else if (delta > 12 && currentY > 96) {
          setHidden(true);
          setActionsOpen(false);
        }
        lastY = currentY;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [actionsOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setHidden((prev) => !prev);
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        toggleRail();
      }
      if (event.key === "Escape") {
        setHidden(true);
        setCollapsed(true);
        setRailCollapsed(true);
        setActionsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRail, setRailCollapsed]);

  return (
    <>
      <button
        type="button"
        className={`nav-fab ${hidden ? "is-visible" : ""}`}
        onClick={() => setHidden((prev) => !prev)}
        aria-expanded={!hidden}
        aria-controls="site-nav"
        title={`${t("menu")} (M)`}
      >
        {hidden ? t("menu") : t("close")}
      </button>
      <button
        type="button"
        className={`rail-fab ${railCollapsed ? "is-visible" : ""}`}
        onClick={toggleRail}
        aria-expanded={!railCollapsed}
        aria-controls="lab-rail"
        title={`${t("labsRailTitle")} (L)`}
      >
        {railCollapsed ? t("labsRailTitle") : t("labsRailCollapse")}
      </button>
      <header className={`site-header ${collapsed ? "nav-collapsed" : ""} ${hidden ? "is-hidden" : ""}`}>
        <div className="header-top">
          <Link href="/" className="brand-link" aria-label="PhysicaX home">
            <div className="brand">
              <div className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                  <defs>
                    <linearGradient id="brand-shell" x1="9" y1="7" x2="55" y2="58" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#071121" />
                      <stop offset="0.58" stopColor="#12264b" />
                      <stop offset="1" stopColor="#09101a" />
                    </linearGradient>
                    <linearGradient id="brand-orbit" x1="14" y1="12" x2="55" y2="49" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7dd3fc" />
                      <stop offset="0.52" stopColor="#60a5fa" />
                      <stop offset="1" stopColor="#c084fc" />
                    </linearGradient>
                    <radialGradient id="brand-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.5 25.5) rotate(45) scale(21)">
                      <stop stopColor="#f8fbff" />
                      <stop offset="0.34" stopColor="#93eaff" />
                      <stop offset="1" stopColor="#1d4ed8" />
                    </radialGradient>
                  </defs>
                  <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#brand-shell)" />
                  <g transform="rotate(-18 32 32)">
                    <ellipse cx="32" cy="23" rx="18" ry="7" stroke="url(#brand-orbit)" strokeWidth="2.4" />
                    <ellipse cx="32" cy="42" rx="14" ry="5.4" stroke="url(#brand-orbit)" strokeWidth="1.7" strokeOpacity="0.85" />
                    <circle cx="47.5" cy="25.5" r="2.7" fill="#c4b5fd" />
                  </g>
                  <circle cx="27.5" cy="26.5" r="11" fill="url(#brand-core)" />
                  <circle cx="23.5" cy="22.5" r="3.6" fill="#f8fbff" fillOpacity="0.8" />
                  <path
                    d="M22 46V18.5H30.25C35.8 18.5 39.25 21.45 39.25 26.2C39.25 31.05 35.8 33.95 30.25 33.95H26.65V46H22ZM26.65 30.1H29.85C32.95 30.1 34.9 28.75 34.9 26.2C34.9 23.8 32.95 22.35 29.85 22.35H26.65V30.1Z"
                    fill="#f8fbff"
                  />
                  <path d="M39.25 44.5L45.1 36.7L39.65 29.15H43.8L47.95 34.95L52.15 29.15H56.2L50.7 36.75L56.6 44.5H52.3L47.95 38.5L43.55 44.5H39.25Z" fill="#c084fc" />
                </svg>
              </div>
              <div className="brand-text">
                <div className="brand-title">PhysicaX</div>
                <div className="brand-subtitle">Local-first physics workspace</div>
              </div>
            </div>
          </Link>
          <div className="header-actions">
            <div className="header-pill">{t("headerPill")}</div>
            {desktopAvailable ? (
              <div className={`status-pill ${backendStatus}`} aria-live="polite">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  {t("backendLabel")}:{" "}
                  {backendStatus === "online" ? t("backendOnline") : backendStatus === "offline" ? t("backendOffline") : t("backendChecking")}
                </span>
              </div>
            ) : null}
            <div className="quick-actions" ref={actionsRef}>
              <button
                type="button"
                className={`nav-toggle ${actionsOpen ? "is-active" : ""}`}
                onClick={() => {
                  setHidden(false);
                  setActionsOpen((prev) => !prev);
                }}
                aria-expanded={actionsOpen}
              >
                {t("quickActions")}
              </button>
              {actionsOpen ? (
                <div className="quick-actions-menu" role="menu">
                  <div className="quick-actions-title">{t("quickActions")}</div>
                  <div className="quick-actions-list">
                    <Link href="/search" className="quick-actions-item">{t("searchTitle")}</Link>
                    <Link href="/dashboard" className="quick-actions-item">{t("dashboard")}</Link>
                    <Link href="/registry" className="quick-actions-item">{t("workspaceQuickRegistry")}</Link>
                    <Link href="/formulas" className="quick-actions-item">{t("workspaceQuickFormulas")}</Link>
                    <Link href="/solvers" className="quick-actions-item">{t("workspaceQuickSolvers")}</Link>
                  </div>
                  <div className="quick-actions-meta">{t("recentLabsTitle")}</div>
                  {recentLabs.length ? (
                    <div className="quick-actions-list">
                      {recentLabs.slice(0, 4).map((lab) => (
                        <Link key={lab.id} href={lab.href} className="quick-actions-item">
                          {lab.title}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="quick-actions-empty">{t("recentLabsEmpty")}</div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="header-links">
              {primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`header-link ${isActiveLink(item.href) ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <label className="field" style={{ minWidth: "120px" }}>
              <span>{t("languageLabel")}</span>
              <select value={locale} onChange={(event) => setLocale(event.target.value as "en" | "fr")}>
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </label>
            <UserMenu />
            <div className="theme-toggle-wrap">
              <span className="theme-label">{t("themeLabel")}</span>
              <button
                type="button"
                className={`nav-toggle theme-toggle ${theme === "dark" ? "is-dark" : "is-light"}`}
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? t("themeDark") : t("themeLight")}
              </button>
            </div>
            {desktopAvailable ? (
              <div className="gpu-toggle-wrap">
                <span className="theme-label">{t("gpuLabel")}</span>
                <button
                  type="button"
                  className="nav-toggle"
                  onClick={toggleGpuMode}
                  disabled={gpuBusy}
                >
                  {gpuMode === "high" ? t("gpuHigh") : t("gpuLow")}
                </button>
              </div>
            ) : null}
            <div className="accent-picker">
              <span className="theme-label">{t("accentLabel")}</span>
              <input
                type="color"
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
                aria-label={t("accentLabel")}
              />
              <div className="accent-presets">
                {["#2563eb", "#10b981", "#f97316", "#ef4444", "#a855f7"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="accent-swatch"
                    style={{ background: value }}
                    onClick={() => setAccent(value)}
                    aria-label={`${t("accentLabel")} ${value}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="control-chip"
                onClick={() => setAccent("#2563eb")}
              >
                {t("accentReset")}
              </button>
            </div>
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-controls="site-nav"
            >
              {collapsed ? t("menu") : t("close")}
            </button>
            <button
              type="button"
              className="nav-toggle"
              onClick={toggleRail}
              aria-expanded={!railCollapsed}
            >
              {railCollapsed ? t("showLabs") : t("hideLabs")}
            </button>
          </div>
        </div>
        <div className="nav-shell" id="site-nav">
          <SiteNav />
        </div>
      </header>
    </>
  );
}

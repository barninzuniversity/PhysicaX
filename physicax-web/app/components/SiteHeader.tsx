"use client";

import Link from "next/link";
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

export function SiteHeader() {
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
    const desktopBridge = (window as typeof window & { physicaxDesktop?: any }).physicaxDesktop;
    const desktopReady = Boolean(desktopBridge);
    setDesktopAvailable(desktopReady);
    if (desktopReady) {
      desktopBridge
        .getSettings?.()
        .then((settings: { gpuMode?: "high" | "low" } | null | undefined) => {
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
        const backendUrl = await window.physicaxDesktop?.getBackendUrl?.();
        if (!backendUrl) {
          if (!cancelled) setBackendStatus("offline");
          return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${backendUrl}/status`, { signal: controller.signal, cache: "no-store" });
        window.clearTimeout(timer);
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
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      if (delta > 8 && currentY > 80) {
        setHidden(true);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" aria-label="PhysicaX logo">
              <rect x="4" y="4" width="56" height="56" rx="16" fill="#0a0a0a" />
              <path
                d="M20 44V20h10c6 0 10 3 10 8 0 5-4 8-10 8h-4v8h-6zm6-14h4c3 0 5-1 5-4 0-3-2-4-5-4h-4v8z"
                fill="#ffffff"
              />
              <path d="M40 42l8-10-8-10h6l5 7 5-7h6l-8 10 8 10h-6l-5-7-5 7h-6z" fill="#8b5cf6" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">PhysicaX</div>
            <div className="brand-subtitle">Computational Physics Platform</div>
          </div>
        </div>
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
              onClick={() => setActionsOpen((prev) => !prev)}
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
            <Link href="/" className="header-link">{t("overview")}</Link>
            <Link href="/labs" className="header-link">{t("labs")}</Link>
            <Link href="/dashboard" className="header-link">{t("dashboard")}</Link>
            <Link href="/cfd" className="header-link">{t("cfd")}</Link>
            {desktopAvailable ? <Link href="/desktop" className="header-link">Desktop</Link> : null}
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

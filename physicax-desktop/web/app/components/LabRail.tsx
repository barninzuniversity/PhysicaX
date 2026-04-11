"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { labs } from "../data/labs";
import { useRailState } from "./useRailState";
import { useLocale } from "./LocaleProvider";

export function LabRail() {
  const pathname = usePathname();
  const { collapsed, toggle } = useRailState();
  const { locale, t } = useLocale();
  const [favorites, setFavorites] = useState<string[]>([]);
  const RECENT_LABS_KEY = "physicaxRecentLabs";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const favs = String(data.favoriteLabs || "")
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean);
          setFavorites(favs);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("physicax-favorites", favs.join(", "));
          }
          return;
        }
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("physicax-favorites");
        if (stored) {
          setFavorites(
            stored
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          );
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const match = labs.find((lab) => pathname.startsWith(lab.href));
    if (!match) {
      return;
    }
    const title = locale === "fr" && match.titleFr ? match.titleFr : match.title;
    const entry = { id: match.id, href: match.href, title, ts: Date.now() };
    try {
      const stored = window.localStorage.getItem(RECENT_LABS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [entry, ...list.filter((item) => item?.id && item.id !== entry.id)].slice(0, 5);
      window.localStorage.setItem(RECENT_LABS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("physicax-recent-labs", { detail: next }));
    } catch {
      // ignore
    }
  }, [pathname, locale]);

  const orderedLabs = useMemo(() => {
    if (!favorites.length) {
      return labs;
    }
    const favSet = new Set(favorites);
    return [...labs].sort((a, b) => {
      const aFav = favSet.has(a.id);
      const bFav = favSet.has(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [favorites]);

  return (
    <aside
      id="lab-rail"
      className={`lab-rail ${collapsed ? "collapsed" : ""}`}
      aria-label="Lab navigation"
      data-lab-rail="true"
    >
      <div className="lab-rail-header">
        <div className="lab-rail-title">{t("labsRailTitle")}</div>
        <button type="button" className="rail-toggle" onClick={toggle} aria-expanded={!collapsed}>
          {collapsed ? t("labsRailExpand") : t("labsRailCollapse")}
        </button>
      </div>
      <nav className="lab-rail-links">
        {orderedLabs.map((lab) => {
          const active = pathname.startsWith(lab.href);
          const title = locale === "fr" && lab.titleFr ? lab.titleFr : lab.title;
          const initial = title.split(" ")[0]?.[0] ?? "L";
          return (
            <Link key={lab.id} href={lab.href} className={`lab-rail-link ${active ? "active" : ""}`}>
              <span className="lab-rail-dot">{initial}</span>
              <span className="lab-rail-label">{title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="lab-rail-footer">
        <span>{t("labsRailFooter")}</span>
      </div>
    </aside>
  );
}

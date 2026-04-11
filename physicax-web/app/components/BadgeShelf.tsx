"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Badge = {
  id: string;
  awardedAt: string;
  badge: {
    key: string;
    title: string;
    description?: string | null;
  };
};

export function BadgeShelf() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/badges");
      if (res.ok) {
        setBadges(await res.json());
      } else {
        setStatus(t("badgeShelfLoadError"));
      }
    } catch {
      setStatus(t("badgeShelfLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("badgeShelfTitle")}</div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={load}>
          {t("badgeShelfRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="result-grid" style={{ marginTop: "12px" }}>
        {badges.length === 0 ? <div className="demo-note">{t("badgeShelfEmpty")}</div> : null}
        {badges.map((item) => (
          <div key={item.id} className="result-card">
            <div className="result-title">{item.badge.title}</div>
            <div className="result-summary">{item.badge.description}</div>
            <div className="result-tags">{t("badgeShelfAwarded")} {new Date(item.awardedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

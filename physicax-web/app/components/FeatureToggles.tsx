"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type ToggleItem = {
  id: string;
  label: string;
  description: string;
};

type FeatureTogglesProps = {
  title: string;
  items: ToggleItem[];
  defaultOn?: string[];
};

export function FeatureToggles({ title, items, defaultOn = [] }: FeatureTogglesProps) {
  const { t } = useLocale();
  const [active, setActive] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      initial[item.id] = defaultOn.includes(item.id);
    });
    return initial;
  });

  const count = useMemo(() => Object.values(active).filter(Boolean).length, [active]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{title}</div>
      <div className="demo-note">{count} {t("featureToggleEnabled")}</div>
      <div className="toggle-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`toggle-item ${active[item.id] ? "toggle-on" : ""}`}
            onClick={() => setActive((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
          >
            <div className="toggle-header">
              <span>{item.label}</span>
              <span className="toggle-state">{active[item.id] ? t("featureToggleOn") : t("featureToggleOff")}</span>
            </div>
            <div className="toggle-desc">{item.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

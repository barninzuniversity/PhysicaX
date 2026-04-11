"use client";

import Link from "next/link";
import { useState } from "react";
import { labs } from "../data/labs";
import { useLocale } from "./LocaleProvider";

export function LabExplorer() {
  const [activeId, setActiveId] = useState(labs[0]?.id ?? "");
  const { locale, t } = useLocale();
  const active = labs.find((lab) => lab.id === activeId) ?? labs[0];

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("labExplorerTitle")}</div>
      <div className="lab-grid">
        {labs.map((lab) => (
          <button
            key={lab.id}
            type="button"
            className={`lab-chip ${lab.id === activeId ? "lab-chip-active" : ""}`}
            onClick={() => setActiveId(lab.id)}
          >
            {locale === "fr" && lab.titleFr ? lab.titleFr : lab.title}
          </button>
        ))}
      </div>
      {active ? (
        <div className="lab-preview">
          <div className="lab-preview-title">{locale === "fr" && active.titleFr ? active.titleFr : active.title}</div>
          <div className="lab-preview-summary">{locale === "fr" && active.summaryFr ? active.summaryFr : active.summary}</div>
          <div className="lab-preview-tags">{active.focus.join(", ")}</div>
          <div className="lab-preview-list">
            {active.features.map((feature) => (
              <span key={feature} className="pill">
                {feature}
              </span>
            ))}
          </div>
          <Link href={active.href} className="lab-link">
            {t("labExplorerOpen")} {locale === "fr" && active.titleFr ? active.titleFr : active.title}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

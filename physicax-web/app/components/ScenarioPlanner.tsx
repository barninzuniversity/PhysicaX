"use client";

import Link from "next/link";
import { useState } from "react";

type PlannerMetric = {
  label: string;
  value: string;
};

type PlannerLink = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "chip";
};

export type PlannerScenario = {
  id: string;
  label: string;
  accent: string;
  title: string;
  summary: string;
  body: string;
  bullets: string[];
  metrics: PlannerMetric[];
  links: PlannerLink[];
  note?: string;
};

type ScenarioPlannerProps = {
  eyebrow: string;
  title: string;
  lede: string;
  scenarios: PlannerScenario[];
};

export function ScenarioPlanner({ eyebrow, title, lede, scenarios }: ScenarioPlannerProps) {
  const [activeId, setActiveId] = useState(scenarios[0]?.id ?? "");
  const activeScenario = scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0];

  if (!activeScenario) {
    return null;
  }

  return (
    <div className="scenario-shell">
      <div className="section-header">
        <p className="section-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-lede">{lede}</p>
      </div>
      <div className="scenario-tabs" role="tablist" aria-label={title}>
        {scenarios.map((scenario) => {
          const active = scenario.id === activeScenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`scenario-tab ${active ? "is-active" : ""}`}
              onClick={() => setActiveId(scenario.id)}
            >
              <span className="scenario-tab-accent">{scenario.accent}</span>
              <span className="scenario-tab-label">{scenario.label}</span>
              <span className="scenario-tab-copy">{scenario.summary}</span>
            </button>
          );
        })}
      </div>
      <div className="scenario-grid">
        <div className="scenario-main">
          <span className="spotlight-tag">{activeScenario.accent}</span>
          <h3>{activeScenario.title}</h3>
          <p className="scenario-body">{activeScenario.body}</p>
          <ul className="scenario-list">
            {activeScenario.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {activeScenario.note ? <div className="scenario-note">{activeScenario.note}</div> : null}
          <div className="scenario-links">
            {activeScenario.links.map((link) => (
              <Link
                key={`${activeScenario.id}-${link.href}-${link.label}`}
                href={link.href}
                className={
                  link.variant === "chip"
                    ? "control-chip"
                    : link.variant === "secondary"
                      ? "control-button secondary"
                      : "control-button"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="scenario-side">
          <div className="scenario-metric-grid">
            {activeScenario.metrics.map((metric) => (
              <div className="scenario-metric" key={`${activeScenario.id}-${metric.label}`}>
                <div className="scenario-metric-value">{metric.value}</div>
                <div className="scenario-metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

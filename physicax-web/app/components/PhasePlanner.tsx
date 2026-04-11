"use client";

import { useState } from "react";

const phases = [
  {
    id: "phase-0",
    title: "Phase 0 - Infrastructure",
    details: [
      "Monorepo scaffold",
      "Shared UI + plotting wrappers",
      "Auth + accounts",
      "Saved experiments core"
    ]
  },
  {
    id: "phase-1",
    title: "Phase 1 - Core Scientific MVP",
    details: ["ThermoLab v1", "ChaosLab v1", "Gallery", "Compare mode", "Exports"]
  },
  {
    id: "phase-2",
    title: "Phase 2 - Mechanics + Research",
    details: ["Projectile + oscillators", "Pendulum suite", "Double pendulum", "Research mode"]
  },
  {
    id: "phase-3",
    title: "Phase 3 - Advanced Scientific Layer",
    details: ["Thermo cycles", "ODE lab", "PDE lab", "Stat physics mini-labs"]
  }
];

export function PhasePlanner() {
  const [active, setActive] = useState(phases[0].id);
  const phase = phases.find((item) => item.id === active) ?? phases[0];

  return (
    <div className="demo-panel">
      <div className="demo-title">Phase Planner</div>
      <div className="search-tabs">
        {phases.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab ${active === item.id ? "tab-active" : ""}`}
            onClick={() => setActive(item.id)}
          >
            {item.title.split(" - ")[0]}
          </button>
        ))}
      </div>
      <div className="phase-details">
        <div className="phase-title">{phase.title}</div>
        <ul className="phase-list">
          {phase.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

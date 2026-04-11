"use client";

import { useMemo, useState } from "react";

const sections = [
  "metadata",
  "warnings",
  "assumptions",
  "summary",
  "equations",
  "datasets",
  "plots",
  "animation",
  "diagnostics",
  "exports"
];

export function ResponseBuilder() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section) => {
      initial[section] = ["metadata", "summary", "datasets", "plots"].includes(section);
    });
    return initial;
  });

  const payload = useMemo(() => {
    const base: Record<string, string> = {};
    sections.forEach((section) => {
      if (selected[section]) {
        base[section] = `${section} payload`;
      }
    });
    return base;
  }, [selected]);

  return (
    <div className="demo-panel">
      <div className="demo-title">SimulationResult Builder</div>
      <div className="checklist">
        {sections.map((section) => (
          <label key={section} className="check-item">
            <input
              type="checkbox"
              checked={Boolean(selected[section])}
              onChange={() => setSelected((prev) => ({ ...prev, [section]: !prev[section] }))}
            />
            <span>{section}</span>
          </label>
        ))}
      </div>
      <div className="code-block">
        <pre><code>{JSON.stringify(payload, null, 2)}</code></pre>
      </div>
    </div>
  );
}

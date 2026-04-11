"use client";

import { useMemo, useState } from "react";

const sections = [
  "Title and Abstract",
  "Model and Assumptions",
  "Parameters and Initial Conditions",
  "Solver Configuration",
  "Plots and Results",
  "Discussion and Limitations",
  "Reproducibility Metadata"
];

export function NotebookOutlineBuilder() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section) => {
      initial[section] = true;
    });
    return initial;
  });

  const outline = useMemo(() => sections.filter((section) => selected[section]), [selected]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Notebook Outline Builder</div>
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
        <pre><code>{outline.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}</code></pre>
      </div>
    </div>
  );
}

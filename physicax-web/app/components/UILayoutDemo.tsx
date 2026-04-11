"use client";

import { useMemo, useState } from "react";

const panels = [
  { id: "left", label: "Left Panel" },
  { id: "main", label: "Main Panel" },
  { id: "right", label: "Right Panel" },
  { id: "diagnostics", label: "Diagnostics Drawer" }
];

export function UILayoutDemo() {
  const [state, setState] = useState<Record<string, boolean>>({
    left: true,
    main: true,
    right: true,
    diagnostics: false
  });

  const active = useMemo(() => panels.filter((panel) => state[panel.id]), [state]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Workspace Layout Toggle</div>
      <div className="toggle-list compact">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`toggle-item ${state[panel.id] ? "toggle-on" : ""}`}
            onClick={() => setState((prev) => ({ ...prev, [panel.id]: !prev[panel.id] }))}
          >
            <div className="toggle-header">
              <span>{panel.label}</span>
              <span className="toggle-state">{state[panel.id] ? "on" : "off"}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="layout-preview">
        {active.map((panel) => (
          <div key={panel.id} className="layout-block">
            {panel.label}
          </div>
        ))}
        {!active.length ? <div className="layout-empty">No panels active</div> : null}
      </div>
    </div>
  );
}

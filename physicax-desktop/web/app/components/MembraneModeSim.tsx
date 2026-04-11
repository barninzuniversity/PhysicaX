"use client";

import { useMemo, useState } from "react";
import { PlotlyPlot } from "./PlotlyPlot";

export function MembraneModeSim() {
  const [m, setM] = useState("2");
  const [n, setN] = useState("3");
  const [phase, setPhase] = useState("0");

  const { z } = useMemo(() => {
    const mVal = Math.max(1, Math.min(6, Math.floor(Number(m) || 2)));
    const nVal = Math.max(1, Math.min(6, Math.floor(Number(n) || 3)));
    const phaseVal = Number(phase) || 0;
    const size = 36;
    const grid: number[][] = [];
    for (let j = 0; j < size; j += 1) {
      const y = j / (size - 1);
      const row: number[] = [];
      for (let i = 0; i < size; i += 1) {
        const x = i / (size - 1);
        const val =
          Math.sin(mVal * Math.PI * x) *
          Math.sin(nVal * Math.PI * y) *
          Math.cos(phaseVal);
        row.push(val);
      }
      grid.push(row);
    }
    return { z: grid };
  }, [m, n, phase]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Membrane Modes</div>
      <div className="demo-grid">
        <label className="field">
          <span>m</span>
          <input type="number" value={m} onChange={(event) => setM(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>n</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>phase</span>
          <input type="number" value={phase} onChange={(event) => setPhase(event.target.value)} step="0.1" />
        </label>
      </div>
      <PlotlyPlot
        data={[
          {
            type: "heatmap",
            z,
            colorscale: "Portland"
          }
        ]}
        layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
        style={{ height: "320px" }}
      />
      <div className="demo-note">
        Mode shape sin(m pi x) sin(n pi y) cos(phase).
      </div>
    </div>
  );
}

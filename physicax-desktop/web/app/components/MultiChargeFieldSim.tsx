"use client";

import { useMemo, useState } from "react";
import { PlotlyPlot } from "./PlotlyPlot";
import { MathInline } from "./MathBlock";

const k = 8.9875517923e9;

type Charge = { q: string; x: string; y: string };

export function MultiChargeFieldSim() {
  const [charges, setCharges] = useState<Charge[]>([
    { q: "1e-6", x: "-0.4", y: "0" },
    { q: "-1e-6", x: "0.4", y: "0" },
    { q: "0.5e-6", x: "0", y: "0.4" }
  ]);
  const [extent, setExtent] = useState("1");
  const [grid, setGrid] = useState("40");

  const updateCharge = (idx: number, patch: Partial<Charge>) => {
    setCharges((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const { z } = useMemo(() => {
    const n = Math.max(20, Math.min(80, Math.floor(Number(grid))));
    const half = Math.max(0.2, Number(extent));
    const mat = Array.from({ length: n }, () => Array(n).fill(0));
    const parsed = charges.map((c) => ({ q: Number(c.q), x: Number(c.x), y: Number(c.y) }));
    for (let i = 0; i < n; i += 1) {
      const x = -half + (2 * half * i) / (n - 1);
      for (let j = 0; j < n; j += 1) {
        const y = -half + (2 * half * j) / (n - 1);
        let v = 0;
        for (const c of parsed) {
          const dx = x - c.x;
          const dy = y - c.y;
          const r = Math.sqrt(dx * dx + dy * dy) + 1e-6;
          v += (k * c.q) / r;
        }
        mat[j][i] = v;
      }
    }
    return { z: mat };
  }, [charges, extent, grid]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Multi-Charge Field Map</div>
      <div className="demo-grid">
        {charges.map((c, idx) => (
          <label key={`c-${idx}`} className="field">
            <span>q{idx + 1} (C)</span>
            <input type="number" value={c.q} onChange={(event) => updateCharge(idx, { q: event.target.value })} step="any" />
            <span>x{idx + 1}</span>
            <input type="number" value={c.x} onChange={(event) => updateCharge(idx, { x: event.target.value })} step="any" />
            <span>y{idx + 1}</span>
            <input type="number" value={c.y} onChange={(event) => updateCharge(idx, { y: event.target.value })} step="any" />
          </label>
        ))}
        <label className="field">
          <span>extent (m)</span>
          <input type="number" value={extent} onChange={(event) => setExtent(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>grid</span>
          <input type="number" value={grid} onChange={(event) => setGrid(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="demo-note">
          <MathInline latex={String.raw`V(\mathbf{r})=\sum k\frac{q_i}{r_i}`} />
        </div>
      </div>
      <PlotlyPlot
        data={[
          {
            type: "heatmap",
            z,
            colorscale: "RdBu",
            zmid: 0
          }
        ]}
        layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
        style={{ height: "360px" }}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function DipoleFieldSim() {
  const [q, setQ] = useState("1");
  const [d, setD] = useState("1");
  const [xMax, setXMax] = useState("4");

  const { points } = useMemo(() => {
    const qVal = Number(q);
    const dVal = Number(d);
    const xMaxVal = Number(xMax);
    if (!Number.isFinite(qVal) || !Number.isFinite(dVal) || !Number.isFinite(xMaxVal)) {
      return { points: [] };
    }
    if (dVal <= 0 || xMaxVal <= 0) {
      return { points: [] };
    }
    const k = 8.9875517923e9;
    const pts: { x: number; y: number }[] = [];
    const steps = 200;
    const a = dVal / 2;
    for (let i = 0; i <= steps; i += 1) {
      const x = -xMaxVal + (2 * xMaxVal * i) / steps;
      const r1 = x + a;
      const r2 = x - a;
      const e1 = r1 === 0 ? 0 : k * qVal / (r1 * r1) * Math.sign(r1);
      const e2 = r2 === 0 ? 0 : -k * qVal / (r2 * r2) * Math.sign(r2);
      const e = e1 + e2;
      pts.push({ x, y: e });
    }
    return { points: pts };
  }, [q, d, xMax]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Dipole Field (x-axis)</div>
      <div className="demo-grid">
        <label className="field">
          <span>charge q (C)</span>
          <input type="number" value={q} onChange={(event) => setQ(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>separation d (m)</span>
          <input type="number" value={d} onChange={(event) => setD(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x range</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
      </div>
      <PlotCanvas series={[{ id: "dipole", points, color: "#2563eb" }]} xLabel="x" yLabel="E" />
      <div className="demo-note">Field from +q at -d/2 and -q at +d/2 along the x-axis.</div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function ConductionSim() {
  const [k, setK] = useState("45");
  const [area, setArea] = useState("0.01");
  const [length, setLength] = useState("0.5");
  const [th, setTh] = useState("120");
  const [tc, setTc] = useState("20");

  const { points, q } = useMemo(() => {
    const kVal = Number(k);
    const aVal = Number(area);
    const lVal = Number(length);
    const thVal = Number(th);
    const tcVal = Number(tc);
    if (!Number.isFinite(kVal) || !Number.isFinite(aVal) || !Number.isFinite(lVal) || !Number.isFinite(thVal) || !Number.isFinite(tcVal)) {
      return { points: [], q: NaN };
    }
    if (kVal <= 0 || aVal <= 0 || lVal <= 0) {
      return { points: [], q: NaN };
    }
    const qVal = (kVal * aVal * (thVal - tcVal)) / lVal;
    const pts: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i += 1) {
      const x = (lVal * i) / steps;
      const temp = thVal - ((thVal - tcVal) * x) / lVal;
      pts.push({ x, y: temp });
    }
    return { points: pts, q: qVal };
  }, [k, area, length, th, tc]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Conduction Through a Slab</div>
      <div className="demo-grid">
        <label className="field">
          <span>k (W/mK)</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Area (m^2)</span>
          <input type="number" value={area} onChange={(event) => setArea(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Length (m)</span>
          <input type="number" value={length} onChange={(event) => setLength(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T_hot (C)</span>
          <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T_cold (C)</span>
          <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">q = {Number.isFinite(q) ? q.toFixed(2) : "--"} W</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`q = \frac{k A (T_{hot} - T_{cold})}{L}`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "cond", points, color: "#2563eb", fill: true }]} xLabel="x" yLabel="T" />
    </div>
  );
}


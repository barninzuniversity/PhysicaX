"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const R = 8.314462618;

export function EntropyExpansionSim() {
  const [n, setN] = useState("1");
  const [v1, setV1] = useState("0.01");
  const [v2, setV2] = useState("0.02");

  const { deltaS, points } = useMemo(() => {
    const nVal = Number(n);
    const v1Val = Number(v1);
    const v2Val = Number(v2);
    if (!Number.isFinite(nVal) || !Number.isFinite(v1Val) || !Number.isFinite(v2Val)) {
      return { deltaS: NaN, points: [] };
    }
    if (nVal <= 0 || v1Val <= 0 || v2Val <= 0) {
      return { deltaS: NaN, points: [] };
    }
    const delta = nVal * R * Math.log(v2Val / v1Val);
    const pts: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i += 1) {
      const v = v1Val + ((v2Val - v1Val) * i) / steps;
      const s = nVal * R * Math.log(v / v1Val);
      pts.push({ x: v, y: s });
    }
    return { deltaS: delta, points: pts };
  }, [n, v1, v2]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Entropy Change (Isothermal)</div>
      <div className="demo-grid">
        <label className="field">
          <span>n (mol)</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V1 (m^3)</span>
          <input type="number" value={v1} onChange={(event) => setV1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V2 (m^3)</span>
          <input type="number" value={v2} onChange={(event) => setV2(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">ΔS = {Number.isFinite(deltaS) ? deltaS.toFixed(3) : "--"} J/K</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\Delta S = n R \ln\left(\frac{V_2}{V_1}\right)`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "entropy", points, color: "#d97706", fill: true }]} xLabel="V" yLabel="ΔS" />
    </div>
  );
}

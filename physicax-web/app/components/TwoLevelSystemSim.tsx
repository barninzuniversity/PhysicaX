"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const kB = 1.380649e-23;

export function TwoLevelSystemSim() {
  const [energy, setEnergy] = useState("3e-21");
  const [temp, setTemp] = useState("300");
  const [tMax, setTMax] = useState("800");

  const { p1, p0, meanE, curve } = useMemo(() => {
    const eVal = Number(energy);
    const tVal = Number(temp);
    const tMaxVal = Number(tMax);
    if (!Number.isFinite(eVal) || !Number.isFinite(tVal) || !Number.isFinite(tMaxVal) || eVal <= 0 || tVal <= 0) {
      return { p1: NaN, p0: NaN, meanE: NaN, curve: [] };
    }
    const beta = eVal / (kB * tVal);
    const p1Val = Math.exp(-beta) / (1 + Math.exp(-beta));
    const p0Val = 1 - p1Val;
    const mean = eVal * p1Val;

    const pts: { x: number; y: number }[] = [];
    const maxTemp = Math.max(tMaxVal, tVal);
    const steps = 120;
    for (let i = 0; i <= steps; i += 1) {
      const t = (maxTemp * i) / steps;
      if (t <= 0) {
        pts.push({ x: t, y: 0 });
      } else {
        const b = eVal / (kB * t);
        const p = Math.exp(-b) / (1 + Math.exp(-b));
        pts.push({ x: t, y: p });
      }
    }

    return { p1: p1Val, p0: p0Val, meanE: mean, curve: pts };
  }, [energy, temp, tMax]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Two-Level System</div>
      <div className="demo-grid">
        <label className="field">
          <span>Energy gap (J)</span>
          <input type="number" value={energy} onChange={(event) => setEnergy(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Temperature (K)</span>
          <input type="number" value={temp} onChange={(event) => setTemp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T max (K)</span>
          <input type="number" value={tMax} onChange={(event) => setTMax(event.target.value)} step="any" />
        </label>
      </div>
      <div className="metric-grid">
        <div className="metric-card">p0: {Number.isFinite(p0) ? p0.toFixed(3) : "--"}</div>
        <div className="metric-card">p1: {Number.isFinite(p1) ? p1.toFixed(3) : "--"}</div>
        <div className="metric-card">mean E: {Number.isFinite(meanE) ? meanE.toExponential(2) : "--"} J</div>
      </div>
      <PlotCanvas
        series={[{ id: "p1", points: curve, color: "#2563eb", fill: true, label: "p1(T)" }]}
        xLabel="T"
        yLabel="p1"
        showLegend
      />
      <div className="demo-note">
        <MathInline latex={String.raw`p_1 = \frac{e^{-E/(kT)}}{1 + e^{-E/(kT)}}`} />
      </div>
    </div>
  );
}


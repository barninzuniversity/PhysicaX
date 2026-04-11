"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function ThermalExpansionSim() {
  const [l0, setL0] = useState("1");
  const [alpha, setAlpha] = useState("1.2e-5");
  const [t0, setT0] = useState("20");
  const [t1, setT1] = useState("200");

  const { points, l1, deltaL } = useMemo(() => {
    const l0Val = Number(l0);
    const alphaVal = Number(alpha);
    const t0Val = Number(t0);
    const t1Val = Number(t1);
    if (!Number.isFinite(l0Val) || !Number.isFinite(alphaVal) || !Number.isFinite(t0Val) || !Number.isFinite(t1Val)) {
      return { points: [], l1: NaN, deltaL: NaN };
    }
    const l1Val = l0Val * (1 + alphaVal * (t1Val - t0Val));
    const pointsOut: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i += 1) {
      const t = t0Val + ((t1Val - t0Val) * i) / steps;
      const l = l0Val * (1 + alphaVal * (t - t0Val));
      pointsOut.push({ x: t, y: l });
    }
    return { points: pointsOut, l1: l1Val, deltaL: l1Val - l0Val };
  }, [l0, alpha, t0, t1]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Thermal Expansion Simulator</div>
      <div className="demo-grid">
        <label className="field">
          <span>L0 (m)</span>
          <input type="number" value={l0} onChange={(event) => setL0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>alpha (1/K)</span>
          <input type="number" value={alpha} onChange={(event) => setAlpha(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T0 (C)</span>
          <input type="number" value={t0} onChange={(event) => setT0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T1 (C)</span>
          <input type="number" value={t1} onChange={(event) => setT1(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">L1 = {Number.isFinite(l1) ? l1.toFixed(6) : "--"} m</span>
          <span className="pill">DeltaL = {Number.isFinite(deltaL) ? deltaL.toExponential(3) : "--"} m</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`L = L_0 (1 + \alpha \Delta T)`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "exp", points, color: "#2563eb", fill: true }]} xLabel="T" yLabel="L" />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function ParticleInBFieldSim() {
  const [q, setQ] = useState("1.6e-19");
  const [b, setB] = useState("0.8");
  const [m, setM] = useState("9.11e-31");
  const [v, setV] = useState("2e6");
  const [turns, setTurns] = useState("2");

  const { points, radius, omega } = useMemo(() => {
    const qVal = Number(q);
    const bVal = Number(b);
    const mVal = Number(m);
    const vVal = Number(v);
    const turnsVal = Number(turns);
    if (!Number.isFinite(qVal) || !Number.isFinite(bVal) || !Number.isFinite(mVal) || !Number.isFinite(vVal)) {
      return { points: [], radius: NaN, omega: NaN };
    }
    if (mVal <= 0 || bVal === 0) {
      return { points: [], radius: NaN, omega: NaN };
    }
    const omegaVal = Math.abs(qVal * bVal / mVal);
    const radiusVal = vVal / omegaVal;
    const pts: { x: number; y: number }[] = [];
    const steps = 400;
    const totalT = (2 * Math.PI * turnsVal) / omegaVal;
    for (let i = 0; i <= steps; i += 1) {
      const t = (totalT * i) / steps;
      const x = radiusVal * Math.cos(omegaVal * t);
      const y = radiusVal * Math.sin(omegaVal * t);
      pts.push({ x, y });
    }
    return { points: pts, radius: radiusVal, omega: omegaVal };
  }, [q, b, m, v, turns]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Charged Particle in B Field</div>
      <div className="demo-grid">
        <label className="field">
          <span>q (C)</span>
          <input type="number" value={q} onChange={(event) => setQ(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>B (T)</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>m (kg)</span>
          <input type="number" value={m} onChange={(event) => setM(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v_perp (m/s)</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>turns</span>
          <input type="number" value={turns} onChange={(event) => setTurns(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">radius = {Number.isFinite(radius) ? radius.toExponential(2) : "--"} m</span>
          <span className="pill">omega = {Number.isFinite(omega) ? omega.toExponential(2) : "--"} rad/s</span>
        </div>
      </div>
      <PlotCanvas series={[{ id: "traj", points, color: "#0b7285" }]} xLabel="x" yLabel="y" />
      <div className="demo-note">
        <MathInline latex={String.raw`\omega = \frac{|q| B}{m},\; r = \frac{v}{\omega}`} />
      </div>
    </div>
  );
}

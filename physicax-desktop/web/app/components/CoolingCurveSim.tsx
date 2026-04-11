"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function CoolingCurveSim() {
  const [t0, setT0] = useState("120");
  const [tEnv, setTEnv] = useState("25");
  const [k, setK] = useState("0.15");
  const [duration, setDuration] = useState("60");

  const { points, tau } = useMemo(() => {
    const t0Val = Number(t0);
    const tEnvVal = Number(tEnv);
    const kVal = Number(k);
    const durVal = Number(duration);
    if (!Number.isFinite(t0Val) || !Number.isFinite(tEnvVal) || !Number.isFinite(kVal) || !Number.isFinite(durVal)) {
      return { points: [], tau: NaN };
    }
    if (durVal <= 0 || kVal <= 0) {
      return { points: [], tau: NaN };
    }
    const pts: { x: number; y: number }[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i += 1) {
      const t = (durVal * i) / steps;
      const temp = tEnvVal + (t0Val - tEnvVal) * Math.exp(-kVal * t);
      pts.push({ x: t, y: temp });
    }
    return { points: pts, tau: 1 / kVal };
  }, [t0, tEnv, k, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Newton Cooling Curve</div>
      <div className="demo-grid">
        <label className="field">
          <span>T0 (C)</span>
          <input type="number" value={t0} onChange={(event) => setT0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T_env (C)</span>
          <input type="number" value={tEnv} onChange={(event) => setTEnv(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>k (1/s)</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration (s)</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">tau = {Number.isFinite(tau) ? tau.toFixed(2) : "--"} s</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`T(t) = T_{env} + (T_0 - T_{env}) e^{-k t}`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "cool", points, color: "#d97706", fill: true }]} xLabel="t" yLabel="T" />
    </div>
  );
}


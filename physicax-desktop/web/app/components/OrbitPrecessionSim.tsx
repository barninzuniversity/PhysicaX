"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function OrbitPrecessionSim() {
  const [mu, setMu] = useState("1");
  const [epsilon, setEpsilon] = useState("0.02");
  const [r0, setR0] = useState("1.6");
  const [v0, setV0] = useState("0.7");
  const [dt, setDt] = useState("0.01");
  const [duration, setDuration] = useState("40");

  const { path } = useMemo(() => {
    const muVal = Number(mu);
    const epsVal = Number(epsilon);
    const r0Val = Number(r0);
    const v0Val = Number(v0);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (![muVal, epsVal, r0Val, v0Val, dtVal, durVal].every(Number.isFinite)) {
      return { path: [] };
    }
    if (dtVal <= 0 || durVal <= 0 || r0Val <= 0) {
      return { path: [] };
    }
    const steps = Math.min(12000, Math.max(2000, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    let x = r0Val;
    let y = 0;
    let vx = 0;
    let vy = v0Val;
    const pts: { x: number; y: number }[] = [];

    const accel = (xVal: number, yVal: number) => {
      const r2 = xVal * xVal + yVal * yVal;
      const r = Math.sqrt(r2) + 1e-6;
      const aNewton = -muVal / (r2 * r);
      const aPrecess = -epsVal / (r2 * r2 * r);
      const ax = (aNewton + aPrecess) * xVal;
      const ay = (aNewton + aPrecess) * yVal;
      return { ax, ay };
    };

    for (let i = 0; i <= steps; i += 1) {
      pts.push({ x, y });
      const { ax, ay } = accel(x, y);
      vx += ax * dtStep;
      vy += ay * dtStep;
      x += vx * dtStep;
      y += vy * dtStep;
    }
    return { path: pts };
  }, [mu, epsilon, r0, v0, dt, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Orbit Precession</div>
      <div className="demo-grid">
        <label className="field">
          <span>mu</span>
          <input type="number" value={mu} onChange={(event) => setMu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>epsilon</span>
          <input type="number" value={epsilon} onChange={(event) => setEpsilon(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>r0</span>
          <input type="number" value={r0} onChange={(event) => setR0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v0</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
      </div>
      <PlotCanvas series={[{ id: "orbit", points: path, color: "#0b7285" }]} xLabel="x" yLabel="y" />
      <div className="demo-note">
        epsilon adds a weak r^-4 term to induce precession.
      </div>
    </div>
  );
}

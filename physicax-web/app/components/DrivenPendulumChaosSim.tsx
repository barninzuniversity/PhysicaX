"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function DrivenPendulumChaosSim() {
  const [q, setQ] = useState("0.25");
  const [drive, setDrive] = useState("1.2");
  const [omega, setOmega] = useState("2");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("40");
  const [theta0, setTheta0] = useState("0.2");
  const [omega0, setOmega0] = useState("0");

  const { series, phase, poincare } = useMemo(() => {
    const qVal = Number(q);
    const driveVal = Number(drive);
    const wVal = Number(omega);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    const th0 = Number(theta0);
    const om0 = Number(omega0);
    if (![qVal, driveVal, wVal, dtVal, durVal, th0, om0].every(Number.isFinite)) {
      return { series: [], phase: [], poincare: [] };
    }
    if (dtVal <= 0 || durVal <= 0) {
      return { series: [], phase: [], poincare: [] };
    }
    const steps = Math.min(9000, Math.max(400, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    let th = th0;
    let om = om0;
    const pts: { x: number; y: number }[] = [];
    const phasePts: { x: number; y: number }[] = [];
    const pPts: { x: number; y: number }[] = [];
    const drivePeriod = (2 * Math.PI) / wVal;
    let nextSample = drivePeriod;

    const accel = (time: number, theta: number, omegaVal: number) =>
      -qVal * omegaVal - Math.sin(theta) + driveVal * Math.cos(wVal * time);

    for (let i = 0; i <= steps; i += 1) {
      const t = i * dtStep;
      const thWrapped = ((th + Math.PI) % (2 * Math.PI)) - Math.PI;
      pts.push({ x: t, y: thWrapped });
      phasePts.push({ x: thWrapped, y: om });
      if (t >= nextSample - dtStep * 0.5) {
        pPts.push({ x: thWrapped, y: om });
        nextSample += drivePeriod;
      }

      const k1t = om;
      const k1o = accel(t, th, om);
      const k2t = om + 0.5 * dtStep * k1o;
      const k2o = accel(t + 0.5 * dtStep, th + 0.5 * dtStep * k1t, om + 0.5 * dtStep * k1o);
      const k3t = om + 0.5 * dtStep * k2o;
      const k3o = accel(t + 0.5 * dtStep, th + 0.5 * dtStep * k2t, om + 0.5 * dtStep * k2o);
      const k4t = om + dtStep * k3o;
      const k4o = accel(t + dtStep, th + dtStep * k3t, om + dtStep * k3o);
      th += (dtStep / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
      om += (dtStep / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
    }
    return { series: pts, phase: phasePts, poincare: pPts };
  }, [q, drive, omega, dt, duration, theta0, omega0]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Driven Pendulum (Chaos)</div>
      <div className="demo-grid">
        <label className="field">
          <span>q (damping)</span>
          <input type="number" value={q} onChange={(event) => setQ(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>drive amp</span>
          <input type="number" value={drive} onChange={(event) => setDrive(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>drive omega</span>
          <input type="number" value={omega} onChange={(event) => setOmega(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>theta0</span>
          <input type="number" value={theta0} onChange={(event) => setTheta0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega0</span>
          <input type="number" value={omega0} onChange={(event) => setOmega0(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-stack">
        <PlotCanvas series={[{ id: "theta", points: series, color: "#0b7285", label: "theta(t)" }]} xLabel="t" yLabel="theta" showLegend />
        <PlotCanvas series={[{ id: "phase", points: phase, color: "#2563eb", label: "phase" }]} xLabel="theta" yLabel="omega" showLegend />
        <PlotCanvas
          series={[{ id: "poincare", points: poincare, color: "#db2777", mode: "scatter", label: "Poincare" }]}
          xLabel="theta"
          yLabel="omega"
          showLegend
        />
      </div>
    </div>
  );
}

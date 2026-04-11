"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function DuffingOscillatorSim() {
  const [delta, setDelta] = useState("0.2");
  const [alpha, setAlpha] = useState("-1");
  const [beta, setBeta] = useState("1");
  const [gamma, setGamma] = useState("0.3");
  const [omega, setOmega] = useState("1.2");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("40");
  const [x0, setX0] = useState("0.2");
  const [v0, setV0] = useState("0");

  const { series, phase, poincare } = useMemo(() => {
    const dVal = Number(delta);
    const aVal = Number(alpha);
    const bVal = Number(beta);
    const gVal = Number(gamma);
    const wVal = Number(omega);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    const x0Val = Number(x0);
    const v0Val = Number(v0);
    if (![dVal, aVal, bVal, gVal, wVal, dtVal, durVal, x0Val, v0Val].every(Number.isFinite)) {
      return { series: [], phase: [], poincare: [] };
    }
    if (dtVal <= 0 || durVal <= 0) {
      return { series: [], phase: [], poincare: [] };
    }
    const steps = Math.min(9000, Math.max(400, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    let x = x0Val;
    let v = v0Val;
    const pts: { x: number; y: number }[] = [];
    const phasePts: { x: number; y: number }[] = [];
    const pPts: { x: number; y: number }[] = [];

    const drivePeriod = (2 * Math.PI) / wVal;
    let nextSample = drivePeriod;
    for (let i = 0; i <= steps; i += 1) {
      const t = i * dtStep;
      pts.push({ x: t, y: x });
      phasePts.push({ x, y: v });

      if (t >= nextSample - dtStep * 0.5) {
        pPts.push({ x, y: v });
        nextSample += drivePeriod;
      }

      const accel = (time: number, xVal: number, vVal: number) =>
        -dVal * vVal - aVal * xVal - bVal * xVal * xVal * xVal + gVal * Math.cos(wVal * time);

      const k1x = v;
      const k1v = accel(t, x, v);
      const k2x = v + 0.5 * dtStep * k1v;
      const k2v = accel(t + 0.5 * dtStep, x + 0.5 * dtStep * k1x, v + 0.5 * dtStep * k1v);
      const k3x = v + 0.5 * dtStep * k2v;
      const k3v = accel(t + 0.5 * dtStep, x + 0.5 * dtStep * k2x, v + 0.5 * dtStep * k2v);
      const k4x = v + dtStep * k3v;
      const k4v = accel(t + dtStep, x + dtStep * k3x, v + dtStep * k3v);
      x += (dtStep / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      v += (dtStep / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }

    return { series: pts, phase: phasePts, poincare: pPts };
  }, [delta, alpha, beta, gamma, omega, dt, duration, x0, v0]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Duffing Oscillator</div>
      <div className="demo-grid">
        <label className="field">
          <span>delta</span>
          <input type="number" value={delta} onChange={(event) => setDelta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>alpha</span>
          <input type="number" value={alpha} onChange={(event) => setAlpha(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>beta</span>
          <input type="number" value={beta} onChange={(event) => setBeta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega</span>
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
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v0</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-stack">
        <PlotCanvas series={[{ id: "x", points: series, color: "#0b7285", label: "x(t)" }]} xLabel="t" yLabel="x" showLegend />
        <PlotCanvas series={[{ id: "phase", points: phase, color: "#2563eb", label: "phase" }]} xLabel="x" yLabel="v" showLegend />
        <PlotCanvas
          series={[{ id: "poincare", points: poincare, color: "#db2777", mode: "scatter", label: "Poincare" }]}
          xLabel="x"
          yLabel="v"
          showLegend
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function WaveSuperpositionSim() {
  const [a, setA] = useState("1");
  const [k, setK] = useState("2");
  const [omega, setOmega] = useState("3");
  const [t, setT] = useState(0);
  const [phase, setPhase] = useState("0");
  const [phi0, setPhi0] = useState("0");
  const [speed, setSpeed] = useState("1");
  const [isPlaying, setIsPlaying] = useState(false);

  const points = useMemo(() => {
    const aVal = Number(a);
    const kVal = Number(k);
    const wVal = Number(omega);
    const tVal = Number(t);
    const pVal = Number(phase);
    const phi0Val = Number(phi0);
    if (!Number.isFinite(aVal) || !Number.isFinite(kVal) || !Number.isFinite(wVal) || !Number.isFinite(tVal)) {
      return [];
    }
    const pts: { x: number; y: number }[] = [];
    const n = 120;
    for (let i = 0; i <= n; i += 1) {
      const x = (i / n) * 2 * Math.PI;
      const y1 = aVal * Math.sin(kVal * x - wVal * tVal + phi0Val);
      const y2 = aVal * Math.sin(kVal * x + wVal * tVal + pVal + phi0Val);
      pts.push({ x, y: y1 + y2 });
    }
    return pts;
  }, [a, k, omega, t, phase, phi0]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    let frame = 0;
    let last = performance.now();
    const rate = Number(speed);
    const animate = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (Number.isFinite(rate)) {
        setT((prev) => prev + dt * rate);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Wave Superposition</div>
      <div className="demo-grid">
        <label className="field">
          <span>A</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>k</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega</span>
          <input type="number" value={omega} onChange={(event) => setOmega(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>t</span>
          <input type="number" value={t} onChange={(event) => setT(Number(event.target.value))} step="any" />
        </label>
        <label className="field">
          <span>phase shift</span>
          <input type="number" value={phase} onChange={(event) => setPhase(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>initial phase</span>
          <input type="number" value={phi0} onChange={(event) => setPhi0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => setT(0)}>
          Reset
        </button>
      </div>
      <div className="demo-note">
        <MathInline latex={String.raw`y(x,t)=A\sin(kx-\omega t+\phi_0)+A\sin(kx+\omega t+\phi+\phi_0)`} />
      </div>
      <PlotCanvas series={[{ id: "wave", points, color: "#1f8a8a" }]} xLabel="x" yLabel="y" />
    </div>
  );
}

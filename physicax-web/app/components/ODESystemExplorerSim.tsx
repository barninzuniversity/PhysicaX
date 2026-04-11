"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function ODESystemExplorerSim() {
  const [a, setA] = useState("-0.2");
  const [b, setB] = useState("1");
  const [c, setC] = useState("-2");
  const [d, setD] = useState("-0.4");
  const [x0, setX0] = useState("0.8");
  const [y0, setY0] = useState("0.2");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("12");

  const { trajs, eigenText } = useMemo(() => {
    const aVal = Number(a);
    const bVal = Number(b);
    const cVal = Number(c);
    const dVal = Number(d);
    const x0Val = Number(x0);
    const y0Val = Number(y0);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (![aVal, bVal, cVal, dVal, x0Val, y0Val, dtVal, durVal].every(Number.isFinite)) {
      return { trajs: [], eigenText: "--" };
    }
    if (dtVal <= 0 || durVal <= 0) {
      return { trajs: [], eigenText: "--" };
    }
    const steps = Math.min(2400, Math.max(40, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;

    const seedPoints = [
      { x: x0Val, y: y0Val },
      { x: x0Val + 0.6, y: y0Val },
      { x: x0Val, y: y0Val + 0.6 }
    ];

    const traces = seedPoints.map((seed) => {
      let x = seed.x;
      let y = seed.y;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i += 1) {
        pts.push({ x, y });
        const dx = aVal * x + bVal * y;
        const dy = cVal * x + dVal * y;
        x += dtStep * dx;
        y += dtStep * dy;
      }
      return pts;
    });

    const trace = aVal + dVal;
    const det = aVal * dVal - bVal * cVal;
    const disc = trace * trace - 4 * det;
    let classText = "center";
    if (det < 0) {
      classText = "saddle (unstable)";
    } else if (disc > 0) {
      classText = trace < 0 ? "stable node" : "unstable node";
    } else if (disc < 0) {
      classText = trace < 0 ? "stable spiral" : "unstable spiral";
    } else {
      classText = trace < 0 ? "stable degenerate" : "unstable degenerate";
    }
    const eigenText = `trace=${trace.toFixed(2)}, det=${det.toFixed(2)}, disc=${disc.toFixed(2)} -> ${classText}`;
    return { trajs: traces, eigenText };
  }, [a, b, c, d, x0, y0, dt, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">ODE System Explorer</div>
      <div className="demo-grid">
        <label className="field">
          <span>a</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>b</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>c</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>d</span>
          <input type="number" value={d} onChange={(event) => setD(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>y0</span>
          <input type="number" value={y0} onChange={(event) => setY0(event.target.value)} step="any" />
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
      <div className="demo-output">
        <span className="pill">{eigenText}</span>
        <span className="pill">x' = a x + b y, y' = c x + d y</span>
      </div>
      <PlotCanvas
        series={trajs.map((points, idx) => ({
          id: `traj-${idx}`,
          points,
          color: idx === 0 ? "#0b7285" : idx === 1 ? "#2563eb" : "#db2777"
        }))}
        xLabel="x"
        yLabel="y"
        showLegend={false}
      />
    </div>
  );
}

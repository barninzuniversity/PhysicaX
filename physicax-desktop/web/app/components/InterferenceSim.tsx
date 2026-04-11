"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function InterferenceSim() {
  const [d, setD] = useState("0.4");
  const [l, setL] = useState("3");
  const [lambda, setLambda] = useState("0.08");
  const [xMax, setXMax] = useState("2");

  const { points } = useMemo(() => {
    const dVal = Number(d);
    const lVal = Number(l);
    const lambdaVal = Number(lambda);
    const xMaxVal = Number(xMax);
    if (!Number.isFinite(dVal) || !Number.isFinite(lVal) || !Number.isFinite(lambdaVal) || !Number.isFinite(xMaxVal)) {
      return { points: [] };
    }
    if (lVal <= 0 || lambdaVal <= 0 || xMaxVal <= 0) {
      return { points: [] };
    }
    const pts: { x: number; y: number }[] = [];
    const steps = 200;
    for (let i = 0; i <= steps; i += 1) {
      const x = -xMaxVal + (2 * xMaxVal * i) / steps;
      const delta = (dVal * x) / lVal;
      const phase = (2 * Math.PI * delta) / lambdaVal;
      const intensity = 2 * (1 + Math.cos(phase));
      pts.push({ x, y: intensity });
    }
    return { points: pts };
  }, [d, l, lambda, xMax]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Two-Source Interference</div>
      <div className="demo-grid">
        <label className="field">
          <span>source spacing d</span>
          <input type="number" value={d} onChange={(event) => setD(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>screen distance L</span>
          <input type="number" value={l} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>lambda</span>
          <input type="number" value={lambda} onChange={(event) => setLambda(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x range</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
      </div>
      <PlotCanvas series={[{ id: "intensity", points, color: "#0b7285", fill: true }]} xLabel="x" yLabel="I" />
      <div className="demo-note">
        <MathInline latex={String.raw`I \propto 1 + \cos\left(\frac{2\pi d x}{\lambda L}\right)`} />
      </div>
    </div>
  );
}

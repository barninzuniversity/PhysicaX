"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function LyapunovSim() {
  const [r, setR] = useState("3.7");
  const [x0, setX0] = useState("0.2");
  const [iters, setIters] = useState("300");

  const { lambda, curve } = useMemo(() => {
    const rVal = Number(r);
    const x0Val = Number(x0);
    const itersVal = Math.max(50, Math.min(1200, Math.floor(Number(iters))));
    if (!Number.isFinite(rVal) || !Number.isFinite(x0Val)) {
      return { lambda: NaN, curve: [] };
    }
    let x = x0Val;
    let sum = 0;
    const skip = 50;
    for (let i = 0; i < itersVal + skip; i += 1) {
      x = rVal * x * (1 - x);
      if (i >= skip) {
        sum += Math.log(Math.abs(rVal * (1 - 2 * x)) || 1e-8);
      }
    }
    const lambdaVal = sum / itersVal;

    const curvePts: { x: number; y: number }[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i += 1) {
      const rSweep = 2.5 + (1.5 * i) / steps;
      let xs = x0Val;
      let s = 0;
      for (let n = 0; n < 200 + skip; n += 1) {
        xs = rSweep * xs * (1 - xs);
        if (n >= skip) {
          s += Math.log(Math.abs(rSweep * (1 - 2 * xs)) || 1e-8);
        }
      }
      curvePts.push({ x: rSweep, y: s / 200 });
    }

    return { lambda: lambdaVal, curve: curvePts };
  }, [r, x0, iters]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Lyapunov Exponent (Logistic Map)</div>
      <div className="demo-grid">
        <label className="field">
          <span>r</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>iterations</span>
          <input type="number" value={iters} onChange={(event) => setIters(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className={`pill ${Number.isFinite(lambda) && lambda > 0 ? "pill-good" : "pill-bad"}`}>
            lambda = {Number.isFinite(lambda) ? lambda.toFixed(3) : "--"}
          </span>
        </div>
      </div>
      <PlotCanvas series={[{ id: "lambda", points: curve, color: "#2563eb" }]} xLabel="r" yLabel="λ" />
    </div>
  );
}

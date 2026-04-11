"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function RandomWalkSim() {
  const [steps, setSteps] = useState("200");
  const [seed, setSeed] = useState("42");

  const { points, rms } = useMemo(() => {
    const nVal = Math.max(1, Math.min(500, Math.floor(Number(steps))));
    const seedVal = Math.floor(Number(seed)) || 1;
    let state = seedVal;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
    let x = 0;
    const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let i = 1; i <= nVal; i += 1) {
      x += rand() > 0.5 ? 1 : -1;
      pts.push({ x: i, y: x });
    }
    const rmsVal = Math.sqrt(nVal);
    return { points: pts, rms: rmsVal };
  }, [steps, seed]);

  return (
    <div className="demo-panel">
      <div className="demo-title">1D Random Walk</div>
      <div className="demo-grid">
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>seed</span>
          <input type="number" value={seed} onChange={(event) => setSeed(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">x_rms approx = {Number.isFinite(rms) ? rms.toFixed(2) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`x_{rms} \propto \sqrt{N}`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "walk", points, color: "#0f6b4d" }]} xLabel="step" yLabel="x" />
    </div>
  );
}

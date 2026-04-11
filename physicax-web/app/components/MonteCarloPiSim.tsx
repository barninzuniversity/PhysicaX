"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function MonteCarloPiSim() {
  const [samples, setSamples] = useState("500");
  const [seed, setSeed] = useState(1);

  const { inside, outside, estimate } = useMemo(() => {
    const n = Math.min(1200, Math.max(100, Math.floor(Number(samples))));
    if (!Number.isFinite(n)) {
      return { inside: [], outside: [], estimate: NaN };
    }
    let insideCount = 0;
    const insidePts: { x: number; y: number }[] = [];
    const outsidePts: { x: number; y: number }[] = [];

    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (let i = 0; i < n; i += 1) {
      const x = rand();
      const y = rand();
      if (x * x + y * y <= 1) {
        insideCount += 1;
        insidePts.push({ x, y });
      } else {
        outsidePts.push({ x, y });
      }
    }
    const piEst = (4 * insideCount) / n;
    return { inside: insidePts, outside: outsidePts, estimate: piEst };
  }, [samples, seed]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Monte Carlo π</div>
      <div className="demo-grid">
        <label className="field">
          <span>samples</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="1" />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setSeed((prev) => prev + 1)}>
          Resample
        </button>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">pi ~ {Number.isFinite(estimate) ? estimate.toFixed(5) : "--"}</span>
        </div>
      </div>
      <PlotCanvas
        series={[
          { id: "inside", points: inside, color: "#0b7285", mode: "scatter", label: "inside" },
          { id: "outside", points: outside, color: "#d97706", mode: "scatter", label: "outside" }
        ]}
        xLabel="x"
        yLabel="y"
        showLegend
      />
    </div>
  );
}

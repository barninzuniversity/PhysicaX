"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { PlotlyPlot } from "./PlotlyPlot";

export function BifurcationSim() {
  const [rMin, setRMin] = useState("2.5");
  const [rMax, setRMax] = useState("4.0");
  const [samples, setSamples] = useState("120");
  const [burn, setBurn] = useState("80");
  const [keep, setKeep] = useState("40");

  const points = useMemo(() => {
    const rMinVal = Number(rMin);
    const rMaxVal = Number(rMax);
    const samplesVal = Math.max(10, Math.min(400, Math.floor(Number(samples))));
    const burnVal = Math.max(10, Math.min(400, Math.floor(Number(burn))));
    const keepVal = Math.max(10, Math.min(200, Math.floor(Number(keep))));
    if (!Number.isFinite(rMinVal) || !Number.isFinite(rMaxVal) || rMaxVal <= rMinVal) {
      return [];
    }
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < samplesVal; i += 1) {
      const r = rMinVal + (rMaxVal - rMinVal) * (i / (samplesVal - 1));
      let x = 0.2;
      for (let j = 0; j < burnVal; j += 1) {
        x = r * x * (1 - x);
      }
      for (let j = 0; j < keepVal; j += 1) {
        x = r * x * (1 - x);
        pts.push({ x: r, y: x });
      }
    }
    return pts;
  }, [rMin, rMax, samples, burn, keep]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Logistic Map Bifurcation</div>
      <div className="demo-grid">
        <label className="field">
          <span>r min</span>
          <input type="number" value={rMin} onChange={(event) => setRMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>r max</span>
          <input type="number" value={rMax} onChange={(event) => setRMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>samples</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>burn-in</span>
          <input type="number" value={burn} onChange={(event) => setBurn(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>keep</span>
          <input type="number" value={keep} onChange={(event) => setKeep(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-note">Computes the last iterations for each r to show bifurcation structure.</div>
      <PlotlyPlot
        data={[
          {
            x: points.map((p) => p.x),
            y: points.map((p) => p.y),
            type: "scattergl",
            mode: "markers",
            marker: { size: 2, color: "#0f6b4d", opacity: 0.55 }
          }
        ]}
        layout={{ xaxis: { title: "r" }, yaxis: { title: "x" } }}
      />
      <PlotCanvas
        series={[{ id: "bif", points, color: "#0f6b4d", mode: "scatter" }]}
        xLabel="r"
        yLabel="x"
      />
    </div>
  );
}

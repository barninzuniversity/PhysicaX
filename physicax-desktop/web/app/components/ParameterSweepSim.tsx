"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { PlotlyPlot } from "./PlotlyPlot";

type SweepMode = "one" | "two";
type ModelKey = "logistic" | "projectile";

export function ParameterSweepSim() {
  const [mode, setMode] = useState<SweepMode>("one");
  const [model, setModel] = useState<ModelKey>("logistic");
  const [paramA, setParamA] = useState("r");
  const [paramB, setParamB] = useState("x0");
  const [minA, setMinA] = useState("2.5");
  const [maxA, setMaxA] = useState("4");
  const [minB, setMinB] = useState("0.1");
  const [maxB, setMaxB] = useState("0.9");
  const [samples, setSamples] = useState("40");
  const [steps, setSteps] = useState("80");

  const result = useMemo(() => {
    const n = Math.max(10, Math.min(80, Math.floor(Number(samples))));
    const a0 = Number(minA);
    const a1 = Number(maxA);
    const b0 = Number(minB);
    const b1 = Number(maxB);
    const iter = Math.max(10, Math.min(200, Math.floor(Number(steps))));
    if (![a0, a1, b0, b1].every(Number.isFinite) || a0 === a1 || b0 === b1) {
      return { series: [], heatmap: [] as number[][] };
    }

    const series: { x: number; y: number }[] = [];
    const heatmap = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i += 1) {
      const a = a0 + ((a1 - a0) * i) / (n - 1);
      if (mode === "one") {
        let value = 0;
        if (model === "logistic") {
          let x = b0;
          for (let k = 0; k < iter; k += 1) {
            x = a * x * (1 - x);
          }
          value = x;
        } else {
          const theta = (a * Math.PI) / 180;
          const v0 = b0;
          const g = 9.81;
          value = (v0 * v0 * Math.sin(2 * theta)) / g;
        }
        series.push({ x: a, y: value });
        continue;
      }
      for (let j = 0; j < n; j += 1) {
        const b = b0 + ((b1 - b0) * j) / (n - 1);
        let value = 0;
        if (model === "logistic") {
          let x = b;
          for (let k = 0; k < iter; k += 1) {
            x = a * x * (1 - x);
          }
          value = x;
        } else {
          const theta = (a * Math.PI) / 180;
          const v0 = b;
          const g = 9.81;
          value = (v0 * v0 * Math.sin(2 * theta)) / g;
        }
        heatmap[n - 1 - j][i] = value;
      }
    }

    return { series, heatmap };
  }, [mode, model, minA, maxA, minB, maxB, samples, steps, paramA, paramB]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Parameter Sweep Engine</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "one" ? "active" : ""}`} onClick={() => setMode("one")}>
          1D sweep
        </button>
        <button type="button" className={`control-chip ${mode === "two" ? "active" : ""}`} onClick={() => setMode("two")}>
          2D sweep
        </button>
      </div>
      <div className="demo-grid">
        <label className="field">
          <span>Model</span>
          <select value={model} onChange={(event) => setModel(event.target.value as ModelKey)}>
            <option value="logistic">Logistic map</option>
            <option value="projectile">Projectile range</option>
          </select>
        </label>
        <label className="field">
          <span>Param A label</span>
          <input type="text" value={paramA} onChange={(event) => setParamA(event.target.value)} />
        </label>
        <label className="field">
          <span>Param B label</span>
          <input type="text" value={paramB} onChange={(event) => setParamB(event.target.value)} />
        </label>
        <label className="field">
          <span>A min</span>
          <input type="number" value={minA} onChange={(event) => setMinA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>A max</span>
          <input type="number" value={maxA} onChange={(event) => setMaxA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>B min</span>
          <input type="number" value={minB} onChange={(event) => setMinB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>B max</span>
          <input type="number" value={maxB} onChange={(event) => setMaxB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>samples</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>iterations</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
      </div>
      {mode === "one" ? (
        <PlotCanvas series={[{ id: "sweep", points: result.series, color: "#2563eb", label: "output" }]} xLabel={paramA} yLabel="output" showLegend />
      ) : (
        <PlotlyPlot
          data={[
            {
              type: "heatmap",
              z: result.heatmap,
              colorscale: "Viridis"
            }
          ]}
          layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
          style={{ height: "360px" }}
        />
      )}
    </div>
  );
}

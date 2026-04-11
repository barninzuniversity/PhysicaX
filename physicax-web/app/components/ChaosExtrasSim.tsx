"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { PlotlyPlot } from "./PlotlyPlot";

type Mode = "tent" | "quadratic" | "basin" | "recurrence" | "sweep";

export function ChaosExtrasSim() {
  const [mode, setMode] = useState<Mode>("tent");
  const [r, setR] = useState("1.8");
  const [c, setC] = useState("-0.3");
  const [x0, setX0] = useState("0.2");

  const data = useMemo(() => {
    const rVal = Number(r);
    const cVal = Number(c);
    const xVal = Number(x0);
    const series: { x: number; y: number }[] = [];

    if (mode === "tent") {
      let x = xVal;
      for (let i = 0; i < 120; i += 1) {
        x = x < 0.5 ? rVal * x : rVal * (1 - x);
        series.push({ x: i, y: x });
      }
    }

    if (mode === "quadratic") {
      let x = xVal;
      for (let i = 0; i < 120; i += 1) {
        x = x * x + cVal;
        series.push({ x: i, y: x });
      }
    }

    if (mode === "recurrence") {
      let x = xVal;
      const xs: number[] = [];
      for (let i = 0; i < 80; i += 1) {
        x = rVal * x * (1 - x);
        xs.push(x);
      }
      const mat = xs.map((xi) => xs.map((xj) => (Math.abs(xi - xj) < 0.02 ? 1 : 0)));
      return { series, matrix: mat };
    }

    if (mode === "basin") {
      const n = 60;
      const grid = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          let zx = (i / n) * 3 - 1.5;
          let zy = (j / n) * 3 - 1.5;
          let iter = 0;
          while (zx * zx + zy * zy < 4 && iter < 30) {
            const xt = zx * zx - zy * zy + cVal;
            const yt = 2 * zx * zy;
            zx = xt;
            zy = yt;
            iter += 1;
          }
          grid[j][i] = iter;
        }
      }
      return { series, matrix: grid };
    }

    if (mode === "sweep") {
      const steps = 80;
      const grid = Array.from({ length: steps }, () => Array(steps).fill(0));
      for (let i = 0; i < steps; i += 1) {
        const rLocal = 2.5 + (i / (steps - 1)) * 1.5;
        for (let j = 0; j < steps; j += 1) {
          let x = j / (steps - 1);
          for (let k = 0; k < 60; k += 1) {
            x = rLocal * x * (1 - x);
          }
          grid[j][i] = x;
        }
      }
      return { series, matrix: grid };
    }

    return { series, matrix: [] };
  }, [mode, r, c, x0]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Chaos Extras</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "tent" ? "active" : ""}`} onClick={() => setMode("tent")}>
          Tent Map
        </button>
        <button type="button" className={`control-chip ${mode === "quadratic" ? "active" : ""}`} onClick={() => setMode("quadratic")}>
          Quadratic Map
        </button>
        <button type="button" className={`control-chip ${mode === "recurrence" ? "active" : ""}`} onClick={() => setMode("recurrence")}>
          Recurrence
        </button>
        <button type="button" className={`control-chip ${mode === "basin" ? "active" : ""}`} onClick={() => setMode("basin")}>
          Basins
        </button>
        <button type="button" className={`control-chip ${mode === "sweep" ? "active" : ""}`} onClick={() => setMode("sweep")}>
          Parameter Sweep
        </button>
      </div>
      <div className="demo-grid">
        <label className="field">
          <span>r</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>c</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
      </div>
      {mode === "tent" || mode === "quadratic" ? (
        <PlotCanvas series={[{ id: "map", points: data.series, color: "#2563eb" }]} xLabel="n" yLabel="x_n" />
      ) : null}
      {mode !== "tent" && mode !== "quadratic" ? (
        <PlotlyPlot
          data={[
            {
              type: "heatmap",
              z: data.matrix,
              colorscale: "Turbo"
            }
          ]}
          layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
          style={{ height: "360px" }}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PlotlyPlot } from "./PlotlyPlot";

export function ReactionDiffusionSim() {
  const [feed, setFeed] = useState("0.0367");
  const [kill, setKill] = useState("0.0649");
  const [steps, setSteps] = useState("200");
  const [size, setSize] = useState("60");

  const { grid } = useMemo(() => {
    const n = Math.max(30, Math.min(90, Math.floor(Number(size))));
    const f = Number(feed);
    const k = Number(kill);
    const iters = Math.max(10, Math.min(600, Math.floor(Number(steps))));
    const du = 0.16;
    const dv = 0.08;

    let u = Array.from({ length: n }, () => Array(n).fill(1));
    let v = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = n / 2 - 4; i < n / 2 + 4; i += 1) {
      for (let j = n / 2 - 4; j < n / 2 + 4; j += 1) {
        u[i][j] = 0.5;
        v[i][j] = 0.25;
      }
    }

    const lap = (arr: number[][], x: number, y: number) => {
      const xm = (x - 1 + n) % n;
      const xp = (x + 1) % n;
      const ym = (y - 1 + n) % n;
      const yp = (y + 1) % n;
      return (
        arr[xm][y] +
        arr[xp][y] +
        arr[x][ym] +
        arr[x][yp] -
        4 * arr[x][y]
      );
    };

    for (let s = 0; s < iters; s += 1) {
      const uNext = Array.from({ length: n }, () => Array(n).fill(0));
      const vNext = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          const uvv = u[i][j] * v[i][j] * v[i][j];
          uNext[i][j] = u[i][j] + (du * lap(u, i, j) - uvv + f * (1 - u[i][j]));
          vNext[i][j] = v[i][j] + (dv * lap(v, i, j) + uvv - (f + k) * v[i][j]);
        }
      }
      u = uNext;
      v = vNext;
    }

    return { grid: v };
  }, [feed, kill, steps, size]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Reaction-Diffusion Patterns</div>
      <div className="demo-grid">
        <label className="field">
          <span>feed</span>
          <input type="number" value={feed} onChange={(event) => setFeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>kill</span>
          <input type="number" value={kill} onChange={(event) => setKill(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>grid size</span>
          <input type="number" value={size} onChange={(event) => setSize(event.target.value)} step="1" />
        </label>
      </div>
      <PlotlyPlot
        data={[
          {
            type: "heatmap",
            z: grid,
            colorscale: "Turbo"
          }
        ]}
        layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
        style={{ height: "360px" }}
      />
    </div>
  );
}

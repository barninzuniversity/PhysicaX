"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "heat" | "wave" | "advection";
type Init = "sine" | "gaussian";

export function PDEExplorerSim() {
  const [mode, setMode] = useState<Mode>("heat");
  const [init, setInit] = useState<Init>("gaussian");
  const [alpha, setAlpha] = useState("0.3");
  const [c, setC] = useState("1");
  const [time, setTime] = useState("0.6");
  const [length, setLength] = useState("1");

  const { points, stableNote } = useMemo(() => {
    const a = Number(alpha);
    const cVal = Number(c);
    const tVal = Math.max(0, Number(time));
    const L = Math.max(0.2, Number(length));
    const n = 120;
    const dx = L / (n - 1);
    const xs = Array.from({ length: n }, (_, i) => i * dx);
    const initVal = (x: number) => {
      if (init === "sine") {
        return Math.sin(Math.PI * x / L);
      }
      const z = (x - 0.5 * L) / (0.15 * L);
      return Math.exp(-0.5 * z * z);
    };

    if (mode === "advection") {
      const pts = xs.map((x) => ({ x, y: initVal((x - cVal * tVal + L) % L) }));
      return { points: pts, stableNote: "" };
    }

    if (mode === "wave") {
      const pts = xs.map((x) => ({ x, y: initVal(x) * Math.cos((Math.PI * cVal * tVal) / L) }));
      return { points: pts, stableNote: "" };
    }

    // heat equation explicit
    let u = xs.map((x) => initVal(x));
    const r = a * (tVal / Math.max(1, Math.floor(tVal / 0.01))) / (dx * dx);
    const steps = Math.max(1, Math.floor(tVal / 0.01));
    for (let s = 0; s < steps; s += 1) {
      const next = [...u];
      for (let i = 1; i < n - 1; i += 1) {
        next[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1]);
      }
      u = next;
    }
    const pts = xs.map((x, i) => ({ x, y: u[i] }));
    const stableNote = r > 0.5 ? "Warning: explicit scheme may be unstable (r > 0.5)." : "";
    return { points: pts, stableNote };
  }, [mode, init, alpha, c, time, length]);

  return (
    <div className="demo-panel">
      <div className="demo-title">PDE Explorer</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "heat" ? "active" : ""}`} onClick={() => setMode("heat")}>
          Heat
        </button>
        <button type="button" className={`control-chip ${mode === "wave" ? "active" : ""}`} onClick={() => setMode("wave")}>
          Wave
        </button>
        <button type="button" className={`control-chip ${mode === "advection" ? "active" : ""}`} onClick={() => setMode("advection")}>
          Advection
        </button>
      </div>
      <div className="demo-grid">
        <label className="field">
          <span>init</span>
          <select value={init} onChange={(event) => setInit(event.target.value as Init)}>
            <option value="gaussian">Gaussian</option>
            <option value="sine">Sine</option>
          </select>
        </label>
        <label className="field">
          <span>alpha / k</span>
          <input type="number" value={alpha} onChange={(event) => setAlpha(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>c</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>time</span>
          <input type="number" value={time} onChange={(event) => setTime(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>length</span>
          <input type="number" value={length} onChange={(event) => setLength(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        {stableNote ? <div className="pill pill-bad">{stableNote}</div> : null}
        <div className="demo-note">
          <MathInline latex={String.raw`\frac{\partial u}{\partial t}=\alpha \nabla^2 u,\;\; u_{tt}=c^2 u_{xx},\;\; u_t + c u_x = 0`} />
        </div>
      </div>
      <PlotCanvas series={[{ id: "u", points, color: "#2563eb" }]} xLabel="x" yLabel="u" />
    </div>
  );
}

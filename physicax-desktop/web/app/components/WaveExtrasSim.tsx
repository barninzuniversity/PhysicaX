"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { PlotlyPlot } from "./PlotlyPlot";

type Mode = "pulse" | "boundary" | "resonance" | "membrane";

export function WaveExtrasSim() {
  const [mode, setMode] = useState<Mode>("pulse");
  const [amp, setAmp] = useState("1");
  const [freq, setFreq] = useState("2");
  const [phase, setPhase] = useState("0");
  const [time, setTime] = useState("0.5");
  const [modeX, setModeX] = useState("2");
  const [modeY, setModeY] = useState("3");

  const { points, grid } = useMemo(() => {
    const A = Number(amp);
    const f = Number(freq);
    const ph = Number(phase);
    const t = Number(time);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 120; i += 1) {
      const x = (i / 120) * Math.PI * 2;
      if (mode === "pulse") {
        const y = A * Math.exp(-10 * (x - 3 - t) ** 2);
        pts.push({ x, y });
      } else if (mode === "boundary") {
        const y = A * Math.sin(x - t * f) + 0.7 * A * Math.sin(x + t * f + ph);
        pts.push({ x, y });
      } else if (mode === "resonance") {
        const y = A * Math.sin(Number(modeX) * x) * Math.cos(t * f);
        pts.push({ x, y });
      }
    }

    if (mode === "membrane") {
      const nx = Math.max(1, Math.floor(Number(modeX)));
      const ny = Math.max(1, Math.floor(Number(modeY)));
      const n = 50;
      const mat = Array.from({ length: n }, (_, j) =>
        Array.from({ length: n }, (_, i) => Math.sin((Math.PI * nx * i) / (n - 1)) * Math.sin((Math.PI * ny * j) / (n - 1)))
      );
      return { points: [], grid: mat };
    }

    return { points: pts, grid: [] };
  }, [mode, amp, freq, phase, time, modeX, modeY]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Wave Extras</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "pulse" ? "active" : ""}`} onClick={() => setMode("pulse")}>
          Pulse
        </button>
        <button type="button" className={`control-chip ${mode === "boundary" ? "active" : ""}`} onClick={() => setMode("boundary")}>
          Boundary
        </button>
        <button type="button" className={`control-chip ${mode === "resonance" ? "active" : ""}`} onClick={() => setMode("resonance")}>
          Resonance
        </button>
        <button type="button" className={`control-chip ${mode === "membrane" ? "active" : ""}`} onClick={() => setMode("membrane")}>
          Membrane
        </button>
      </div>

      <div className="demo-grid">
        <label className="field">
          <span>amplitude</span>
          <input type="number" value={amp} onChange={(event) => setAmp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>frequency</span>
          <input type="number" value={freq} onChange={(event) => setFreq(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>phase</span>
          <input type="number" value={phase} onChange={(event) => setPhase(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>time</span>
          <input type="number" value={time} onChange={(event) => setTime(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>mode x</span>
          <input type="number" value={modeX} onChange={(event) => setModeX(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>mode y</span>
          <input type="number" value={modeY} onChange={(event) => setModeY(event.target.value)} step="1" />
        </label>
      </div>

      {mode !== "membrane" ? (
        <PlotCanvas series={[{ id: "wave", points, color: "#2563eb" }]} xLabel="x" yLabel="y" />
      ) : (
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
      )}
    </div>
  );
}

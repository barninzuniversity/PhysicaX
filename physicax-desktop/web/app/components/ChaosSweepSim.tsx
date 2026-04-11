"use client";

import { useEffect, useRef, useState } from "react";

export function ChaosSweepSim() {
  const [mapType, setMapType] = useState<"logistic" | "tent">("logistic");
  const [mode, setMode] = useState<"bifurcation" | "lyapunov">("bifurcation");
  const [samples, setSamples] = useState("420");
  const [burn, setBurn] = useState("200");
  const [plotSteps, setPlotSteps] = useState("120");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 560;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const samplesVal = Math.max(120, Math.min(820, Math.floor(Number(samples) || 420)));
    const burnVal = Math.max(40, Math.min(500, Math.floor(Number(burn) || 200)));
    const plotVal = Math.max(40, Math.min(260, Math.floor(Number(plotSteps) || 120)));

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(253,251,248,0.98)";
    ctx.fillRect(0, 0, width, height);

    const mapFn = (r: number, x: number) =>
      mapType === "logistic" ? r * x * (1 - x) : r * (x < 0.5 ? x : 1 - x);
    const derivFn = (r: number, x: number) =>
      mapType === "logistic" ? r * (1 - 2 * x) : r * (x < 0.5 ? 1 : -1);

    const rMin = mapType === "logistic" ? 2.4 : 1.0;
    const rMax = mapType === "logistic" ? 4.0 : 2.0;

    for (let i = 0; i < samplesVal; i += 1) {
      const r = rMin + (rMax - rMin) * (i / (samplesVal - 1));
      let x = 0.2;
      let lyap = 0;
      for (let b = 0; b < burnVal; b += 1) {
        x = mapFn(r, x);
      }
      if (mode === "bifurcation") {
        ctx.fillStyle = "rgba(29,78,216,0.65)";
        for (let k = 0; k < plotVal; k += 1) {
          x = mapFn(r, x);
          const px = Math.floor((i / samplesVal) * width);
          const py = Math.floor((1 - x) * (height - 1));
          ctx.fillRect(px, py, 1, 1);
        }
      } else {
        for (let k = 0; k < plotVal; k += 1) {
          x = mapFn(r, x);
          const deriv = Math.abs(derivFn(r, x)) + 1e-6;
          lyap += Math.log(deriv);
        }
        const lambda = lyap / plotVal;
        const t = Math.max(-1, Math.min(1, lambda / 1.2));
        const color = t >= 0 ? `rgba(239,68,68,${0.2 + 0.6 * t})` : `rgba(14,116,144,${0.2 + 0.6 * -t})`;
        const px = Math.floor((i / samplesVal) * width);
        ctx.fillStyle = color;
        ctx.fillRect(px, 0, 1, height);
      }
    }

    ctx.strokeStyle = "rgba(15,23,42,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }, [mapType, mode, samples, burn, plotSteps]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Parameter Sweep Engine</div>
      <div className="demo-grid">
        <label className="field">
          <span>Map</span>
          <select value={mapType} onChange={(event) => setMapType(event.target.value as "logistic" | "tent")}>
            <option value="logistic">Logistic</option>
            <option value="tent">Tent</option>
          </select>
        </label>
        <label className="field">
          <span>Mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as "bifurcation" | "lyapunov")}>
            <option value="bifurcation">Bifurcation</option>
            <option value="lyapunov">Lyapunov map</option>
          </select>
        </label>
        <label className="field">
          <span>Samples</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="10" />
        </label>
        <label className="field">
          <span>Burn-in</span>
          <input type="number" value={burn} onChange={(event) => setBurn(event.target.value)} step="10" />
        </label>
        <label className="field">
          <span>Plot steps</span>
          <input type="number" value={plotSteps} onChange={(event) => setPlotSteps(event.target.value)} step="10" />
        </label>
      </div>
      <canvas ref={canvasRef} aria-label="parameter sweep plot" />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InitType = "gaussian" | "hotspot" | "stripe" | "checker";
type BoundaryType = "fixed" | "periodic";
type Palette = "thermal" | "viridis" | "ice";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sampleColor = (t: number, palette: Palette) => {
  const stops =
    palette === "viridis"
      ? [
          { t: 0, c: [0.267, 0.005, 0.329] },
          { t: 0.25, c: [0.283, 0.141, 0.458] },
          { t: 0.5, c: [0.254, 0.265, 0.53] },
          { t: 0.75, c: [0.207, 0.372, 0.553] },
          { t: 1, c: [0.993, 0.906, 0.144] }
        ]
      : palette === "ice"
        ? [
            { t: 0, c: [0.05, 0.12, 0.3] },
            { t: 0.3, c: [0.12, 0.35, 0.65] },
            { t: 0.6, c: [0.2, 0.7, 0.85] },
            { t: 1, c: [0.85, 0.96, 0.98] }
          ]
        : [
            { t: 0, c: [0.1, 0.25, 0.95] },
            { t: 0.25, c: [0.1, 0.8, 0.95] },
            { t: 0.5, c: [0.2, 0.9, 0.35] },
            { t: 0.75, c: [0.95, 0.85, 0.2] },
            { t: 1, c: [0.92, 0.2, 0.2] }
          ];
  const clamped = clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t || 1);
      return [
        a.c[0] + (b.c[0] - a.c[0]) * localT,
        a.c[1] + (b.c[1] - a.c[1]) * localT,
        a.c[2] + (b.c[2] - a.c[2]) * localT
      ];
    }
  }
  return stops[stops.length - 1].c;
};

export function HeatmapPDE2D() {
  const [n, setN] = useState("30");
  const [alpha, setAlpha] = useState("0.8");
  const [dt, setDt] = useState("0.001");
  const [steps, setSteps] = useState("120");
  const [initType, setInitType] = useState<InitType>("gaussian");
  const [centerX, setCenterX] = useState("0.5");
  const [centerY, setCenterY] = useState("0.5");
  const [width, setWidth] = useState("0.15");
  const [amplitude, setAmplitude] = useState("1");
  const [baseline, setBaseline] = useState("0");
  const [boundary, setBoundary] = useState<BoundaryType>("fixed");
  const [sourceStrength, setSourceStrength] = useState("0");
  const [palette, setPalette] = useState<Palette>("thermal");
  const [autoRange, setAutoRange] = useState(true);
  const [rangeMin, setRangeMin] = useState("0");
  const [rangeMax, setRangeMax] = useState("1");
  const [showGrid, setShowGrid] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [vectorStride, setVectorStride] = useState("4");
  const [vectorScale, setVectorScale] = useState("0.8");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { grid, min, max, r, stable, timeUsed, dtMax, dtSuggested } = useMemo(() => {
    const nVal = clamp(Math.floor(Number(n)), 12, 70);
    const alphaVal = Number(alpha);
    const dtVal = Number(dt);
    const stepsVal = clamp(Math.floor(Number(steps)), 20, 400);
    const ampVal = Number(amplitude);
    const baseVal = Number(baseline);
    const cx = Number(centerX);
    const cy = Number(centerY);
    const widthVal = Math.max(1e-4, Number(width));
    const srcVal = Number(sourceStrength);
    if (!Number.isFinite(alphaVal) || !Number.isFinite(dtVal)) {
      return { grid: [], min: 0, max: 1, r: NaN, stable: false, timeUsed: 0, dtMax: NaN, dtSuggested: NaN };
    }
    const dx = 1 / (nVal - 1);
    const rVal = (alphaVal * dtVal) / (dx * dx);
    const dtMaxVal = alphaVal > 0 ? (0.25 * dx * dx) / alphaVal : NaN;
    const dtSuggestedVal = Number.isFinite(dtMaxVal) ? dtMaxVal * 0.8 : NaN;
    let u = Array.from({ length: nVal }, (_, i) =>
      Array.from({ length: nVal }, (_, j) => {
        const x = i / (nVal - 1);
        const y = j / (nVal - 1);
        if (initType === "hotspot") {
          const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          return baseVal + (d <= widthVal ? ampVal : 0);
        }
        if (initType === "stripe") {
          return baseVal + (Math.abs(x - cx) <= widthVal * 0.5 ? ampVal : 0);
        }
        if (initType === "checker") {
          return baseVal + ((i + j) % 2 === 0 ? ampVal * 0.7 : ampVal * 0.1);
        }
        const gx = (x - cx) / widthVal;
        const gy = (y - cy) / widthVal;
        return baseVal + ampVal * Math.exp(-0.5 * (gx * gx + gy * gy));
      })
    );
    let next = Array.from({ length: nVal }, () => Array(nVal).fill(0));

    for (let step = 0; step < stepsVal; step += 1) {
      for (let i = 0; i < nVal; i += 1) {
        for (let j = 0; j < nVal; j += 1) {
          const up = boundary === "periodic" ? u[(i - 1 + nVal) % nVal][j] : i === 0 ? baseVal : u[i - 1][j];
          const down = boundary === "periodic" ? u[(i + 1) % nVal][j] : i === nVal - 1 ? baseVal : u[i + 1][j];
          const left = boundary === "periodic" ? u[i][(j - 1 + nVal) % nVal] : j === 0 ? baseVal : u[i][j - 1];
          const right = boundary === "periodic" ? u[i][(j + 1) % nVal] : j === nVal - 1 ? baseVal : u[i][j + 1];
          next[i][j] = u[i][j] + rVal * (up + down + left + right - 4 * u[i][j]);
          if (srcVal > 0) {
            const x = i / (nVal - 1);
            const y = j / (nVal - 1);
            const gx = (x - cx) / widthVal;
            const gy = (y - cy) / widthVal;
            next[i][j] += srcVal * Math.exp(-0.5 * (gx * gx + gy * gy)) * dtVal;
          }
        }
      }
      const temp = u;
      u = next;
      next = temp;
    }

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < nVal; i += 1) {
      for (let j = 0; j < nVal; j += 1) {
        const val = u[i][j];
        minVal = Math.min(minVal, val);
        maxVal = Math.max(maxVal, val);
      }
    }
    return {
      grid: u,
      min: minVal,
      max: maxVal,
      r: rVal,
      stable: rVal <= 0.25,
      timeUsed: stepsVal * dtVal,
      dtMax: dtMaxVal,
      dtSuggested: dtSuggestedVal
    };
  }, [n, alpha, dt, steps, initType, centerX, centerY, width, amplitude, baseline, boundary, sourceStrength]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const nVal = grid.length;
    const cell = size / nVal;
    let minRange = autoRange ? min : Number(rangeMin);
    let maxRange = autoRange ? max : Number(rangeMax);
    if (!Number.isFinite(minRange)) {
      minRange = min;
    }
    if (!Number.isFinite(maxRange)) {
      maxRange = max;
    }
    if (minRange === maxRange) {
      maxRange = minRange + 1;
    }
    const span = maxRange - minRange || 1;
    for (let i = 0; i < nVal; i += 1) {
      for (let j = 0; j < nVal; j += 1) {
        const t = (grid[i][j] - minRange) / span;
        const [rC, gC, bC] = sampleColor(t, palette);
        ctx.fillStyle = `rgb(${Math.round(rC * 255)}, ${Math.round(gC * 255)}, ${Math.round(bC * 255)})`;
        ctx.fillRect(j * cell, i * cell, cell, cell);
      }
    }

    if (showGrid) {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= nVal; i += 1) {
        const x = i * cell;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
        const y = i * cell;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
    }

    if (showVectors && nVal > 2) {
      const stride = clamp(Math.floor(Number(vectorStride)), 2, 12);
      const scaleVal = clamp(Number(vectorScale), 0.2, 2);
      let maxGrad = 1e-6;
      for (let i = 1; i < nVal - 1; i += stride) {
        for (let j = 1; j < nVal - 1; j += stride) {
          const gx = (grid[i + 1][j] - grid[i - 1][j]) / 2;
          const gy = (grid[i][j + 1] - grid[i][j - 1]) / 2;
          const g = Math.sqrt(gx * gx + gy * gy);
          maxGrad = Math.max(maxGrad, g);
        }
      }
      ctx.strokeStyle = "rgba(15, 118, 110, 0.7)";
      ctx.lineWidth = 1.4;
      for (let i = 1; i < nVal - 1; i += stride) {
        for (let j = 1; j < nVal - 1; j += stride) {
          const gx = (grid[i + 1][j] - grid[i - 1][j]) / 2;
          const gy = (grid[i][j + 1] - grid[i][j - 1]) / 2;
          const mag = Math.sqrt(gx * gx + gy * gy) || 1;
          const nx = -gx / mag;
          const ny = -gy / mag;
          const len = (mag / maxGrad) * cell * 2.4 * scaleVal;
          const cx = j * cell + cell * 0.5;
          const cy = i * cell + cell * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + nx * len, cy + ny * len);
          ctx.stroke();
        }
      }
    }
  }, [grid, min, max, palette, autoRange, rangeMin, rangeMax, showGrid, showVectors, vectorStride, vectorScale]);

  return (
    <div className="demo-panel">
      <div className="demo-title">2D Heat Diffusion</div>
      <div className="demo-grid">
        <label className="field">
          <span>grid size</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>alpha</span>
          <input type="number" value={alpha} onChange={(event) => setAlpha(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>init</span>
          <select value={initType} onChange={(event) => setInitType(event.target.value as InitType)}>
            <option value="gaussian">Gaussian</option>
            <option value="hotspot">Hot spot</option>
            <option value="stripe">Stripe</option>
            <option value="checker">Checker</option>
          </select>
        </label>
        <label className="field">
          <span>center x</span>
          <input type="number" value={centerX} onChange={(event) => setCenterX(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>center y</span>
          <input type="number" value={centerY} onChange={(event) => setCenterY(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>width</span>
          <input type="number" value={width} onChange={(event) => setWidth(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>amplitude</span>
          <input type="number" value={amplitude} onChange={(event) => setAmplitude(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>baseline</span>
          <input type="number" value={baseline} onChange={(event) => setBaseline(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>boundary</span>
          <select value={boundary} onChange={(event) => setBoundary(event.target.value as BoundaryType)}>
            <option value="fixed">Fixed</option>
            <option value="periodic">Periodic</option>
          </select>
        </label>
        <label className="field">
          <span>source strength</span>
          <input type="number" value={sourceStrength} onChange={(event) => setSourceStrength(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>palette</span>
          <select value={palette} onChange={(event) => setPalette(event.target.value as Palette)}>
            <option value="thermal">Thermal</option>
            <option value="viridis">Viridis</option>
            <option value="ice">Ice</option>
          </select>
        </label>
        <label className="field">
          <span>auto range</span>
          <select value={autoRange ? "on" : "off"} onChange={(event) => setAutoRange(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>range min</span>
          <input type="number" value={rangeMin} onChange={(event) => setRangeMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>range max</span>
          <input type="number" value={rangeMax} onChange={(event) => setRangeMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>grid overlay</span>
          <select value={showGrid ? "on" : "off"} onChange={(event) => setShowGrid(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>heat flux vectors</span>
          <select value={showVectors ? "on" : "off"} onChange={(event) => setShowVectors(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>vector stride</span>
          <input type="number" value={vectorStride} onChange={(event) => setVectorStride(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>vector scale</span>
          <input type="number" value={vectorScale} onChange={(event) => setVectorScale(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">r = {Number.isFinite(r) ? r.toFixed(4) : "--"}</span>
          <span className={`pill ${stable ? "pill-good" : "pill-bad"}`}>stable: {stable ? "yes" : "no"}</span>
          <span className="pill">min = {Number.isFinite(min) ? min.toFixed(3) : "--"}</span>
          <span className="pill">max = {Number.isFinite(max) ? max.toFixed(3) : "--"}</span>
          <span className="pill">time used = {Number.isFinite(timeUsed) ? timeUsed.toFixed(3) : "--"} s</span>
          <span className="pill">dt max = {Number.isFinite(dtMax) ? dtMax.toExponential(2) : "--"}</span>
        </div>
      </div>
      <div className="control-row">
        <button
          type="button"
          className="control-button ghost"
          onClick={() => {
            if (Number.isFinite(dtSuggested)) {
              setDt(Number(dtSuggested).toExponential(3));
            }
          }}
        >
          Use stable dt
        </button>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} className="heatmap-canvas" />
      </div>
      <div className="demo-note">Explicit 2D heat update with selectable boundaries and sources.</div>
    </div>
  );
}

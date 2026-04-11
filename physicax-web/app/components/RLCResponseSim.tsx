"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function RLCResponseSim() {
  const [r, setR] = useState("10");
  const [l, setL] = useState("0.5");
  const [c, setC] = useState("0.02");
  const [v0, setV0] = useState("5");
  const [driveMode, setDriveMode] = useState<"step" | "sine" | "free">("step");
  const [driveAmp, setDriveAmp] = useState("5");
  const [driveFreq, setDriveFreq] = useState("1");
  const [q0, setQ0] = useState("0");
  const [i0, setI0] = useState("0");
  const [dt, setDt] = useState("0.01");
  const [duration, setDuration] = useState("8");
  const [isPlaying, setIsPlaying] = useState(false);
  const [markerTime, setMarkerTime] = useState(0);
  const lastRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { current, capacitor, energy, zeta, omega0, driveOmega, freqResponse } = useMemo(() => {
    const rVal = Number(r);
    const lVal = Number(l);
    const cVal = Number(c);
    const vVal = Number(v0);
    const driveAmpVal = Number(driveAmp);
    const driveFreqVal = Number(driveFreq);
    const q0Val = Number(q0);
    const i0Val = Number(i0);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (!Number.isFinite(rVal) || !Number.isFinite(lVal) || !Number.isFinite(cVal) || !Number.isFinite(vVal)) {
      return { current: [], capacitor: [], energy: [], zeta: NaN, omega0: NaN, driveOmega: NaN, freqResponse: [] };
    }
    if (lVal <= 0 || cVal <= 0 || dtVal <= 0 || durVal <= 0) {
      return { current: [], capacitor: [], energy: [], zeta: NaN, omega0: NaN, driveOmega: NaN, freqResponse: [] };
    }
    const steps = Math.min(3000, Math.max(10, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    let q = Number.isFinite(q0Val) ? q0Val : 0;
    let i = Number.isFinite(i0Val) ? i0Val : 0;
    const currentPts: { x: number; y: number }[] = [];
    const capPts: { x: number; y: number }[] = [];
    const energyPts: { x: number; y: number }[] = [];
    const driveOmegaVal = 2 * Math.PI * (Number.isFinite(driveFreqVal) ? driveFreqVal : 0);
    const driveAt = (t: number) =>
      driveMode === "free"
        ? 0
        : driveMode === "step"
          ? vVal
          : (Number.isFinite(driveAmpVal) ? driveAmpVal : 0) * Math.sin(driveOmegaVal * t);
    const di = (t: number, qVal: number, iVal: number) => (driveAt(t) - rVal * iVal - qVal / cVal) / lVal;

    let t = 0;
    for (let step = 0; step <= steps; step += 1) {
      currentPts.push({ x: t, y: i });
      capPts.push({ x: t, y: q / cVal });
      const energyVal = 0.5 * lVal * i * i + 0.5 * (q * q) / cVal;
      energyPts.push({ x: t, y: energyVal });

      const k1q = i;
      const k1i = di(t, q, i);
      const k2q = i + 0.5 * dtStep * k1i;
      const k2i = di(t + 0.5 * dtStep, q + 0.5 * dtStep * k1q, i + 0.5 * dtStep * k1i);
      const k3q = i + 0.5 * dtStep * k2i;
      const k3i = di(t + 0.5 * dtStep, q + 0.5 * dtStep * k2q, i + 0.5 * dtStep * k2i);
      const k4q = i + dtStep * k3i;
      const k4i = di(t + dtStep, q + dtStep * k3q, i + dtStep * k3i);

      q += (dtStep / 6) * (k1q + 2 * k2q + 2 * k3q + k4q);
      i += (dtStep / 6) * (k1i + 2 * k2i + 2 * k3i + k4i);
      t += dtStep;
    }

    const omega0Val = 1 / Math.sqrt(lVal * cVal);
    const zetaVal = rVal / (2 * lVal * omega0Val);
    const ampVal = Number.isFinite(driveAmpVal) ? driveAmpVal : vVal;
    const f0 = omega0Val / (2 * Math.PI);
    const fMin = Number.isFinite(f0) ? Math.max(0.1, f0 * 0.2) : 0.1;
    const fMax = Number.isFinite(f0) ? f0 * 3 : 5;
    const freqPts: { x: number; y: number }[] = [];
    const freqSteps = 140;
    for (let i = 0; i <= freqSteps; i += 1) {
      const f = fMin + (fMax - fMin) * (i / freqSteps);
      const w = 2 * Math.PI * f;
      const react = w * lVal - 1 / (w * cVal);
      const denom = Math.sqrt(rVal * rVal + react * react);
      const amp = denom > 0 ? ampVal / denom : 0;
      freqPts.push({ x: f, y: amp });
    }
    return {
      current: currentPts,
      capacitor: capPts,
      energy: energyPts,
      zeta: zetaVal,
      omega0: omega0Val,
      driveOmega: driveOmegaVal,
      freqResponse: freqPts
    };
  }, [r, l, c, v0, driveAmp, driveFreq, q0, i0, dt, duration, driveMode]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const step = (now: number) => {
      const last = lastRef.current ?? now;
      const dtSec = (now - last) / 1000;
      lastRef.current = now;
      setMarkerTime((prev) => (prev + dtSec) % Number(duration));
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || current.length === 0 || capacitor.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 320;
    const height = 160;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const index = Math.min(
      current.length - 1,
      Math.max(0, Math.floor((markerTime / Number(duration)) * current.length))
    );
    const iVal = current[index]?.y ?? 0;
    const vCap = capacitor[index]?.y ?? 0;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 80);
    ctx.lineTo(90, 80);
    ctx.stroke();

    ctx.strokeStyle = "#6b7280";
    ctx.beginPath();
    ctx.moveTo(90, 60);
    ctx.lineTo(90, 100);
    ctx.moveTo(110, 60);
    ctx.lineTo(110, 100);
    ctx.stroke();

    const vMax = driveMode === "step" ? Number(v0) || 1 : Number(driveAmp) || 1;
    const ratio = Math.max(0, Math.min(1, Math.abs(vCap) / vMax));
    ctx.fillStyle = "rgba(59,130,246,0.35)";
    ctx.fillRect(90, 60 + (1 - ratio) * 40, 20, ratio * 40);

    ctx.strokeStyle = "#1f2937";
    ctx.beginPath();
    ctx.moveTo(110, 80);
    ctx.lineTo(220, 80);
    ctx.stroke();

    const arrow = Math.max(-1, Math.min(1, iVal));
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 120);
    ctx.lineTo(60 + 60 * arrow, 120);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60 + 60 * arrow, 120);
    ctx.lineTo(60 + 60 * arrow - 8, 114);
    ctx.lineTo(60 + 60 * arrow - 8, 126);
    ctx.closePath();
    ctx.fillStyle = "#d97706";
    ctx.fill();
  }, [current, capacitor, markerTime, duration, v0, driveAmp, driveMode]);

  const regime = Number.isFinite(zeta)
    ? zeta < 1
      ? "underdamped"
      : zeta === 1
        ? "critical"
        : "overdamped"
    : "--";

  return (
    <div className="demo-panel">
      <div className="demo-title">RLC Step / Driven Response</div>
      <div className="demo-grid">
        <label className="field">
          <span>R (ohm)</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>L (H)</span>
          <input type="number" value={l} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>C (F)</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V0 (V)</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Drive</span>
          <select value={driveMode} onChange={(event) => setDriveMode(event.target.value as "step" | "sine" | "free")}>
            <option value="step">Step</option>
            <option value="sine">Sine</option>
            <option value="free">Free</option>
          </select>
        </label>
        <label className="field">
          <span>Drive Amp (V)</span>
          <input type="number" value={driveAmp} onChange={(event) => setDriveAmp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Drive f (Hz)</span>
          <input type="number" value={driveFreq} onChange={(event) => setDriveFreq(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>q(0) (C)</span>
          <input type="number" value={q0} onChange={(event) => setQ0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>i(0) (A)</span>
          <input type="number" value={i0} onChange={(event) => setI0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt (s)</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration (s)</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">zeta = {Number.isFinite(zeta) ? zeta.toFixed(2) : "--"}</span>
          <span className="pill">regime: {regime}</span>
          <span className="pill">
            f0 = {Number.isFinite(omega0) ? (omega0 / (2 * Math.PI)).toFixed(2) : "--"} Hz
          </span>
          <span className="pill">
            Q = {Number.isFinite(zeta) && zeta > 0 ? (1 / (2 * zeta)).toFixed(2) : "--"}
          </span>
        </div>
        <div className="demo-note">
          <MathInline
            latex={String.raw`L q'' + R q' + \frac{1}{C} q = V(t),\; V(t)=V_0 \text{ or } V_d\sin(\omega t)`}
          />
        </div>
        {Number.isFinite(omega0) && Number(dt) > 0.2 * (1 / omega0) ? (
          <div className="demo-note">Warning: timestep may be too large for stable oscillations.</div>
        ) : null}
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => setMarkerTime(0)}>
          Reset
        </button>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} />
      </div>
      <PlotCanvas
        series={[
          { id: "current", points: current, color: "#0b7285", label: "current i(t)" },
          { id: "cap", points: capacitor, color: "#d97706", label: "V_c(t)" }
        ]}
        xLabel="t"
        yLabel="response"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "energy", points: energy, color: "#16a34a", label: "energy" }]}
        xLabel="t"
        yLabel="E"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "freq", points: freqResponse, color: "#2563eb", label: "|I(ω)|" }]}
        xLabel="f (Hz)"
        yLabel="current amplitude"
        showLegend
      />
    </div>
  );
}

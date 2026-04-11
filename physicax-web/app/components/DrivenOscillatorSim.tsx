"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function DrivenOscillatorSim() {
  const [omega0, setOmega0] = useState("3");
  const [gamma, setGamma] = useState("0.2");
  const [drive, setDrive] = useState("2.5");
  const [force, setForce] = useState("1");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("16");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState("1");
  const [showVelocity, setShowVelocity] = useState(true);
  const [showForces, setShowForces] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { response, velocity, energy, resonance, ampSS, phaseLag, qFactor } = useMemo(() => {
    const omega0Val = Number(omega0);
    const gammaVal = Number(gamma);
    const driveVal = Number(drive);
    const forceVal = Number(force);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (
      !Number.isFinite(omega0Val) ||
      !Number.isFinite(gammaVal) ||
      !Number.isFinite(driveVal) ||
      !Number.isFinite(forceVal)
    ) {
      return { response: [], velocity: [], energy: [], resonance: [], ampSS: NaN, phaseLag: NaN, qFactor: NaN };
    }
    if (dtVal <= 0 || durVal <= 0) {
      return { response: [], velocity: [], energy: [], resonance: [], ampSS: NaN, phaseLag: NaN, qFactor: NaN };
    }
    const steps = Math.min(2600, Math.max(10, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    let x = 0;
    let v = 0;
    const pts: { x: number; y: number }[] = [];
    const velPts: { x: number; y: number }[] = [];
    const energyPts: { x: number; y: number }[] = [];

    const accel = (t: number, xVal: number, vVal: number) => {
      return forceVal * Math.cos(driveVal * t) - 2 * gammaVal * vVal - omega0Val * omega0Val * xVal;
    };

    let t = 0;
    for (let i = 0; i <= steps; i += 1) {
      pts.push({ x: t, y: x });
      velPts.push({ x: t, y: v });
      energyPts.push({ x: t, y: 0.5 * v * v + 0.5 * omega0Val * omega0Val * x * x });

      const k1x = v;
      const k1v = accel(t, x, v);

      const k2x = v + 0.5 * dtStep * k1v;
      const k2v = accel(t + 0.5 * dtStep, x + 0.5 * dtStep * k1x, v + 0.5 * dtStep * k1v);

      const k3x = v + 0.5 * dtStep * k2v;
      const k3v = accel(t + 0.5 * dtStep, x + 0.5 * dtStep * k2x, v + 0.5 * dtStep * k2v);

      const k4x = v + dtStep * k3v;
      const k4v = accel(t + dtStep, x + dtStep * k3x, v + dtStep * k3v);

      x += (dtStep / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      v += (dtStep / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      t += dtStep;
    }

    const resonancePts: { x: number; y: number }[] = [];
    const wMin = 0.2;
    const wMax = Math.max(omega0Val * 2, 4);
    const samples = 140;
    for (let i = 0; i <= samples; i += 1) {
      const w = wMin + ((wMax - wMin) * i) / samples;
      const denom = Math.sqrt(Math.pow(omega0Val * omega0Val - w * w, 2) + Math.pow(2 * gammaVal * w, 2));
      const amp = denom === 0 ? 0 : forceVal / denom;
      resonancePts.push({ x: w, y: amp });
    }

    const denom = Math.sqrt(
      Math.pow(omega0Val * omega0Val - driveVal * driveVal, 2) + Math.pow(2 * gammaVal * driveVal, 2)
    );
    const ampVal = denom === 0 ? NaN : forceVal / denom;
    const phaseVal = Math.atan2(2 * gammaVal * driveVal, omega0Val * omega0Val - driveVal * driveVal);
    const qVal = gammaVal > 0 ? omega0Val / (2 * gammaVal) : NaN;

    return {
      response: pts,
      velocity: velPts,
      energy: energyPts,
      resonance: resonancePts,
      ampSS: ampVal,
      phaseLag: phaseVal,
      qFactor: qVal
    };
  }, [omega0, gamma, drive, force, dt, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || response.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 520;
    const height = 180;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const restX = width * 0.5;
    const wallX = 60;
    const baseY = height * 0.5;
    const maxAmp = Math.max(0.4, ...response.map((p) => Math.abs(p.y)));
    const scale = 120 / maxAmp;
    const maxEnergy = Math.max(1e-3, ...energy.map((p) => p.y));

    const drawSpring = (start: number, end: number) => {
      const coils = 10;
      const amp = 10;
      const len = end - start;
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start, baseY);
      for (let i = 1; i <= coils; i += 1) {
        const x = start + (len * i) / coils;
        const y = baseY + (i % 2 === 0 ? amp : -amp);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(end, baseY);
      ctx.stroke();
    };

    const drawArrow = (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const head = Math.min(8, len * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - (ux * head - uy * head * 0.6), to.y - (uy * head + ux * head * 0.6));
      ctx.lineTo(to.x - (ux * head + uy * head * 0.6), to.y - (uy * head - ux * head * 0.6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const draw = (index: number) => {
      const point = response[index];
      const t = point?.x ?? 0;
      const x = point?.y ?? 0;
      const massX = restX + x * scale;
      const forceVal = Number(force);
      const driveVal = Number(drive);
      const f = Number.isFinite(forceVal) && Number.isFinite(driveVal) ? forceVal * Math.cos(driveVal * t) : 0;
      const v = velocity[index]?.y ?? 0;
      const e = energy[index]?.y ?? 0;
      const springF = -(Number(omega0) || 0) * (Number(omega0) || 0) * x;
      const dampingF = -2 * (Number(gamma) || 0) * v;

      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "rgba(255,255,255,0.98)");
      bg.addColorStop(1, "rgba(240,244,248,0.95)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(15,23,42,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallX, baseY - 30);
      ctx.lineTo(wallX, baseY + 30);
      ctx.stroke();

      drawSpring(wallX, massX - 24);

      const massGrad = ctx.createLinearGradient(massX - 24, baseY - 20, massX + 24, baseY + 20);
      massGrad.addColorStop(0, "#0b7285");
      massGrad.addColorStop(1, "#0f766e");
      ctx.fillStyle = massGrad;
      ctx.fillRect(massX - 24, baseY - 20, 48, 40);

      if (showForces) {
        drawArrow({ x: massX, y: baseY - 44 }, { x: massX + f * 18, y: baseY - 44 }, "#f59e0b");
        drawArrow({ x: massX, y: baseY + 44 }, { x: massX + springF * 8, y: baseY + 44 }, "#dc2626");
        drawArrow({ x: massX, y: baseY + 62 }, { x: massX + dampingF * 8, y: baseY + 62 }, "#64748b");
      }

      if (showVelocity) {
        drawArrow({ x: massX, y: baseY + 22 }, { x: massX + v * 12, y: baseY + 22 }, "#2563eb");
      }

      const barX = width - 46;
      const barY = 20;
      const barH = 90;
      ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
      ctx.fillRect(barX, barY, 12, barH);
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(barX, barY + barH - (e / maxEnergy) * barH, 12, (e / maxEnergy) * barH);
      ctx.fillStyle = "#475569";
      ctx.font = "11px 'Geist', sans-serif";
      ctx.fillText("E", barX + 2, barY + barH + 14);
    };

    const totalTime = response[response.length - 1]?.x ?? 1;
    const step = (now: number) => {
      if (!isPlaying) {
        const idx = Math.min(response.length - 1, Math.floor((timeRef.current / totalTime) * response.length));
        draw(idx);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtSec = (now - lastTime) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      timeRef.current = (timeRef.current + dtSec * (Number.isFinite(rate) ? rate : 1)) % totalTime;
      const idx = Math.min(response.length - 1, Math.floor((timeRef.current / totalTime) * response.length));
      draw(idx);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [response, velocity, energy, force, drive, isPlaying, speed, showVelocity, showForces, omega0, gamma]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Driven Oscillator</div>
      <div className="demo-grid">
        <label className="field">
          <span>omega0</span>
          <input type="number" value={omega0} onChange={(event) => setOmega0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>drive omega</span>
          <input type="number" value={drive} onChange={(event) => setDrive(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>F0/m</span>
          <input type="number" value={force} onChange={(event) => setForce(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>playback speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>velocity arrow</span>
          <select value={showVelocity ? "on" : "off"} onChange={(event) => setShowVelocity(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>forces</span>
          <select value={showForces ? "on" : "off"} onChange={(event) => setShowForces(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">steady A = {Number.isFinite(ampSS) ? ampSS.toFixed(3) : "--"}</span>
          <span className="pill">phase lag = {Number.isFinite(phaseLag) ? phaseLag.toFixed(2) : "--"} rad</span>
          <span className="pill">Q = {Number.isFinite(qFactor) ? qFactor.toFixed(2) : "--"}</span>
        </div>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => (timeRef.current = 0)}>
          Reset
        </button>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} />
      </div>
      <PlotCanvas series={[{ id: "x", points: response, color: "#0b7285", label: "x(t)" }]} xLabel="t" yLabel="x" showLegend />
      <PlotCanvas
        series={[{ id: "v", points: velocity, color: "#2563eb", label: "v(t)" }]}
        xLabel="t"
        yLabel="v"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "e", points: energy, color: "#16a34a", label: "energy" }]}
        xLabel="t"
        yLabel="E"
        showLegend
      />
      <div className="demo-note">
        <MathInline latex={String.raw`x'' + 2\gamma x' + \omega_0^2 x = \frac{F_0}{m}\cos(\omega t)`} />
      </div>
      <PlotCanvas
        series={[{ id: "amp", points: resonance, color: "#d97706", fill: true, label: "A(omega)" }]}
        xLabel="drive omega"
        yLabel="A(omega)"
        showLegend
      />
    </div>
  );
}

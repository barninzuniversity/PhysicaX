"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function SHMSim() {
  const [a, setA] = useState("1");
  const [k, setK] = useState("4");
  const [m, setM] = useState("1");
  const [phase, setPhase] = useState("0");
  const [duration, setDuration] = useState("10");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState("1");
  const [showVelocity, setShowVelocity] = useState(true);
  const [showForce, setShowForce] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { points, velocitySeries, energySeries, phaseSeries, omega, period, vmax, energyTotal } = useMemo(() => {
    const aVal = Number(a);
    const kVal = Number(k);
    const mVal = Number(m);
    const phaseVal = Number(phase);
    const tVal = Number(duration);
    if (!Number.isFinite(aVal) || !Number.isFinite(kVal) || !Number.isFinite(mVal) || !Number.isFinite(tVal)) {
      return {
        points: [],
        velocitySeries: [],
        energySeries: [],
        phaseSeries: [],
        omega: NaN,
        period: NaN,
        vmax: NaN,
        energyTotal: NaN
      };
    }
    if (mVal <= 0 || kVal <= 0 || tVal <= 0) {
      return {
        points: [],
        velocitySeries: [],
        energySeries: [],
        phaseSeries: [],
        omega: NaN,
        period: NaN,
        vmax: NaN,
        energyTotal: NaN
      };
    }
    const omegaVal = Math.sqrt(kVal / mVal);
    const periodVal = (2 * Math.PI) / omegaVal;
    const steps = 360;
    const dt = tVal / steps;
    const pts: { x: number; y: number }[] = [];
    const velPts: { x: number; y: number }[] = [];
    const energyPts: { x: number; y: number }[] = [];
    const phasePts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i * dt;
      const x = aVal * Math.cos(omegaVal * t + phaseVal);
      const v = -aVal * omegaVal * Math.sin(omegaVal * t + phaseVal);
      const e = 0.5 * kVal * x * x + 0.5 * mVal * v * v;
      pts.push({ x: t, y: x });
      velPts.push({ x: t, y: v });
      energyPts.push({ x: t, y: e });
      phasePts.push({ x, y: v });
    }
    const vmaxVal = Math.abs(aVal * omegaVal);
    const energyVal = 0.5 * kVal * aVal * aVal;
    return {
      points: pts,
      velocitySeries: velPts,
      energySeries: energyPts,
      phaseSeries: phasePts,
      omega: omegaVal,
      period: periodVal,
      vmax: vmaxVal,
      energyTotal: energyVal
    };
  }, [a, k, m, phase, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !Number.isFinite(omega)) {
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

    const aVal = Number(a);
    const phaseVal = Number(phase);
    const kVal = Number(k);
    const mVal = Number(m);
    const scale = aVal !== 0 ? 120 / Math.max(0.2, Math.abs(aVal)) : 1;
    const wallX = 60;
    const restX = width * 0.5;
    const baseY = height * 0.5;

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

    const drawArrow = (from: { x: number; y: number }, to: { x: number; y: number }, color: string, widthPx = 2) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const head = Math.min(8, len * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
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

    const draw = (tNow: number) => {
      const x = aVal * Math.cos(omega * tNow + phaseVal);
      const v = -aVal * omega * Math.sin(omega * tNow + phaseVal);
      const f = -kVal * x;
      const massX = restX + x * scale;

      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "rgba(255,255,255,0.98)");
      bg.addColorStop(1, "rgba(240, 244, 248, 0.95)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(15,23,42,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallX, baseY - 30);
      ctx.lineTo(wallX, baseY + 30);
      ctx.stroke();

      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(restX, baseY - 50);
      ctx.lineTo(restX, baseY + 50);
      ctx.stroke();
      ctx.setLineDash([]);

      if (showTrace) {
        for (let i = 1; i <= 5; i += 1) {
          const tPast = tNow - i * 0.14;
          const xPast = aVal * Math.cos(omega * tPast + phaseVal);
          const ghostX = restX + xPast * scale;
          ctx.fillStyle = `rgba(15, 118, 110, ${0.08 * (6 - i)})`;
          ctx.beginPath();
          ctx.arc(ghostX, baseY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawSpring(wallX, massX - 24);

      const massGrad = ctx.createLinearGradient(massX - 24, baseY - 20, massX + 24, baseY + 20);
      massGrad.addColorStop(0, "#0b7285");
      massGrad.addColorStop(1, "#0f766e");
      ctx.fillStyle = massGrad;
      ctx.fillRect(massX - 24, baseY - 20, 48, 40);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.2)";
      ctx.strokeRect(massX - 24, baseY - 20, 48, 40);

      if (showVelocity) {
        drawArrow(
          { x: massX, y: baseY - 40 },
          { x: massX + v * 0.25 * scale, y: baseY - 40 },
          "#2563eb",
          2.4
        );
      }

      if (showForce) {
        drawArrow(
          { x: massX, y: baseY + 40 },
          { x: massX + f * 0.04 * scale, y: baseY + 40 },
          "#dc2626",
          2.2
        );
      }

      const ke = 0.5 * (Number.isFinite(mVal) ? mVal : 1) * v * v;
      const pe = 0.5 * (Number.isFinite(kVal) ? kVal : 1) * x * x;
      const eTotal = Math.max(ke + pe, 1e-6);
      const barX = width - 48;
      const barY = 24;
      const barH = 100;
      ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
      ctx.fillRect(barX, barY, 10, barH);
      ctx.fillRect(barX + 16, barY, 10, barH);
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(barX, barY + barH * (1 - ke / eTotal), 10, barH * (ke / eTotal));
      ctx.fillStyle = "#d97706";
      ctx.fillRect(barX + 16, barY + barH * (1 - pe / eTotal), 10, barH * (pe / eTotal));
      ctx.fillStyle = "#475569";
      ctx.font = "11px 'Geist', sans-serif";
      ctx.fillText("KE", barX - 2, barY + barH + 14);
      ctx.fillText("PE", barX + 12, barY + barH + 14);
    };

    const step = (now: number) => {
      if (!isPlaying) {
        draw(timeRef.current);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtSec = (now - lastTime) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      timeRef.current = (timeRef.current + dtSec * (Number.isFinite(rate) ? rate : 1)) % Number(duration || 1);
      draw(timeRef.current);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [a, phase, omega, duration, isPlaying, speed, k, m, showVelocity, showForce, showTrace]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Simple Harmonic Motion</div>
      <div className="demo-grid">
        <label className="field">
          <span>A</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>k</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>m</span>
          <input type="number" value={m} onChange={(event) => setM(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>phase (rad)</span>
          <input type="number" value={phase} onChange={(event) => setPhase(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration (s)</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>playback speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>velocity vector</span>
          <select value={showVelocity ? "on" : "off"} onChange={(event) => setShowVelocity(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>spring force</span>
          <select value={showForce ? "on" : "off"} onChange={(event) => setShowForce(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>trace ghosts</span>
          <select value={showTrace ? "on" : "off"} onChange={(event) => setShowTrace(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">omega = {Number.isFinite(omega) ? omega.toFixed(3) : "--"}</span>
          <span className="pill">T = {Number.isFinite(period) ? period.toFixed(3) : "--"} s</span>
          <span className="pill">vmax = {Number.isFinite(vmax) ? vmax.toFixed(3) : "--"} m/s</span>
          <span className="pill">E = {Number.isFinite(energyTotal) ? energyTotal.toFixed(3) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`x(t)=A\cos(\omega t+\phi),\; \omega=\sqrt{k/m}`} />
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
      <PlotCanvas series={[{ id: "shm", points, color: "#d26a2e", label: "x(t)" }]} xLabel="t" yLabel="x" showLegend />
      <PlotCanvas
        series={[{ id: "v", points: velocitySeries, color: "#2563eb", label: "v(t)" }]}
        xLabel="t"
        yLabel="v"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "energy", points: energySeries, color: "#16a34a", label: "energy" }]}
        xLabel="t"
        yLabel="E"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "phase", points: phaseSeries, color: "#0b7285", label: "phase" }]}
        xLabel="x"
        yLabel="v"
        showLegend
      />
    </div>
  );
}

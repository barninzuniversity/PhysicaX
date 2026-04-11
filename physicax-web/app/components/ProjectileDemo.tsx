"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MathInline } from "./MathBlock";

export function ProjectileDemo() {
  const [v0, setV0] = useState("40");
  const [theta, setTheta] = useState("45");
  const [g, setG] = useState("9.80665");
  const [useDrag, setUseDrag] = useState(false);
  const [dragCoeff, setDragCoeff] = useState("0.02");
  const [trailLength, setTrailLength] = useState("120");
  const [showVectors, setShowVectors] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { range, tFlight, hMax, trajectory } = useMemo(() => {
    const vVal = Number(v0);
    const thetaVal = Number(theta);
    const gVal = Number(g);
    const dragVal = Number(dragCoeff);
    if (!Number.isFinite(vVal) || !Number.isFinite(thetaVal) || !Number.isFinite(gVal) || gVal <= 0) {
      return { range: NaN, tFlight: NaN, hMax: NaN, trajectory: [] as { t: number; x: number; y: number; vx: number; vy: number }[] };
    }
    const thetaRad = (thetaVal * Math.PI) / 180;
    const vx0 = vVal * Math.cos(thetaRad);
    const vy0 = vVal * Math.sin(thetaRad);
    if (!useDrag || !Number.isFinite(dragVal) || dragVal <= 0) {
      const rangeVal = (vVal * vVal * Math.sin(2 * thetaRad)) / gVal;
      const tFlightVal = (2 * vVal * Math.sin(thetaRad)) / gVal;
      const hMaxVal = (vVal * vVal * Math.sin(thetaRad) * Math.sin(thetaRad)) / (2 * gVal);
      const steps = 220;
      const pts: { t: number; x: number; y: number; vx: number; vy: number }[] = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = (tFlightVal * i) / steps;
        const x = vx0 * t;
        const y = vy0 * t - 0.5 * gVal * t * t;
        const vx = vx0;
        const vy = vy0 - gVal * t;
        if (y < 0 && i > 0) {
          break;
        }
        pts.push({ t, x, y, vx, vy });
      }
      return { range: rangeVal, tFlight: tFlightVal, hMax: hMaxVal, trajectory: pts };
    }

    const pts: { t: number; x: number; y: number; vx: number; vy: number }[] = [];
    let x = 0;
    let y = 0;
    let vx = vx0;
    let vy = vy0;
    let t = 0;
    const dt = 0.02;
    let hMaxVal = 0;
    for (let i = 0; i < 4000; i += 1) {
      const speed = Math.sqrt(vx * vx + vy * vy);
      const ax = -dragVal * speed * vx;
      const ay = -gVal - dragVal * speed * vy;
      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      t += dt;
      if (y > hMaxVal) {
        hMaxVal = y;
      }
      pts.push({ t, x, y, vx, vy });
      if (y < 0 && t > 0.1) {
        break;
      }
    }
    const last = pts[pts.length - 1];
    return {
      range: last?.x ?? NaN,
      tFlight: last?.t ?? NaN,
      hMax: hMaxVal,
      trajectory: pts
    };
  }, [v0, theta, g, useDrag, dragCoeff]);

  const rangeText = Number.isFinite(range) ? `${range.toFixed(2)} m` : "--";
  const tText = Number.isFinite(tFlight) ? `${tFlight.toFixed(2)} s` : "--";
  const hText = Number.isFinite(hMax) ? `${hMax.toFixed(2)} m` : "--";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || trajectory.length === 0 || !Number.isFinite(tFlight)) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 520;
    const height = 260;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const maxX = Math.max(...trajectory.map((p) => p.x), 1);
    const maxY = Math.max(...trajectory.map((p) => p.y), 1);
    const pad = 24;
    const scale = Math.min((width - 2 * pad) / maxX, (height - 2 * pad) / maxY);
    const trailCount = Math.max(12, Math.min(trajectory.length, Math.floor(Number(trailLength) || 120)));

    const draw = (tNow: number) => {
      if (!trajectory.length) {
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(15,23,42,0.2)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(pad, height - pad);
      ctx.lineTo(width - pad, height - pad);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#0b7285";
      ctx.lineWidth = 2;
      ctx.beginPath();
      trajectory.forEach((p, idx) => {
        const x = pad + p.x * scale;
        const y = height - pad - p.y * scale;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const safeFlight = Number.isFinite(tFlight) && tFlight > 0 ? tFlight : 1;
      const rawIndex = Math.floor((tNow / safeFlight) * trajectory.length);
      const maxIndex = Math.max(0, trajectory.length - 1);
      const index = Math.min(maxIndex, Math.max(0, Number.isFinite(rawIndex) ? rawIndex : 0));

      const trailStart = Math.max(0, index - trailCount);
      if (trailStart < index) {
        ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = trailStart; i <= index; i += 1) {
          const tp = trajectory[i];
          const tx = pad + tp.x * scale;
          const ty = height - pad - tp.y * scale;
          if (i === trailStart) {
            ctx.moveTo(tx, ty);
          } else {
            ctx.lineTo(tx, ty);
          }
        }
        ctx.stroke();
      }

      const pos = trajectory[index] ?? trajectory[0];
      if (!pos) {
        return;
      }
      const px = pad + pos.x * scale;
      const py = height - pad - pos.y * scale;

      if (showVectors) {
        const arrowScale = 0.16 * scale;
        const vx = pos.vx ?? 0;
        const vy = pos.vy ?? 0;
        const ax = vx * arrowScale;
        const ay = -vy * arrowScale;
        ctx.strokeStyle = "#2563eb";
        ctx.fillStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ax, py + ay);
        ctx.stroke();
        const ang = Math.atan2(ay, ax);
        const head = 6;
        ctx.beginPath();
        ctx.moveTo(px + ax, py + ay);
        ctx.lineTo(px + ax - head * Math.cos(ang - Math.PI / 6), py + ay - head * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(px + ax - head * Math.cos(ang + Math.PI / 6), py + ay - head * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = (now: number) => {
      if (!Number.isFinite(tFlight) || tFlight <= 0) {
        draw(0);
        return;
      }
      if (!isPlaying) {
        draw(timeRef.current);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dt = (now - lastTime) / 1000;
      lastRef.current = now;
      timeRef.current = (timeRef.current + dt) % tFlight;
      draw(timeRef.current);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [trajectory, tFlight, isPlaying, trailLength, showVectors]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Projectile Range (No Drag)</div>
      <div className="demo-grid">
        <label className="field">
          <span>v0 (m/s)</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>theta (deg)</span>
          <input type="number" value={theta} onChange={(event) => setTheta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>g (m/s^2)</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>include drag</span>
          <select value={useDrag ? "on" : "off"} onChange={(event) => setUseDrag(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>drag coeff (k)</span>
          <input type="number" value={dragCoeff} onChange={(event) => setDragCoeff(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>trail length</span>
          <input type="number" value={trailLength} onChange={(event) => setTrailLength(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>show velocity vector</span>
          <select value={showVectors ? "on" : "off"} onChange={(event) => setShowVectors(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">Range R = {rangeText}</span>
          <span className="pill">Time = {tText}</span>
          <span className="pill">Max height = {hText}</span>
        </div>
        <div className="demo-note">
          {useDrag ? (
            <MathInline latex={String.raw`\vec{a} = -g\hat{y} - k|\vec{v}|\vec{v}`} />
          ) : (
            <MathInline latex={String.raw`R = \frac{v_0^2 \sin(2\theta)}{g}`} />
          )}
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
    </div>
  );
}

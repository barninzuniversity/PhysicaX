"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function OrbitSimulator() {
  const [mu, setMu] = useState("1");
  const [x0, setX0] = useState("1");
  const [y0, setY0] = useState("0");
  const [vx0, setVx0] = useState("0");
  const [vy0, setVy0] = useState("1");
  const [dt, setDt] = useState("0.01");
  const [steps, setSteps] = useState("3000");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState("1");
  const [trail, setTrail] = useState("0.6");
  const [showVelocity, setShowVelocity] = useState(true);
  const [showAcceleration, setShowAcceleration] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showSweep, setShowSweep] = useState(true);
  const [showApses, setShowApses] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { points, velocities, timeSeries, energy, h, ecc, semiMajor, period, rp, ra, periPoint, apoPoint } = useMemo(() => {
    const muVal = Number(mu);
    const x0Val = Number(x0);
    const y0Val = Number(y0);
    const vx0Val = Number(vx0);
    const vy0Val = Number(vy0);
    const dtVal = Number(dt);
    const stepsVal = Math.min(6000, Math.max(500, Math.floor(Number(steps))));
    if (!Number.isFinite(muVal) || !Number.isFinite(x0Val) || !Number.isFinite(y0Val)) {
      return {
        points: [],
        velocities: [],
        timeSeries: [],
        energy: NaN,
        h: NaN,
        ecc: NaN,
        semiMajor: NaN,
        period: NaN,
        rp: NaN,
        ra: NaN,
        periPoint: null,
        apoPoint: null
      };
    }
    if (dtVal <= 0 || stepsVal <= 0) {
      return {
        points: [],
        velocities: [],
        timeSeries: [],
        energy: NaN,
        h: NaN,
        ecc: NaN,
        semiMajor: NaN,
        period: NaN,
        rp: NaN,
        ra: NaN,
        periPoint: null,
        apoPoint: null
      };
    }
    let x = x0Val;
    let y = y0Val;
    let vx = vx0Val;
    let vy = vy0Val;
    const pts: { x: number; y: number }[] = [];
    const velPts: { x: number; y: number }[] = [];
    const tPts: number[] = [];

    const accel = (xVal: number, yVal: number) => {
      const r = Math.sqrt(xVal * xVal + yVal * yVal);
      const factor = r === 0 ? 0 : -muVal / (r * r * r);
      return { ax: factor * xVal, ay: factor * yVal };
    };

    let t = 0;
    let minR = Infinity;
    let maxR = 0;
    let periIdx = 0;
    let apoIdx = 0;
    for (let i = 0; i < stepsVal; i += 1) {
      pts.push({ x, y });
      velPts.push({ x: vx, y: vy });
      tPts.push(t);
      const rNow = Math.sqrt(x * x + y * y);
      if (rNow < minR) {
        minR = rNow;
        periIdx = i;
      }
      if (rNow > maxR) {
        maxR = rNow;
        apoIdx = i;
      }

      const { ax: ax1, ay: ay1 } = accel(x, y);
      const k1x = vx;
      const k1y = vy;
      const k1vx = ax1;
      const k1vy = ay1;

      const { ax: ax2, ay: ay2 } = accel(x + 0.5 * dtVal * k1x, y + 0.5 * dtVal * k1y);
      const k2x = vx + 0.5 * dtVal * k1vx;
      const k2y = vy + 0.5 * dtVal * k1vy;
      const k2vx = ax2;
      const k2vy = ay2;

      const { ax: ax3, ay: ay3 } = accel(x + 0.5 * dtVal * k2x, y + 0.5 * dtVal * k2y);
      const k3x = vx + 0.5 * dtVal * k2vx;
      const k3y = vy + 0.5 * dtVal * k2vy;
      const k3vx = ax3;
      const k3vy = ay3;

      const { ax: ax4, ay: ay4 } = accel(x + dtVal * k3x, y + dtVal * k3y);
      const k4x = vx + dtVal * k3vx;
      const k4y = vy + dtVal * k3vy;
      const k4vx = ax4;
      const k4vy = ay4;

      x += (dtVal / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      y += (dtVal / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      vx += (dtVal / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx);
      vy += (dtVal / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy);
      t += dtVal;
    }

    const r0 = Math.sqrt(x0Val * x0Val + y0Val * y0Val);
    const v0 = Math.sqrt(vx0Val * vx0Val + vy0Val * vy0Val);
    const energyVal = 0.5 * v0 * v0 - muVal / r0;
    const hVal = x0Val * vy0Val - y0Val * vx0Val;
    const eccVal =
      Number.isFinite(energyVal) && Number.isFinite(hVal) && muVal !== 0
        ? Math.sqrt(Math.max(0, 1 + (2 * energyVal * hVal * hVal) / (muVal * muVal)))
        : NaN;
    const aVal = energyVal < 0 && Number.isFinite(energyVal) ? -muVal / (2 * energyVal) : NaN;
    const periodVal =
      Number.isFinite(aVal) && aVal > 0 ? 2 * Math.PI * Math.sqrt((aVal * aVal * aVal) / muVal) : NaN;
    const rpVal = Number.isFinite(aVal) && Number.isFinite(eccVal) ? aVal * (1 - eccVal) : NaN;
    const raVal = Number.isFinite(aVal) && Number.isFinite(eccVal) ? aVal * (1 + eccVal) : NaN;
    return {
      points: pts,
      velocities: velPts,
      timeSeries: tPts,
      energy: energyVal,
      h: hVal,
      ecc: eccVal,
      semiMajor: aVal,
      period: periodVal,
      rp: rpVal,
      ra: raVal,
      periPoint: pts[periIdx] ?? null,
      apoPoint: pts[apoIdx] ?? null
    };
  }, [mu, x0, y0, vx0, vy0, dt, steps]);

  const regime = Number.isFinite(energy) ? (energy < 0 ? "bound" : "escape") : "--";
  const energyText = Number.isFinite(energy) ? energy.toFixed(3) : "--";
  const hText = Number.isFinite(h) ? h.toFixed(3) : "--";
  const eText = Number.isFinite(ecc) ? ecc.toFixed(3) : "--";
  const aText = Number.isFinite(semiMajor) ? semiMajor.toFixed(3) : "--";
  const periodText = Number.isFinite(period) ? period.toFixed(3) : "--";
  const rpText = Number.isFinite(rp) ? rp.toFixed(3) : "--";
  const raText = Number.isFinite(ra) ? ra.toFixed(3) : "--";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 520;
    const height = 360;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const muVal = Number(mu);
    const maxR = Math.max(1, ...points.map((p) => Math.sqrt(p.x * p.x + p.y * p.y)));
    const maxSpeed = Math.max(
      1e-4,
      ...velocities.map((v) => Math.sqrt(v.x * v.x + v.y * v.y))
    );
    const pad = 40;
    const scale = (Math.min(width, height) / 2 - pad) / maxR;
    const center = { x: width / 2, y: height / 2 };
    const totalTime = timeSeries[timeSeries.length - 1] ?? 1;
    const trailVal = Number(trail);
    const trailRatio = Number.isFinite(trailVal) ? Math.max(0, Math.min(1, trailVal)) : 0.6;
    const trailCount = Math.max(4, Math.floor(points.length * trailRatio));

    const toCanvas = (p: { x: number; y: number }) => ({
      x: center.x + p.x * scale,
      y: center.y - p.y * scale
    });

    const drawArrow = (from: { x: number; y: number }, to: { x: number; y: number }, color: string, widthPx = 2) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const head = Math.min(10, len * 0.25);
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - (ux * head - uy * head * 0.55), to.y - (uy * head + ux * head * 0.55));
      ctx.lineTo(to.x - (ux * head + uy * head * 0.55), to.y - (uy * head - ux * head * 0.55));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const draw = (index: number) => {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, width * 0.6);
      gradient.addColorStop(0, "rgba(15, 118, 110, 0.12)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.98)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (showGrid) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i += 1) {
          ctx.beginPath();
          ctx.arc(center.x, center.y, (maxR * scale * i) / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(center.x - maxR * scale, center.y);
        ctx.lineTo(center.x + maxR * scale, center.y);
        ctx.moveTo(center.x, center.y - maxR * scale);
        ctx.lineTo(center.x, center.y + maxR * scale);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const pos = toCanvas(p);
        if (idx === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      });
      ctx.stroke();

      if (showSweep && points[index] && index > 4) {
        const sweepSpan = Math.max(6, Math.floor(points.length * 0.02));
        const prevIdx = Math.max(0, index - sweepSpan);
        const a = toCanvas(points[prevIdx]);
        const b = toCanvas(points[index]);
        ctx.fillStyle = "rgba(14, 165, 233, 0.18)";
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.closePath();
        ctx.fill();
      }

      const start = Math.max(0, index - trailCount);
      for (let i = start + 1; i <= index; i += 1) {
        const prev = toCanvas(points[i - 1]);
        const curr = toCanvas(points[i]);
        const speed = velocities[i] ? Math.sqrt(velocities[i].x * velocities[i].x + velocities[i].y * velocities[i].y) : 0;
        const tCol = Math.max(0, Math.min(1, speed / maxSpeed));
        const hue = 200 - 160 * tCol;
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
        ctx.lineWidth = 1.6 + (2 * (i - start)) / Math.max(1, trailCount);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }

      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "rgba(15, 23, 42, 0.3)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const pos = toCanvas(points[index]);
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();

      if (showVelocity && velocities[index]) {
        const v = velocities[index];
        const vScale = 0.2 * scale;
        drawArrow(pos, { x: pos.x + v.x * vScale, y: pos.y - v.y * vScale }, "#2563eb", 2);
      }
      if (showAcceleration && Number.isFinite(muVal)) {
        const p = points[index];
        const r2 = p.x * p.x + p.y * p.y + 1e-6;
        const r = Math.sqrt(r2);
        const ax = (-muVal * p.x) / (r2 * r);
        const ay = (-muVal * p.y) / (r2 * r);
        const aScale = 0.06 * scale;
        drawArrow(pos, { x: pos.x + ax * aScale, y: pos.y - ay * aScale }, "#dc2626", 2);
      }

      if (showApses && periPoint && apoPoint) {
        const peri = toCanvas(periPoint);
        const apo = toCanvas(apoPoint);
        ctx.fillStyle = "#0f766e";
        ctx.beginPath();
        ctx.arc(peri.x, peri.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(apo.x, apo.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.font = "11px 'Geist', sans-serif";
        ctx.fillText("rp", peri.x + 6, peri.y - 6);
        ctx.fillText("ra", apo.x + 6, apo.y - 6);
      }
    };

    const step = (now: number) => {
      if (!isPlaying) {
        const idx = Math.min(points.length - 1, Math.floor((timeRef.current / totalTime) * points.length));
        draw(idx);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtSec = (now - lastTime) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      timeRef.current = (timeRef.current + dtSec * (Number.isFinite(rate) ? rate : 1)) % totalTime;
      const idx = Math.min(points.length - 1, Math.floor((timeRef.current / totalTime) * points.length));
      draw(idx);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [
    points,
    velocities,
    timeSeries,
    isPlaying,
    speed,
    trail,
    showVelocity,
    showAcceleration,
    mu,
    showGrid,
    showSweep,
    showApses,
    periPoint,
    apoPoint
  ]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Orbit Simulator</div>
      <div className="demo-grid">
        <label className="field">
          <span>mu = GM</span>
          <input type="number" value={mu} onChange={(event) => setMu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>y0</span>
          <input type="number" value={y0} onChange={(event) => setY0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>vx0</span>
          <input type="number" value={vx0} onChange={(event) => setVx0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>vy0</span>
          <input type="number" value={vy0} onChange={(event) => setVy0(event.target.value)} step="any" />
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
          <span>playback speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>trail (0-1)</span>
          <input type="number" value={trail} onChange={(event) => setTrail(event.target.value)} step="0.05" />
        </label>
        <label className="field">
          <span>velocity vector</span>
          <select value={showVelocity ? "on" : "off"} onChange={(event) => setShowVelocity(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>acceleration vector</span>
          <select value={showAcceleration ? "on" : "off"} onChange={(event) => setShowAcceleration(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>orbital grid</span>
          <select value={showGrid ? "on" : "off"} onChange={(event) => setShowGrid(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>area sweep</span>
          <select value={showSweep ? "on" : "off"} onChange={(event) => setShowSweep(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>peri/apo markers</span>
          <select value={showApses ? "on" : "off"} onChange={(event) => setShowApses(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">energy = {energyText}</span>
          <span className="pill">h = {hText}</span>
          <span className="pill">e = {eText}</span>
          <span className="pill">a = {aText}</span>
          <span className="pill">T = {periodText}</span>
          <span className="pill">rp = {rpText}</span>
          <span className="pill">ra = {raText}</span>
          <span className="pill">orbit: {regime}</span>
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
      <PlotCanvas series={[{ id: "orbit", points, color: "#2563eb" }]} xLabel="x" yLabel="y" />
    </div>
  );
}

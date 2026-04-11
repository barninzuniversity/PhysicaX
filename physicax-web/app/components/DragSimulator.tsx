"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

type DragMode = "none" | "linear" | "quadratic";

export function DragSimulator() {
  const [mode, setMode] = useState<DragMode>("linear");
  const [v0, setV0] = useState("40");
  const [theta, setTheta] = useState("45");
  const [mass, setMass] = useState("1");
  const [b, setB] = useState("0.2");
  const [c, setC] = useState("0.02");
  const [wind, setWind] = useState("0");
  const [g, setG] = useState("9.80665");
  const [dt, setDt] = useState("0.02");
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { points, time, relSpeedSeries, speedSeries, dragSeries, maxHeight, range } = useMemo(() => {
    const v0Val = Number(v0);
    const thetaVal = Number(theta);
    const mVal = Number(mass);
    const bVal = Number(b);
    const cVal = Number(c);
    const gVal = Number(g);
    const windVal = Number(wind);
    const dtVal = Number(dt);
    if (
      !Number.isFinite(v0Val) ||
      !Number.isFinite(thetaVal) ||
      !Number.isFinite(mVal) ||
      !Number.isFinite(bVal) ||
      !Number.isFinite(cVal) ||
      !Number.isFinite(gVal) ||
      !Number.isFinite(windVal) ||
      !Number.isFinite(dtVal) ||
      mVal <= 0 ||
      dtVal <= 0
    ) {
      return {
        points: [],
        time: NaN,
        relSpeedSeries: [],
        speedSeries: [],
        dragSeries: [],
        maxHeight: NaN,
        range: NaN
      };
    }
    const rad = (thetaVal * Math.PI) / 180;
    let x = 0;
    let y = 0;
    let vx = v0Val * Math.cos(rad);
    let vy = v0Val * Math.sin(rad);
    const pts: { x: number; y: number }[] = [{ x, y }];
    const relSpeedPts: { x: number; y: number }[] = [];
    const speedPts: { x: number; y: number }[] = [];
    const dragPts: { x: number; y: number }[] = [];
    let t = 0;
    let maxY = y;
    const maxSteps = 3000;

    const accel = (vxVal: number, vyVal: number) => {
      const relVx = vxVal - windVal;
      const relVy = vyVal;
      if (mode === "none") {
        return { ax: 0, ay: -gVal };
      }
      if (mode === "linear") {
        return { ax: (-bVal / mVal) * relVx, ay: -gVal + (-bVal / mVal) * relVy };
      }
      const speed = Math.sqrt(relVx * relVx + relVy * relVy);
      if (speed === 0) {
        return { ax: 0, ay: -gVal };
      }
      return { ax: (-cVal / mVal) * speed * relVx, ay: -gVal + (-cVal / mVal) * speed * relVy };
    };

    for (let i = 0; i < maxSteps; i += 1) {
      const relVx = vx - windVal;
      const relVy = vy;
      const speed = Math.sqrt(relVx * relVx + relVy * relVy);
      const dragForce =
        mode === "none" ? 0 : mode === "linear" ? Math.abs(bVal * speed) : Math.abs(cVal * speed * speed);
      relSpeedPts.push({ x: t, y: speed });
      speedPts.push({ x: t, y: Math.sqrt(vx * vx + vy * vy) });
      dragPts.push({ x: t, y: dragForce });

      const { ax: ax1, ay: ay1 } = accel(vx, vy);
      const k1vx = ax1 * dtVal;
      const k1vy = ay1 * dtVal;
      const k1x = vx * dtVal;
      const k1y = vy * dtVal;

      const { ax: ax2, ay: ay2 } = accel(vx + 0.5 * k1vx, vy + 0.5 * k1vy);
      const k2vx = ax2 * dtVal;
      const k2vy = ay2 * dtVal;
      const k2x = (vx + 0.5 * k1vx) * dtVal;
      const k2y = (vy + 0.5 * k1vy) * dtVal;

      const { ax: ax3, ay: ay3 } = accel(vx + 0.5 * k2vx, vy + 0.5 * k2vy);
      const k3vx = ax3 * dtVal;
      const k3vy = ay3 * dtVal;
      const k3x = (vx + 0.5 * k2vx) * dtVal;
      const k3y = (vy + 0.5 * k2vy) * dtVal;

      const { ax: ax4, ay: ay4 } = accel(vx + k3vx, vy + k3vy);
      const k4vx = ax4 * dtVal;
      const k4vy = ay4 * dtVal;
      const k4x = (vx + k3vx) * dtVal;
      const k4y = (vy + k3vy) * dtVal;

      vx += (k1vx + 2 * k2vx + 2 * k3vx + k4vx) / 6;
      vy += (k1vy + 2 * k2vy + 2 * k3vy + k4vy) / 6;
      x += (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
      y += (k1y + 2 * k2y + 2 * k3y + k4y) / 6;

      t += dtVal;
      if (y < 0) {
        break;
      }
      pts.push({ x, y });
      if (y > maxY) {
        maxY = y;
      }
    }
    return {
      points: pts,
      time: t,
      relSpeedSeries: relSpeedPts,
      speedSeries: speedPts,
      dragSeries: dragPts,
      maxHeight: maxY,
      range: x
    };
  }, [mode, v0, theta, mass, b, c, wind, g, dt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0 || !Number.isFinite(time)) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 540;
    const height = 260;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const maxX = Math.max(...points.map((p) => p.x), 1);
    const maxY = Math.max(...points.map((p) => p.y), 1);
    const pad = 24;
    const scale = Math.min((width - 2 * pad) / maxX, (height - 2 * pad) / maxY);

    const windVal = Number(wind);
    const drawStreamlines = (cx: number, cy: number, r: number, phase: number) => {
      const offsets = [-2.2, -1.4, -0.6, 0.6, 1.4, 2.2];
      offsets.forEach((offset) => {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
        ctx.lineWidth = 1;
        const y0 = offset * r;
        for (let i = -120; i <= 120; i += 8) {
          const x = i + (phase % 24) - 12 + Number(wind || 0) * 0.6;
          const denom = x * x + y0 * y0 + r * r * 0.4;
          const deflect = (r * r * y0) / denom;
          const y = y0 + deflect;
          if (i === -120) {
            ctx.moveTo(cx + x, cy + y);
          } else {
            ctx.lineTo(cx + x, cy + y);
          }
        }
        ctx.stroke();
      });
    };

    const draw = (tNow: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.94)";
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
      points.forEach((p, idx) => {
        const x = pad + p.x * scale;
        const y = height - pad - p.y * scale;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const index = Math.min(points.length - 1, Math.max(0, Math.floor((tNow / time) * points.length)));
      const pos = points[index];
      const px = pad + pos.x * scale;
      const py = height - pad - pos.y * scale;

      drawStreamlines(px, py, 12, tNow * 60);

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      if (Number.isFinite(windVal) && windVal !== 0) {
        ctx.strokeStyle = "rgba(37, 99, 235, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width - pad - 80, pad + 12);
        ctx.lineTo(width - pad - 10, pad + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width - pad - 10, pad + 12);
        ctx.lineTo(width - pad - 18, pad + 6);
        ctx.lineTo(width - pad - 18, pad + 18);
        ctx.closePath();
        ctx.fillStyle = "rgba(37, 99, 235, 0.6)";
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.font = "11px 'Geist', sans-serif";
        ctx.fillText("wind", width - pad - 70, pad + 8);
      }
    };

    const step = (now: number) => {
      if (!isPlaying) {
        draw(timeRef.current);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtStep = (now - lastTime) / 1000;
      lastRef.current = now;
      timeRef.current = (timeRef.current + dtStep) % time;
      draw(timeRef.current);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [points, time, isPlaying, wind]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Drag Simulator</div>
      <div className="demo-grid">
        <label className="field">
          <span>drag mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as DragMode)}>
            <option value="none">None</option>
            <option value="linear">Linear</option>
            <option value="quadratic">Quadratic</option>
          </select>
        </label>
        <label className="field">
          <span>v0</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>theta (deg)</span>
          <input type="number" value={theta} onChange={(event) => setTheta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>mass</span>
          <input type="number" value={mass} onChange={(event) => setMass(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>b (linear)</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>c (quadratic)</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>wind (m/s)</span>
          <input type="number" value={wind} onChange={(event) => setWind(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>g</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">flight time = {Number.isFinite(time) ? time.toFixed(2) : "--"} s</span>
          <span className="pill">range = {Number.isFinite(range) ? range.toFixed(2) : "--"} m</span>
          <span className="pill">max height = {Number.isFinite(maxHeight) ? maxHeight.toFixed(2) : "--"} m</span>
        </div>
        <div className="demo-note">RK4 integration with selectable drag and live airflow sketch.</div>
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
      <PlotCanvas series={[{ id: "drag", points, color: "#0b7285" }]} xLabel="x" yLabel="y" />
      <PlotCanvas
        series={[
          { id: "speed", points: speedSeries, color: "#2563eb", label: "|v|(t)" },
          { id: "rel-speed", points: relSpeedSeries, color: "#16a34a", label: "|v_rel|(t)", dash: [6, 6] }
        ]}
        xLabel="t"
        yLabel="speed (m/s)"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "drag-force", points: dragSeries, color: "#d97706", label: "drag force" }]}
        xLabel="t"
        yLabel="drag (N)"
        showLegend
      />
    </div>
  );
}

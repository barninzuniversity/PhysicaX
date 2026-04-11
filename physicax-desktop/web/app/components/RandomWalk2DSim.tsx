"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function RandomWalk2DSim() {
  const [steps, setSteps] = useState("400");
  const [seed, setSeed] = useState("23");
  const [driftX, setDriftX] = useState("0");
  const [driftY, setDriftY] = useState("0");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const path = useMemo(() => {
    const nVal = Math.max(20, Math.min(2000, Math.floor(Number(steps) || 400)));
    const seedVal = Math.floor(Number(seed) || 23);
    const dx = Number(driftX) || 0;
    const dy = Number(driftY) || 0;
    let state = seedVal;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
    let x = 0;
    let y = 0;
    const pts: { x: number; y: number }[] = [{ x, y }];
    for (let i = 0; i < nVal; i += 1) {
      const r = rand();
      const angle = r * Math.PI * 2;
      x += Math.cos(angle) + dx;
      y += Math.sin(angle) + dy;
      pts.push({ x, y });
    }
    return pts;
  }, [steps, seed, driftX, driftY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 520;
    const height = 320;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "rgba(255,255,255,0.98)");
    bg.addColorStop(1, "rgba(238,245,250,0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const xs = path.map((p) => p.x);
    const ys = path.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const scale = 0.85 * Math.min(width / (xMax - xMin + 1), height / (yMax - yMin + 1));
    const cx = width * 0.5;
    const cy = height * 0.5;

    ctx.strokeStyle = "#0b7285";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    path.forEach((p, i) => {
      const x = cx + (p.x - (xMin + xMax) / 2) * scale;
      const y = cy - (p.y - (yMin + yMax) / 2) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const end = path[path.length - 1];
    const ex = cx + (end.x - (xMin + xMax) / 2) * scale;
    const ey = cy - (end.y - (yMin + yMax) / 2) * scale;
    ctx.fillStyle = "#db2777";
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [path]);

  return (
    <div className="demo-panel">
      <div className="demo-title">2D Random Walk</div>
      <div className="demo-grid">
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>seed</span>
          <input type="number" value={seed} onChange={(event) => setSeed(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>drift x</span>
          <input type="number" value={driftX} onChange={(event) => setDriftX(event.target.value)} step="0.1" />
        </label>
        <label className="field">
          <span>drift y</span>
          <input type="number" value={driftY} onChange={(event) => setDriftY(event.target.value)} step="0.1" />
        </label>
      </div>
      <canvas ref={canvasRef} aria-label="2d random walk" />
    </div>
  );
}

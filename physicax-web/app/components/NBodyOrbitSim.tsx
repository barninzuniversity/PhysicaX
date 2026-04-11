"use client";

import { useEffect, useRef, useState } from "react";

type Body = { x: number; y: number; vx: number; vy: number; m: number; color: string };

export function NBodyOrbitSim() {
  const [massScale, setMassScale] = useState("1");
  const [orbitSpeed, setOrbitSpeed] = useState("1");
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bodiesRef = useRef<Body[]>([]);
  const trailsRef = useRef<{ x: number; y: number }[][]>([]);
  const frameRef = useRef<number | null>(null);

  const reset = () => {
    const mScale = Math.max(0.5, Math.min(4, Number(massScale) || 1));
    const vScale = Math.max(0.4, Math.min(2.5, Number(orbitSpeed) || 1));
    bodiesRef.current = [
      { x: 0, y: 0, vx: 0, vy: 0, m: 12 * mScale, color: "#0f766e" },
      { x: 1.2, y: 0, vx: 0, vy: 1.05 * vScale, m: 0.6 * mScale, color: "#2563eb" },
      { x: -1.8, y: 0, vx: 0, vy: -0.8 * vScale, m: 0.4 * mScale, color: "#db2777" }
    ];
    trailsRef.current = bodiesRef.current.map(() => []);
  };

  useEffect(() => {
    reset();
  }, [massScale, orbitSpeed]);

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

    const G = 1;
    const soft = 0.06;

    const step = () => {
      if (isPlaying) {
        const bodies = bodiesRef.current;
        const dt = 0.008;
        const ax = new Array(bodies.length).fill(0);
        const ay = new Array(bodies.length).fill(0);
        for (let i = 0; i < bodies.length; i += 1) {
          for (let j = 0; j < bodies.length; j += 1) {
            if (i === j) continue;
            const dx = bodies[j].x - bodies[i].x;
            const dy = bodies[j].y - bodies[i].y;
            const r2 = dx * dx + dy * dy + soft * soft;
            const inv = 1 / Math.sqrt(r2 * r2 * r2);
            ax[i] += G * bodies[j].m * dx * inv;
            ay[i] += G * bodies[j].m * dy * inv;
          }
        }
        for (let i = 0; i < bodies.length; i += 1) {
          bodies[i].vx += ax[i] * dt;
          bodies[i].vy += ay[i] * dt;
          bodies[i].x += bodies[i].vx * dt;
          bodies[i].y += bodies[i].vy * dt;
          const trail = trailsRef.current[i];
          trail.push({ x: bodies[i].x, y: bodies[i].y });
          if (trail.length > 220) {
            trail.shift();
          }
        }
      }

      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "rgba(255,255,255,0.98)");
      bg.addColorStop(1, "rgba(238,245,250,0.95)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const scale = 90;
      const toScreen = (p: { x: number; y: number }) => ({
        x: width * 0.5 + p.x * scale,
        y: height * 0.5 - p.y * scale
      });

      trailsRef.current.forEach((trail, idx) => {
        if (trail.length < 2) return;
        ctx.strokeStyle = bodiesRef.current[idx].color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        trail.forEach((pt, i) => {
          const s = toScreen(pt);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      bodiesRef.current.forEach((body) => {
        const s = toScreen(body);
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(6, body.m * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(15,23,42,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="demo-panel">
      <div className="demo-title">N-Body Gravity Playground</div>
      <div className="demo-grid">
        <label className="field">
          <span>Mass scale</span>
          <input type="number" value={massScale} onChange={(event) => setMassScale(event.target.value)} step="0.1" />
        </label>
        <label className="field">
          <span>Orbit speed</span>
          <input type="number" value={orbitSpeed} onChange={(event) => setOrbitSpeed(event.target.value)} step="0.1" />
        </label>
        <div className="field">
          <span>Controls</span>
          <div className="inline-kv">
            <button type="button" className="pill" onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button type="button" className="pill" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} aria-label="n-body simulation" />
    </div>
  );
}

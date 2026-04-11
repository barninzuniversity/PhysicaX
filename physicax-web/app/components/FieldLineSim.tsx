"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Charge = { x: number; y: number; q: number };

export function FieldLineSim() {
  const [separation, setSeparation] = useState("1.2");
  const [strength, setStrength] = useState("1");
  const [lines, setLines] = useState("14");
  const [stepSize, setStepSize] = useState("0.03");
  const [steps, setSteps] = useState("380");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const charges = useMemo(() => {
    const sep = Math.max(0.4, Number(separation) || 1.2);
    const qVal = Math.max(0.2, Math.min(3, Number(strength) || 1));
    const half = sep * 0.5;
    return [
      { x: -half, y: 0, q: qVal },
      { x: half, y: 0, q: -qVal }
    ] satisfies Charge[];
  }, [separation, strength]);

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
    const height = 360;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "rgba(255,255,255,0.98)");
    bg.addColorStop(1, "rgba(240,244,248,0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const scale = 120;
    const toScreen = (p: { x: number; y: number }) => ({
      x: width * 0.5 + p.x * scale,
      y: height * 0.5 - p.y * scale
    });

    const fieldAt = (p: { x: number; y: number }) => {
      let fx = 0;
      let fy = 0;
      for (const ch of charges) {
        const dx = p.x - ch.x;
        const dy = p.y - ch.y;
        const r2 = dx * dx + dy * dy + 0.02;
        const r = Math.sqrt(r2);
        const coeff = ch.q / (r2 * r);
        fx += coeff * dx;
        fy += coeff * dy;
      }
      return { fx, fy };
    };

    const lineCount = Math.max(6, Math.min(28, Math.floor(Number(lines) || 14)));
    const step = Math.max(0.01, Math.min(0.08, Number(stepSize) || 0.03));
    const maxSteps = Math.max(120, Math.min(800, Math.floor(Number(steps) || 380)));

    for (const ch of charges) {
      const seeds = ch.q > 0 ? lineCount : 0;
      for (let i = 0; i < seeds; i += 1) {
        const angle = (2 * Math.PI * i) / seeds;
        let p = { x: ch.x + 0.08 * Math.cos(angle), y: ch.y + 0.08 * Math.sin(angle) };
        ctx.beginPath();
        let started = false;
        for (let s = 0; s < maxSteps; s += 1) {
          const { fx, fy } = fieldAt(p);
          const mag = Math.sqrt(fx * fx + fy * fy) || 1;
          const dirx = fx / mag;
          const diry = fy / mag;
          p = { x: p.x + dirx * step, y: p.y + diry * step };

          const scr = toScreen(p);
          if (!started) {
            ctx.moveTo(scr.x, scr.y);
            started = true;
          } else {
            ctx.lineTo(scr.x, scr.y);
          }
          if (Math.abs(p.x) > 2.2 || Math.abs(p.y) > 1.6) {
            break;
          }
          const hit = charges.find((c) => c.q < 0 && Math.hypot(p.x - c.x, p.y - c.y) < 0.08);
          if (hit) {
            break;
          }
        }
        ctx.strokeStyle = "rgba(30,64,175,0.6)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }

    for (const ch of charges) {
      const scr = toScreen(ch);
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = ch.q > 0 ? "#ef4444" : "#3b82f6";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px \"Geist\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch.q > 0 ? "+" : "-", scr.x, scr.y + 1);
    }
  }, [charges, lines, stepSize, steps]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Electrostatics Field Lines</div>
      <div className="demo-grid">
        <label className="field">
          <span>Separation</span>
          <input type="number" value={separation} onChange={(event) => setSeparation(event.target.value)} step="0.1" />
        </label>
        <label className="field">
          <span>Charge strength</span>
          <input type="number" value={strength} onChange={(event) => setStrength(event.target.value)} step="0.1" />
        </label>
        <label className="field">
          <span>Lines</span>
          <input type="number" value={lines} onChange={(event) => setLines(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>Step size</span>
          <input type="number" value={stepSize} onChange={(event) => setStepSize(event.target.value)} step="0.01" />
        </label>
        <label className="field">
          <span>Steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="10" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">Seeds start at + charge, terminate on - charge.</span>
          <span className="pill">Field uses superposition E = sum(q r / r^3).</span>
        </div>
      </div>
      <canvas ref={canvasRef} aria-label="electrostatic field lines" />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function CircuitPhasorSim() {
  const [r, setR] = useState("20");
  const [l, setL] = useState("0.5");
  const [c, setC] = useState("0.01");
  const [v, setV] = useState("5");
  const [driveFreq, setDriveFreq] = useState("1");
  const [samples, setSamples] = useState("180");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { bodeMag, bodePhase, phasor } = useMemo(() => {
    const rVal = Number(r);
    const lVal = Number(l);
    const cVal = Number(c);
    const vVal = Number(v);
    const fVal = Number(driveFreq);
    const samplesVal = Math.max(60, Math.min(360, Math.floor(Number(samples) || 180)));
    if (!Number.isFinite(rVal) || !Number.isFinite(lVal) || !Number.isFinite(cVal) || !Number.isFinite(vVal)) {
      return { bodeMag: [], bodePhase: [], phasor: null };
    }
    if (lVal <= 0 || cVal <= 0 || fVal <= 0) {
      return { bodeMag: [], bodePhase: [], phasor: null };
    }

    const w0 = 1 / Math.sqrt(lVal * cVal);
    const f0 = w0 / (2 * Math.PI);
    const fMin = Math.max(0.1, f0 * 0.25);
    const fMax = f0 * 3.5;

    const magPts: { x: number; y: number }[] = [];
    const phasePts: { x: number; y: number }[] = [];
    for (let i = 0; i <= samplesVal; i += 1) {
      const f = fMin + (fMax - fMin) * (i / samplesVal);
      const w = 2 * Math.PI * f;
      const react = w * lVal - 1 / (w * cVal);
      const zMag = Math.sqrt(rVal * rVal + react * react);
      const iAmp = zMag > 0 ? vVal / zMag : 0;
      const phase = Math.atan2(react, rVal);
      magPts.push({ x: f, y: iAmp });
      phasePts.push({ x: f, y: phase });
    }

    const wDrive = 2 * Math.PI * fVal;
    const reactDrive = wDrive * lVal - 1 / (wDrive * cVal);
    const zMagDrive = Math.sqrt(rVal * rVal + reactDrive * reactDrive);
    const iDrive = zMagDrive > 0 ? vVal / zMagDrive : 0;
    const phaseDrive = Math.atan2(reactDrive, rVal);

    const vR = iDrive * rVal;
    const vL = iDrive * wDrive * lVal;
    const vC = iDrive / (wDrive * cVal);
    const vTotal = Math.sqrt(vR * vR + (vL - vC) * (vL - vC));

    return {
      bodeMag: magPts,
      bodePhase: phasePts,
      phasor: {
        vR,
        vL,
        vC,
        vTotal,
        phase: phaseDrive,
        current: iDrive
      }
    };
  }, [r, l, c, v, driveFreq, samples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !phasor) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 320;
    const height = 220;
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

    const cx = width * 0.5;
    const cy = height * 0.62;
    ctx.strokeStyle = "rgba(15,23,42,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy);
    ctx.lineTo(cx + 120, cy);
    ctx.moveTo(cx, cy - 90);
    ctx.lineTo(cx, cy + 40);
    ctx.stroke();

    const scale = 90 / Math.max(1, phasor.vTotal);
    const drawArrow = (dx: number, dy: number, color: string) => {
      const x1 = cx;
      const y1 = cy;
      const x2 = cx + dx * scale;
      const y2 = cy - dy * scale;
      const ang = Math.atan2(y1 - y2, x2 - x1);
      const head = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 + head * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 + head * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawArrow(phasor.vR, 0, "#0f766e");
    drawArrow(0, phasor.vL, "#2563eb");
    drawArrow(0, -phasor.vC, "#db2777");
    drawArrow(phasor.vR, phasor.vL - phasor.vC, "#111827");

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px \"Geist\", sans-serif";
    ctx.fillText("Vr", cx + phasor.vR * scale + 6, cy + 12);
    ctx.fillText("Vl", cx + 6, cy - phasor.vL * scale - 6);
    ctx.fillText("Vc", cx + 6, cy + phasor.vC * scale + 16);
    ctx.fillText("V", cx + phasor.vR * scale + 6, cy - (phasor.vL - phasor.vC) * scale - 6);
  }, [phasor]);

  return (
    <div className="demo-panel">
      <div className="demo-title">RLC Phasor + Bode</div>
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
          <span>V (V)</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Drive f (Hz)</span>
          <input type="number" value={driveFreq} onChange={(event) => setDriveFreq(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Samples</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">
            <MathInline latex={"|Z|=\\sqrt{R^2+(\\omega L-1/(\\omega C))^2}"} />
          </span>
          <span className="pill">I = {phasor ? phasor.current.toFixed(3) : "--"} A</span>
          <span className="pill">Phase = {phasor ? (phasor.phase * (180 / Math.PI)).toFixed(1) : "--"} deg</span>
        </div>
      </div>
      <div className="demo-stack">
        <div className="split">
          <div>
            <h4>Phasor diagram</h4>
            <canvas ref={canvasRef} aria-label="phasor diagram" />
          </div>
          <div>
            <h4>Magnitude response</h4>
            <PlotCanvas series={[{ id: "mag", points: bodeMag, color: "#0f766e", label: "I(f)" }]} xLabel="f" yLabel="A" showLegend />
          </div>
        </div>
        <PlotCanvas series={[{ id: "phase", points: bodePhase, color: "#4f46e5", label: "phase" }]} xLabel="f" yLabel="rad" showLegend />
      </div>
    </div>
  );
}

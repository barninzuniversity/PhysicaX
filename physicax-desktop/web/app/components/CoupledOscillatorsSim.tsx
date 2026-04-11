"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function CoupledOscillatorsSim() {
  const [k, setK] = useState("6");
  const [kc, setKc] = useState("2");
  const [m, setM] = useState("1");
  const [x10, setX10] = useState("1");
  const [x20, setX20] = useState("-0.4");
  const [v10, setV10] = useState("0");
  const [v20, setV20] = useState("0");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("12");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState("1");
  const [showVelocity, setShowVelocity] = useState(true);
  const [showCoupling, setShowCoupling] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const {
    x1Series,
    x2Series,
    v1Series,
    v2Series,
    energy1Series,
    energy2Series,
    totalEnergySeries,
    phaseSeries,
    timeSeries,
    omega1,
    omega2
  } = useMemo(() => {
    const kVal = Number(k);
    const kcVal = Number(kc);
    const mVal = Number(m);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (!Number.isFinite(kVal) || !Number.isFinite(kcVal) || !Number.isFinite(mVal)) {
      return {
        x1Series: [],
        x2Series: [],
        v1Series: [],
        v2Series: [],
        energy1Series: [],
        energy2Series: [],
        totalEnergySeries: [],
        phaseSeries: [],
        timeSeries: [],
        omega1: NaN,
        omega2: NaN
      };
    }
    if (mVal <= 0 || dtVal <= 0 || durVal <= 0) {
      return {
        x1Series: [],
        x2Series: [],
        v1Series: [],
        v2Series: [],
        energy1Series: [],
        energy2Series: [],
        totalEnergySeries: [],
        phaseSeries: [],
        timeSeries: [],
        omega1: NaN,
        omega2: NaN
      };
    }
    let x1 = Number(x10);
    let x2 = Number(x20);
    let v1 = Number(v10);
    let v2 = Number(v20);
    const steps = Math.min(2200, Math.max(10, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    const pts1: { x: number; y: number }[] = [];
    const pts2: { x: number; y: number }[] = [];
    const v1Pts: { x: number; y: number }[] = [];
    const v2Pts: { x: number; y: number }[] = [];
    const e1Pts: { x: number; y: number }[] = [];
    const e2Pts: { x: number; y: number }[] = [];
    const eTotPts: { x: number; y: number }[] = [];
    const phasePts: { x: number; y: number }[] = [];
    const tPts: number[] = [];

    const accel = (x1Val: number, x2Val: number) => {
      const a1 = (-kVal * x1Val - kcVal * (x1Val - x2Val)) / mVal;
      const a2 = (-kVal * x2Val - kcVal * (x2Val - x1Val)) / mVal;
      return { a1, a2 };
    };

    let t = 0;
    for (let i = 0; i <= steps; i += 1) {
      pts1.push({ x: t, y: x1 });
      pts2.push({ x: t, y: x2 });
      v1Pts.push({ x: t, y: v1 });
      v2Pts.push({ x: t, y: v2 });
      phasePts.push({ x: x1, y: x2 });
      tPts.push(t);
      const e1 = 0.5 * mVal * v1 * v1 + 0.5 * kVal * x1 * x1;
      const e2 = 0.5 * mVal * v2 * v2 + 0.5 * kVal * x2 * x2;
      const eCouple = 0.5 * kcVal * (x1 - x2) * (x1 - x2);
      e1Pts.push({ x: t, y: e1 });
      e2Pts.push({ x: t, y: e2 });
      eTotPts.push({ x: t, y: e1 + e2 + eCouple });

      const { a1: a1_1, a2: a2_1 } = accel(x1, x2);
      const k1x1 = v1;
      const k1v1 = a1_1;
      const k1x2 = v2;
      const k1v2 = a2_1;

      const { a1: a1_2, a2: a2_2 } = accel(x1 + 0.5 * dtStep * k1x1, x2 + 0.5 * dtStep * k1x2);
      const k2x1 = v1 + 0.5 * dtStep * k1v1;
      const k2v1 = a1_2;
      const k2x2 = v2 + 0.5 * dtStep * k1v2;
      const k2v2 = a2_2;

      const { a1: a1_3, a2: a2_3 } = accel(x1 + 0.5 * dtStep * k2x1, x2 + 0.5 * dtStep * k2x2);
      const k3x1 = v1 + 0.5 * dtStep * k2v1;
      const k3v1 = a1_3;
      const k3x2 = v2 + 0.5 * dtStep * k2v2;
      const k3v2 = a2_3;

      const { a1: a1_4, a2: a2_4 } = accel(x1 + dtStep * k3x1, x2 + dtStep * k3x2);
      const k4x1 = v1 + dtStep * k3v1;
      const k4v1 = a1_4;
      const k4x2 = v2 + dtStep * k3v2;
      const k4v2 = a2_4;

      x1 += (dtStep / 6) * (k1x1 + 2 * k2x1 + 2 * k3x1 + k4x1);
      v1 += (dtStep / 6) * (k1v1 + 2 * k2v1 + 2 * k3v1 + k4v1);
      x2 += (dtStep / 6) * (k1x2 + 2 * k2x2 + 2 * k3x2 + k4x2);
      v2 += (dtStep / 6) * (k1v2 + 2 * k2v2 + 2 * k3v2 + k4v2);
      t += dtStep;
    }

    const omega1Val = Math.sqrt(kVal / mVal);
    const omega2Val = Math.sqrt((kVal + 2 * kcVal) / mVal);

    return {
      x1Series: pts1,
      x2Series: pts2,
      v1Series: v1Pts,
      v2Series: v2Pts,
      energy1Series: e1Pts,
      energy2Series: e2Pts,
      totalEnergySeries: eTotPts,
      phaseSeries: phasePts,
      timeSeries: tPts,
      omega1: omega1Val,
      omega2: omega2Val
    };
  }, [k, kc, m, x10, x20, v10, v20, dt, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || x1Series.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 520;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const maxAmp = Math.max(
      0.4,
      ...x1Series.map((p) => Math.abs(p.y)),
      ...x2Series.map((p) => Math.abs(p.y))
    );
    const scale = 70 / maxAmp;
    const wallLeft = 60;
    const wallRight = width - 60;
    const rest1 = width * 0.4;
    const rest2 = width * 0.6;
    const baseY = height * 0.5;

    const drawSpring = (start: number, end: number, color = "#64748b") => {
      const coils = 8;
      const amp = 8;
      const len = end - start;
      ctx.strokeStyle = color;
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
      ctx.lineWidth = 2;
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
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(15,23,42,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallLeft, baseY - 30);
      ctx.lineTo(wallLeft, baseY + 30);
      ctx.moveTo(wallRight, baseY - 30);
      ctx.lineTo(wallRight, baseY + 30);
      ctx.stroke();

      const x1 = x1Series[index]?.y ?? 0;
      const x2 = x2Series[index]?.y ?? 0;
      const v1 = v1Series[index]?.y ?? 0;
      const v2 = v2Series[index]?.y ?? 0;
      const coupling = x2 - x1;
      const couplingColor = coupling >= 0 ? "rgba(37, 99, 235, 0.8)" : "rgba(220, 38, 38, 0.8)";
      const m1X = rest1 + x1 * scale;
      const m2X = rest2 + x2 * scale;

      drawSpring(wallLeft, m1X - 18);
      drawSpring(m1X + 18, m2X - 18, showCoupling ? couplingColor : "#64748b");
      drawSpring(m2X + 18, wallRight);

      const mass1Grad = ctx.createLinearGradient(m1X - 18, baseY - 18, m1X + 18, baseY + 18);
      mass1Grad.addColorStop(0, "#0b7285");
      mass1Grad.addColorStop(1, "#0f766e");
      ctx.fillStyle = mass1Grad;
      ctx.fillRect(m1X - 18, baseY - 18, 36, 36);
      const mass2Grad = ctx.createLinearGradient(m2X - 18, baseY - 18, m2X + 18, baseY + 18);
      mass2Grad.addColorStop(0, "#d97706");
      mass2Grad.addColorStop(1, "#f59e0b");
      ctx.fillStyle = mass2Grad;
      ctx.fillRect(m2X - 18, baseY - 18, 36, 36);

      if (showVelocity) {
        drawArrow({ x: m1X, y: baseY - 28 }, { x: m1X + v1 * 10, y: baseY - 28 }, "#2563eb");
        drawArrow({ x: m2X, y: baseY - 28 }, { x: m2X + v2 * 10, y: baseY - 28 }, "#2563eb");
      }

      const e1 = energy1Series[index]?.y ?? 0;
      const e2 = energy2Series[index]?.y ?? 0;
      const eTot = totalEnergySeries[index]?.y ?? e1 + e2;
      const barH = 80;
      const barX = width - 64;
      const barY = 20;
      ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
      ctx.fillRect(barX, barY, 10, barH);
      ctx.fillRect(barX + 16, barY, 10, barH);
      const eScale = eTot > 0 ? barH / eTot : 0;
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(barX, barY + barH - e1 * eScale, 10, e1 * eScale);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(barX + 16, barY + barH - e2 * eScale, 10, e2 * eScale);
      ctx.fillStyle = "#475569";
      ctx.font = "11px 'Geist', sans-serif";
      ctx.fillText("E1", barX - 2, barY + barH + 14);
      ctx.fillText("E2", barX + 12, barY + barH + 14);
    };

    const totalTime = timeSeries[timeSeries.length - 1] ?? 1;
    const step = (now: number) => {
      if (!isPlaying) {
        const idx = Math.min(x1Series.length - 1, Math.floor((timeRef.current / totalTime) * x1Series.length));
        draw(idx);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtSec = (now - lastTime) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      timeRef.current = (timeRef.current + dtSec * (Number.isFinite(rate) ? rate : 1)) % totalTime;
      const idx = Math.min(x1Series.length - 1, Math.floor((timeRef.current / totalTime) * x1Series.length));
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
    x1Series,
    x2Series,
    v1Series,
    v2Series,
    timeSeries,
    energy1Series,
    energy2Series,
    totalEnergySeries,
    isPlaying,
    speed,
    showVelocity,
    showCoupling
  ]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Coupled Oscillators</div>
      <div className="demo-grid">
        <label className="field">
          <span>k</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>k_c</span>
          <input type="number" value={kc} onChange={(event) => setKc(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>m</span>
          <input type="number" value={m} onChange={(event) => setM(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x1(0)</span>
          <input type="number" value={x10} onChange={(event) => setX10(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x2(0)</span>
          <input type="number" value={x20} onChange={(event) => setX20(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v1(0)</span>
          <input type="number" value={v10} onChange={(event) => setV10(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v2(0)</span>
          <input type="number" value={v20} onChange={(event) => setV20(event.target.value)} step="any" />
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
          <span>velocity arrows</span>
          <select value={showVelocity ? "on" : "off"} onChange={(event) => setShowVelocity(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>coupling tension</span>
          <select value={showCoupling ? "on" : "off"} onChange={(event) => setShowCoupling(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">omega1 = {Number.isFinite(omega1) ? omega1.toFixed(3) : "--"}</span>
          <span className="pill">omega2 = {Number.isFinite(omega2) ? omega2.toFixed(3) : "--"}</span>
          <span className="pill">beat = {Number.isFinite(omega2) && Number.isFinite(omega1) ? (omega2 - omega1).toFixed(3) : "--"}</span>
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
      <PlotCanvas
        series={[
          { id: "x1", points: x1Series, color: "#0b7285", label: "x1" },
          { id: "x2", points: x2Series, color: "#d97706", label: "x2" }
        ]}
        xLabel="t"
        yLabel="x"
        showLegend
      />
      <PlotCanvas
        series={[
          { id: "e1", points: energy1Series, color: "#2563eb", label: "E1" },
          { id: "e2", points: energy2Series, color: "#f59e0b", label: "E2" },
          { id: "et", points: totalEnergySeries, color: "#16a34a", label: "Etot", dash: [6, 6] }
        ]}
        xLabel="t"
        yLabel="energy"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "phase", points: phaseSeries, color: "#0f766e", label: "x1 vs x2" }]}
        xLabel="x1"
        yLabel="x2"
        showLegend
      />
    </div>
  );
}

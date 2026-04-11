"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";
import { pendulumPeriods, simulatePendulum } from "../lib/physics/models/pendulum";

export function PendulumSim() {
  const [theta0, setTheta0] = useState("30");
  const [omega0, setOmega0] = useState("0");
  const [length, setLength] = useState("1");
  const [g, setG] = useState("9.81");
  const [damping, setDamping] = useState("0.05");
  const [dt, setDt] = useState("0.02");
  const [duration, setDuration] = useState("12");
  const [trailLength, setTrailLength] = useState("160");
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const { points, periodSmall, periodExact, thetaSeries, omegaSeries, energyDrift, simDt } = useMemo(() => {
    const theta0Val = Number(theta0);
    const omega0Val = Number(omega0);
    const lVal = Number(length);
    const gVal = Number(g);
    const dampingVal = Number(damping);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (
      !Number.isFinite(theta0Val) ||
      !Number.isFinite(omega0Val) ||
      !Number.isFinite(lVal) ||
      !Number.isFinite(gVal) ||
      !Number.isFinite(dampingVal) ||
      !Number.isFinite(dtVal) ||
      !Number.isFinite(durVal)
    ) {
      return {
        points: [],
        periodSmall: NaN,
        periodExact: NaN,
        thetaSeries: [] as number[],
        omegaSeries: [] as number[],
        energyDrift: NaN,
        simDt: NaN
      };
    }
    if (lVal <= 0 || gVal <= 0 || dtVal <= 0 || durVal <= 0) {
      return {
        points: [],
        periodSmall: NaN,
        periodExact: NaN,
        thetaSeries: [] as number[],
        omegaSeries: [] as number[],
        energyDrift: NaN,
        simDt: NaN
      };
    }
    const steps = Math.min(2400, Math.max(10, Math.floor(durVal / dtVal)));
    const sim = simulatePendulum({
      theta0Deg: theta0Val,
      omega0Deg: omega0Val,
      length: lVal,
      g: gVal,
      damping: dampingVal,
      duration: durVal,
      steps
    });
    const periods = pendulumPeriods(theta0Val, lVal, gVal);
    const energy = sim.energy;
    const e0 = energy[0] ?? 0;
    const eMax = energy.length ? Math.max(...energy) : 0;
    const eMin = energy.length ? Math.min(...energy) : 0;
    const drift = e0 !== 0 ? ((eMax - eMin) / Math.abs(e0)) * 100 : NaN;
    return {
      points: sim.points,
      thetaSeries: sim.thetaSeries,
      omegaSeries: sim.omegaSeries,
      periodSmall: periods.smallAngle,
      periodExact: periods.exact,
      energyDrift: drift,
      simDt: sim.dt
    };
  }, [theta0, omega0, length, g, damping, dt, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || thetaSeries.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 320;
    const height = 320;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const origin = { x: width / 2, y: 40 };
    const rodLength = 180;
    const trailLen = Math.max(20, Math.min(thetaSeries.length, Math.floor(Number(trailLength) || 160)));

    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const head = 8;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    const draw = (index: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(15,23,42,0.2)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(origin.x, origin.y + rodLength + 60);
      ctx.stroke();
      ctx.setLineDash([]);

      const idx = Math.min(thetaSeries.length - 1, index);
      const thetaVal = thetaSeries[idx];
      const omegaVal = omegaSeries[idx] ?? 0;
      const bobX = origin.x + rodLength * Math.sin(thetaVal);
      const bobY = origin.y + rodLength * Math.cos(thetaVal);

      const trailStart = Math.max(0, idx - trailLen);
      if (trailStart < idx) {
        ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = trailStart; i <= idx; i += 1) {
          const tVal = thetaSeries[i];
          const tx = origin.x + rodLength * Math.sin(tVal);
          const ty = origin.y + rodLength * Math.cos(tVal);
          if (i === trailStart) {
            ctx.moveTo(tx, ty);
          } else {
            ctx.lineTo(tx, ty);
          }
        }
        ctx.stroke();
      }

      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 46, Math.PI / 2, Math.PI / 2 + thetaVal, thetaVal < 0);
      ctx.stroke();

      const velScale = 0.22 * rodLength;
      const tx = Math.cos(thetaVal);
      const ty = -Math.sin(thetaVal);
      drawArrow(bobX, bobY, bobX + tx * omegaVal * velScale, bobY + ty * omegaVal * velScale, "#2563eb");

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, Math.PI * 2);
      ctx.fill();

      drawArrow(bobX, bobY, bobX, bobY + 50, "#dc2626");
      drawArrow(bobX, bobY, bobX - 40 * Math.sin(thetaVal), bobY - 40 * Math.cos(thetaVal), "#0f766e");
    };

    const step = (now: number) => {
      if (!isPlaying) {
        const idx = Math.floor((timeRef.current / Number(duration)) * thetaSeries.length);
        draw(idx);
        return;
      }
      const lastTime = lastRef.current ?? now;
      const dtStep = (now - lastTime) / 1000;
      lastRef.current = now;
      timeRef.current = (timeRef.current + dtStep) % Number(duration);
      const idx = Math.floor((timeRef.current / Number(duration)) * thetaSeries.length);
      draw(idx);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [thetaSeries, omegaSeries, isPlaying, duration, trailLength]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Pendulum Simulator</div>
      <div className="demo-grid">
        <label className="field">
          <span>theta0 (deg)</span>
          <input type="number" value={theta0} onChange={(event) => setTheta0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega0 (deg/s)</span>
          <input type="number" value={omega0} onChange={(event) => setOmega0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>length (m)</span>
          <input type="number" value={length} onChange={(event) => setLength(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>g (m/s^2)</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>damping (1/s)</span>
          <input type="number" value={damping} onChange={(event) => setDamping(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt (s)</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration (s)</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>trail length</span>
          <input type="number" value={trailLength} onChange={(event) => setTrailLength(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">
            Small-angle period = {Number.isFinite(periodSmall) ? periodSmall.toFixed(2) : "--"} s
          </span>
          <span className="pill">
            Exact period = {Number.isFinite(periodExact) ? periodExact.toFixed(2) : "--"} s
          </span>
          <span className="pill">
            Energy drift = {Number.isFinite(energyDrift) ? energyDrift.toFixed(2) : "--"}%
          </span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\theta'' + \frac{g}{L} \sin(\theta) + \gamma \theta' = 0`} />
        </div>
        {Math.abs(Number(theta0)) > 15 ? (
          <div className="demo-note">
            Warning: small-angle approximation becomes inaccurate above about 15 degrees.
          </div>
        ) : null}
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
      <PlotCanvas series={[{ id: "pendulum", points, color: "#0b7285" }]} xLabel="t" yLabel="theta (deg)" />
    </div>
  );
}

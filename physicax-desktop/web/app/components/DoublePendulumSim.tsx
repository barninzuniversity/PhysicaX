"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

type Frame = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  t: number;
  theta1: number;
  theta2: number;
  v2: number;
};

export function DoublePendulumSim() {
  const [theta1, setTheta1] = useState("1.1");
  const [theta2, setTheta2] = useState("1.8");
  const [omega1, setOmega1] = useState("0");
  const [omega2, setOmega2] = useState("0");
  const [l1, setL1] = useState("1");
  const [l2, setL2] = useState("1");
  const [m1, setM1] = useState("1");
  const [m2, setM2] = useState("1");
  const [g, setG] = useState("9.81");
  const [dt, setDt] = useState("0.01");
  const [steps, setSteps] = useState("2400");
  const [trailLength, setTrailLength] = useState("180");
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  const { frames, series1, series2 } = useMemo(() => {
    const th1 = Number(theta1);
    const th2 = Number(theta2);
    const om1 = Number(omega1);
    const om2 = Number(omega2);
    const l1Val = Number(l1);
    const l2Val = Number(l2);
    const m1Val = Number(m1);
    const m2Val = Number(m2);
    const gVal = Number(g);
    const dtVal = Number(dt);
    const stepsVal = Math.min(5000, Math.max(600, Math.floor(Number(steps))));
    if (
      !Number.isFinite(th1) ||
      !Number.isFinite(th2) ||
      !Number.isFinite(om1) ||
      !Number.isFinite(om2) ||
      !Number.isFinite(l1Val) ||
      !Number.isFinite(l2Val) ||
      !Number.isFinite(m1Val) ||
      !Number.isFinite(m2Val) ||
      !Number.isFinite(gVal) ||
      !Number.isFinite(dtVal) ||
      l1Val <= 0 ||
      l2Val <= 0 ||
      m1Val <= 0 ||
      m2Val <= 0 ||
      dtVal <= 0
    ) {
      return { frames: [] as Frame[], series1: [], series2: [] };
    }

    let t1 = th1;
    let t2 = th2;
    let w1 = om1;
    let w2 = om2;
    const out: Frame[] = [];
    const s1: { x: number; y: number }[] = [];
    const s2: { x: number; y: number }[] = [];

    const deriv = (th1Val: number, th2Val: number, w1Val: number, w2Val: number) => {
      const delta = th2Val - th1Val;
      const den1 = (m1Val + m2Val) * l1Val - m2Val * l1Val * Math.cos(delta) * Math.cos(delta);
      const den2 = (l2Val / l1Val) * den1;
      const dw1 =
        (m2Val * l1Val * w1Val * w1Val * Math.sin(delta) * Math.cos(delta) +
          m2Val * gVal * Math.sin(th2Val) * Math.cos(delta) +
          m2Val * l2Val * w2Val * w2Val * Math.sin(delta) -
          (m1Val + m2Val) * gVal * Math.sin(th1Val)) /
        den1;
      const dw2 =
        (-m2Val * l2Val * w2Val * w2Val * Math.sin(delta) * Math.cos(delta) +
          (m1Val + m2Val) * gVal * Math.sin(th1Val) * Math.cos(delta) -
          (m1Val + m2Val) * l1Val * w1Val * w1Val * Math.sin(delta) -
          (m1Val + m2Val) * gVal * Math.sin(th2Val)) /
        den2;
      return { dth1: w1Val, dth2: w2Val, dw1, dw2 };
    };

    let time = 0;
    let prevX2 = 0;
    let prevY2 = 0;
    for (let i = 0; i < stepsVal; i += 1) {
      const k1 = deriv(t1, t2, w1, w2);
      const k2 = deriv(
        t1 + 0.5 * dtVal * k1.dth1,
        t2 + 0.5 * dtVal * k1.dth2,
        w1 + 0.5 * dtVal * k1.dw1,
        w2 + 0.5 * dtVal * k1.dw2
      );
      const k3 = deriv(
        t1 + 0.5 * dtVal * k2.dth1,
        t2 + 0.5 * dtVal * k2.dth2,
        w1 + 0.5 * dtVal * k2.dw1,
        w2 + 0.5 * dtVal * k2.dw2
      );
      const k4 = deriv(
        t1 + dtVal * k3.dth1,
        t2 + dtVal * k3.dth2,
        w1 + dtVal * k3.dw1,
        w2 + dtVal * k3.dw2
      );
      t1 += (dtVal / 6) * (k1.dth1 + 2 * k2.dth1 + 2 * k3.dth1 + k4.dth1);
      t2 += (dtVal / 6) * (k1.dth2 + 2 * k2.dth2 + 2 * k3.dth2 + k4.dth2);
      w1 += (dtVal / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1);
      w2 += (dtVal / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2);
      time += dtVal;

      const x1 = l1Val * Math.sin(t1);
      const y1 = -l1Val * Math.cos(t1);
      const x2 = x1 + l2Val * Math.sin(t2);
      const y2 = y1 - l2Val * Math.cos(t2);
      const v2 = i === 0 ? 0 : Math.hypot(x2 - prevX2, y2 - prevY2) / dtVal;
      out.push({ x1, y1, x2, y2, t: time, theta1: t1, theta2: t2, v2 });
      prevX2 = x2;
      prevY2 = y2;
      s1.push({ x: time, y: t1 });
      s2.push({ x: time, y: t2 });
    }
    return { frames: out, series1: s1, series2: s2 };
  }, [theta1, theta2, omega1, omega2, l1, l2, m1, m2, g, dt, steps]);

  useEffect(() => {
    indexRef.current = 0;
  }, [frames]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 480;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const maxLen = Math.max(Number(l1) + Number(l2), 1);
    const scale = (Math.min(width, height) * 0.38) / maxLen;
    const maxSpeed = Math.max(1e-3, ...frames.map((frame) => frame.v2));
    const trailLen = Math.max(40, Math.min(frames.length, Math.floor(Number(trailLength) || 180)));

    const speedColor = (speed: number) => {
      const tVal = Math.max(0, Math.min(1, speed / maxSpeed));
      const hue = 220 - 190 * tVal;
      const sat = 70 + 20 * tVal;
      const light = 45 + 10 * tVal;
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    };

    const draw = (index: number) => {
      const frame = frames[index] ?? frames[0];
      if (!frame) {
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 30;
      const x1 = cx + frame.x1 * scale;
      const y1 = cy + frame.y1 * scale;
      const x2 = cx + frame.x2 * scale;
      const y2 = cy + frame.y2 * scale;

      ctx.strokeStyle = "rgba(15,23,42,0.18)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 80);
      ctx.lineTo(cx, cy + 120);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(x1, y1, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.arc(x2, y2, 8, 0, Math.PI * 2);
      ctx.fill();

      const trailStart = Math.max(0, index - trailLen);
      for (let i = trailStart + 1; i <= index; i += 1) {
        const prev = frames[i - 1];
        const curr = frames[i];
        const px = cx + prev.x2 * scale;
        const py = cy + prev.y2 * scale;
        const tx = cx + curr.x2 * scale;
        const ty = cy + curr.y2 * scale;
        ctx.strokeStyle = speedColor(curr.v2);
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    };

    const step = () => {
      const idx = indexRef.current % frames.length;
      draw(idx);
      if (isPlaying) {
        indexRef.current = idx + 1;
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [frames, isPlaying, l1, l2, trailLength]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Double Pendulum (Chaotic)</div>
      <div className="demo-grid">
        <label className="field">
          <span>theta1 (rad)</span>
          <input type="number" value={theta1} onChange={(event) => setTheta1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>theta2 (rad)</span>
          <input type="number" value={theta2} onChange={(event) => setTheta2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega1</span>
          <input type="number" value={omega1} onChange={(event) => setOmega1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega2</span>
          <input type="number" value={omega2} onChange={(event) => setOmega2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>L1</span>
          <input type="number" value={l1} onChange={(event) => setL1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>L2</span>
          <input type="number" value={l2} onChange={(event) => setL2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>m1</span>
          <input type="number" value={m1} onChange={(event) => setM1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>m2</span>
          <input type="number" value={m2} onChange={(event) => setM2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>g</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
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
          <span>trail length</span>
          <input type="number" value={trailLength} onChange={(event) => setTrailLength(event.target.value)} step="1" />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => (indexRef.current = 0)}>
          Reset
        </button>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} />
      </div>
      <PlotCanvas
        series={[
          { id: "theta1", points: series1, color: "#2563eb", label: "theta1(t)" },
          { id: "theta2", points: series2, color: "#d97706", label: "theta2(t)" }
        ]}
        xLabel="t"
        yLabel="angle"
        showLegend
      />
    </div>
  );
}

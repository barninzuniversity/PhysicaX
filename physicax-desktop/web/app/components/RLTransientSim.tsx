"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function RLTransientSim() {
  const [mode, setMode] = useState<"charge" | "discharge">("charge");
  const [v, setV] = useState("5");
  const [i0, setI0] = useState("0");
  const [r, setR] = useState("50");
  const [l, setL] = useState("0.5");
  const [t, setT] = useState("0.2");
  const [tMax, setTMax] = useState("1");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { tau, i, vL, vR, currentSeries, vSeries } = useMemo(() => {
    const vVal = Number(v);
    const i0Val = Number(i0);
    const rVal = Number(r);
    const lVal = Number(l);
    const tVal = Number(t);
    const tMaxVal = Number(tMax);
    if (
      !Number.isFinite(vVal) ||
      !Number.isFinite(i0Val) ||
      !Number.isFinite(rVal) ||
      !Number.isFinite(lVal) ||
      rVal <= 0 ||
      lVal <= 0
    ) {
      return { tau: NaN, i: NaN, vL: NaN, vR: NaN, currentSeries: [], vSeries: [] };
    }
    const tauVal = lVal / rVal;
    const vSource = mode === "discharge" ? 0 : vVal;
    const iInf = vSource / rVal;
    const iVal = iInf + (i0Val - iInf) * Math.exp(-tVal / tauVal);
    const vLVal = (vSource - rVal * i0Val) * Math.exp(-tVal / tauVal);
    const vRVal = rVal * iVal;
    const endTime = Number.isFinite(tMaxVal) && tMaxVal > 0 ? tMaxVal : Math.max(5 * tauVal, tVal);
    const steps = 220;
    const currentPts: { x: number; y: number }[] = [];
    const voltPts: { x: number; y: number }[] = [];
    for (let step = 0; step <= steps; step += 1) {
      const tt = (endTime * step) / steps;
      const iT = iInf + (i0Val - iInf) * Math.exp(-tt / tauVal);
      const vLTime = (vSource - rVal * i0Val) * Math.exp(-tt / tauVal);
      currentPts.push({ x: tt, y: iT });
      voltPts.push({ x: tt, y: vLTime });
    }
    return { tau: tauVal, i: iVal, vL: vLVal, vR: vRVal, currentSeries: currentPts, vSeries: voltPts };
  }, [v, i0, r, l, t, tMax, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const width = 320;
    const height = 160;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.lineTo(80, 80);
    ctx.stroke();

    ctx.strokeStyle = "#6b7280";
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const x = 80 + i * 18;
      ctx.arc(x, 80, 8, Math.PI, 0, false);
    }
    ctx.stroke();

    ctx.strokeStyle = "#1f2937";
    ctx.beginPath();
    ctx.moveTo(80 + 4 * 18, 80);
    ctx.lineTo(210, 80);
    ctx.stroke();

    const iVal = Number.isFinite(i) ? i : 0;
    const vSource = mode === "discharge" ? 0 : Number(v);
    const denom = Number(r) > 0 ? Math.abs(vSource / Number(r)) : 1;
    const arrow = denom ? Math.max(0, Math.min(1, Math.abs(iVal / denom))) : 0;
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 120);
    ctx.lineTo(60 + 70 * arrow, 120);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60 + 70 * arrow, 120);
    ctx.lineTo(60 + 70 * arrow - 8, 114);
    ctx.lineTo(60 + 70 * arrow - 8, 126);
    ctx.closePath();
    ctx.fillStyle = "#d97706";
    ctx.fill();
  }, [i, v, r, mode]);

  return (
    <div className="demo-panel">
      <div className="demo-title">RL Step Response</div>
      <div className="demo-grid">
        <label className="field">
          <span>mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as "charge" | "discharge")}>
            <option value="charge">Charge</option>
            <option value="discharge">Discharge</option>
          </select>
        </label>
        <label className="field">
          <span>V source (V)</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>I(0) (A)</span>
          <input type="number" value={i0} onChange={(event) => setI0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>R (ohm)</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>L (H)</span>
          <input type="number" value={l} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>t (s)</span>
          <input type="number" value={t} onChange={(event) => setT(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>t max (s)</span>
          <input type="number" value={tMax} onChange={(event) => setTMax(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">tau = {Number.isFinite(tau) ? tau.toExponential(3) : "--"} s</span>
          <span className="pill">i(t) = {Number.isFinite(i) ? i.toExponential(3) : "--"} A</span>
          <span className="pill">V_L = {Number.isFinite(vL) ? vL.toFixed(3) : "--"} V</span>
          <span className="pill">V_R = {Number.isFinite(vR) ? vR.toFixed(3) : "--"} V</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`i(t)=\frac{V_s}{R}+(I_0-\frac{V_s}{R})e^{-t/\tau},\; \tau=\frac{L}{R}`} />
        </div>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} />
      </div>
      <PlotCanvas
        series={[
          { id: "i", points: currentSeries, color: "#d97706", label: "i(t)" },
          { id: "vl", points: vSeries, color: "#2563eb", label: "V_L(t)" }
        ]}
        xLabel="t (s)"
        yLabel="response"
        showLegend
      />
    </div>
  );
}

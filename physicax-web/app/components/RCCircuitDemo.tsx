"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MathInline } from "./MathBlock";
import { PlotCanvas } from "./PlotCanvas";

export function RCCircuitDemo() {
  const [mode, setMode] = useState<"charge" | "discharge">("charge");
  const [v, setV] = useState("5");
  const [vC0, setVC0] = useState("0");
  const [r, setR] = useState("1000");
  const [c, setC] = useState("0.000001");
  const [t, setT] = useState("0.002");
  const [tMax, setTMax] = useState("0.01");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { tau, q, i, voltageSeries, currentSeries } = useMemo(() => {
    const vVal = Number(v);
    const vC0Val = Number(vC0);
    const rVal = Number(r);
    const cVal = Number(c);
    const tVal = Number(t);
    const tMaxVal = Number(tMax);
    if (
      !Number.isFinite(vVal) ||
      !Number.isFinite(vC0Val) ||
      !Number.isFinite(rVal) ||
      !Number.isFinite(cVal) ||
      !Number.isFinite(tVal) ||
      rVal <= 0 ||
      cVal <= 0
    ) {
      return { tau: NaN, q: NaN, i: NaN, voltageSeries: [], currentSeries: [] };
    }
    const tauVal = rVal * cVal;
    const vSource = mode === "discharge" ? 0 : vVal;
    const vCap = vSource + (vC0Val - vSource) * Math.exp(-tVal / tauVal);
    const qVal = cVal * vCap;
    const iVal = ((vSource - vC0Val) / rVal) * Math.exp(-tVal / tauVal);
    const endTime = Number.isFinite(tMaxVal) && tMaxVal > 0 ? tMaxVal : Math.max(5 * tauVal, tVal);
    const steps = 220;
    const voltagePts: { x: number; y: number }[] = [];
    const currentPts: { x: number; y: number }[] = [];
    for (let step = 0; step <= steps; step += 1) {
      const tt = (endTime * step) / steps;
      const vCapTime = vSource + (vC0Val - vSource) * Math.exp(-tt / tauVal);
      const iT = ((vSource - vC0Val) / rVal) * Math.exp(-tt / tauVal);
      voltagePts.push({ x: tt, y: vCapTime });
      currentPts.push({ x: tt, y: iT });
    }
    return { tau: tauVal, q: qVal, i: iVal, voltageSeries: voltagePts, currentSeries: currentPts };
  }, [v, vC0, r, c, t, tMax, mode]);

  const tauText = Number.isFinite(tau) ? `${tau.toExponential(3)} s` : "--";
  const qText = Number.isFinite(q) ? `${q.toExponential(3)} C` : "--";
  const iText = Number.isFinite(i) ? `${i.toExponential(3)} A` : "--";

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
    ctx.moveTo(40, 80);
    ctx.lineTo(110, 80);
    ctx.stroke();

    ctx.strokeStyle = "#6b7280";
    ctx.beginPath();
    ctx.moveTo(110, 60);
    ctx.lineTo(110, 100);
    ctx.moveTo(130, 60);
    ctx.lineTo(130, 100);
    ctx.stroke();

    const vVal = Number(v);
    const vC0Val = Number(vC0);
    const vSource = mode === "discharge" ? 0 : vVal;
    const cVal = Number(c);
    const denom = Math.max(Math.abs(vSource), Math.abs(vC0Val), 1e-6);
    const ratio = Number.isFinite(q) && cVal > 0 ? q / (cVal * denom) : 0;
    ctx.fillStyle = "rgba(59,130,246,0.35)";
    ctx.fillRect(110, 60 + (1 - ratio) * 40, 20, ratio * 40);

    ctx.strokeStyle = "#1f2937";
    ctx.beginPath();
    ctx.moveTo(130, 80);
    ctx.lineTo(220, 80);
    ctx.stroke();

    const iVal = Number.isFinite(i) ? i : 0;
    const denomCurrent = Number(r) > 0 ? Math.abs(vSource - vC0Val) / Number(r) : 1;
    const arrow = denomCurrent ? Math.max(-1, Math.min(1, iVal / denomCurrent)) : 0;
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(60 + 60 * arrow, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60 + 60 * arrow, 110);
    ctx.lineTo(60 + 60 * arrow - 8, 104);
    ctx.lineTo(60 + 60 * arrow - 8, 116);
    ctx.closePath();
    ctx.fillStyle = "#d97706";
    ctx.fill();
  }, [q, i, v, vC0, c, r, mode]);

  return (
    <div className="demo-panel">
      <div className="demo-title">RC Step Response</div>
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
          <span>V_c(0) (V)</span>
          <input type="number" value={vC0} onChange={(event) => setVC0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>R (ohm)</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>C (F)</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
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
          <span className="pill">tau = {tauText}</span>
          <span className="pill">q(t) = {qText}</span>
          <span className="pill">i(t) = {iText}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`V_C(t)=V_s+(V_{C0}-V_s)e^{-t/(RC)},\; i(t)=\frac{V_s-V_{C0}}{R}e^{-t/(RC)}`} />
        </div>
      </div>
      <div className="plot-frame">
        <canvas ref={canvasRef} />
      </div>
      <PlotCanvas
        series={[
          { id: "vc", points: voltageSeries, color: "#2563eb", label: "V_c(t)" },
          {
            id: "vsrc",
            points: voltageSeries.map((p) => ({
              x: p.x,
              y: mode === "discharge" ? 0 : Number(v) || 0
            })),
            color: "#94a3b8",
            label: "V source",
            dash: [6, 6]
          }
        ]}
        xLabel="t (s)"
        yLabel="Voltage (V)"
        showLegend
      />
      <PlotCanvas
        series={[{ id: "i", points: currentSeries, color: "#d97706", label: "i(t)" }]}
        xLabel="t (s)"
        yLabel="Current (A)"
        showLegend
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function ODESolverCompareSim() {
  const [k, setK] = useState("0.6");
  const [y0, setY0] = useState("1");
  const [dt, setDt] = useState("0.2");
  const [duration, setDuration] = useState("6");

  const { exact, euler, rk4, errEuler, errRk4 } = useMemo(() => {
    const kVal = Number(k);
    const y0Val = Number(y0);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (!Number.isFinite(kVal) || !Number.isFinite(y0Val) || !Number.isFinite(dtVal) || !Number.isFinite(durVal)) {
      return { exact: [], euler: [], rk4: [], errEuler: NaN, errRk4: NaN };
    }
    if (dtVal <= 0 || durVal <= 0) {
      return { exact: [], euler: [], rk4: [], errEuler: NaN, errRk4: NaN };
    }
    const steps = Math.min(1000, Math.max(10, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;
    const exactPts: { x: number; y: number }[] = [];
    const eulerPts: { x: number; y: number }[] = [];
    const rk4Pts: { x: number; y: number }[] = [];
    let yEuler = y0Val;
    let yRk4 = y0Val;

    for (let i = 0; i <= steps; i += 1) {
      const t = i * dtStep;
      const yExact = y0Val * Math.exp(-kVal * t);
      exactPts.push({ x: t, y: yExact });
      eulerPts.push({ x: t, y: yEuler });
      rk4Pts.push({ x: t, y: yRk4 });

      const f = (yVal: number) => -kVal * yVal;
      yEuler = yEuler + dtStep * f(yEuler);

      const k1 = f(yRk4);
      const k2 = f(yRk4 + 0.5 * dtStep * k1);
      const k3 = f(yRk4 + 0.5 * dtStep * k2);
      const k4 = f(yRk4 + dtStep * k3);
      yRk4 = yRk4 + (dtStep / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    }

    const yExactEnd = y0Val * Math.exp(-kVal * durVal);
    return {
      exact: exactPts,
      euler: eulerPts,
      rk4: rk4Pts,
      errEuler: Math.abs(yEuler - yExactEnd),
      errRk4: Math.abs(yRk4 - yExactEnd)
    };
  }, [k, y0, dt, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">ODE Solver Comparison</div>
      <div className="demo-grid">
        <label className="field">
          <span>k</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>y0</span>
          <input type="number" value={y0} onChange={(event) => setY0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
      </div>
      <div className="metric-grid">
        <div className="metric-card">Euler error: {Number.isFinite(errEuler) ? errEuler.toExponential(2) : "--"}</div>
        <div className="metric-card">RK4 error: {Number.isFinite(errRk4) ? errRk4.toExponential(2) : "--"}</div>
      </div>
      <PlotCanvas
        series={[
          { id: "exact", points: exact, color: "#9ca3af", dash: [6, 4], label: "exact" },
          { id: "euler", points: euler, color: "#d97706", label: "euler" },
          { id: "rk4", points: rk4, color: "#0b7285", label: "rk4" }
        ]}
        xLabel="t"
        yLabel="y"
        showLegend
      />
      <div className="demo-note">
        <MathInline latex={String.raw`y' = -k y,\; y(t)=y_0 e^{-k t}`} />
      </div>
    </div>
  );
}


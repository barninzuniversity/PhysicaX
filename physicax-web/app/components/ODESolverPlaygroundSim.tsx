"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Model = "decay" | "oscillator";

export function ODESolverPlaygroundSim() {
  const [model, setModel] = useState<Model>("decay");
  const [k, setK] = useState("0.8");
  const [omega, setOmega] = useState("2.5");
  const [y0, setY0] = useState("1");
  const [v0, setV0] = useState("0");
  const [dt, setDt] = useState("0.05");
  const [duration, setDuration] = useState("8");

  const {
    euler,
    heun,
    rk4,
    implicit,
    symplectic,
    energyEuler,
    energySym,
    rec
  } = useMemo(() => {
    const kVal = Number(k);
    const omegaVal = Number(omega);
    const y0Val = Number(y0);
    const v0Val = Number(v0);
    const dtVal = Number(dt);
    const durVal = Number(duration);
    if (!Number.isFinite(dtVal) || !Number.isFinite(durVal) || dtVal <= 0 || durVal <= 0) {
      return { euler: [], heun: [], rk4: [], implicit: [], symplectic: [], energyEuler: [], energySym: [], rec: "" };
    }
    const steps = Math.min(2200, Math.max(12, Math.floor(durVal / dtVal)));
    const dtStep = durVal / steps;

    const ePts: { x: number; y: number }[] = [];
    const hPts: { x: number; y: number }[] = [];
    const rPts: { x: number; y: number }[] = [];
    const iPts: { x: number; y: number }[] = [];
    const sPts: { x: number; y: number }[] = [];
    const eEnergy: { x: number; y: number }[] = [];
    const sEnergy: { x: number; y: number }[] = [];

    if (model === "decay") {
      let yE = y0Val;
      let yH = y0Val;
      let yR = y0Val;
      let yI = y0Val;
      const f = (yVal: number) => -kVal * yVal;

      for (let i = 0; i <= steps; i += 1) {
        const t = i * dtStep;
        ePts.push({ x: t, y: yE });
        hPts.push({ x: t, y: yH });
        rPts.push({ x: t, y: yR });
        iPts.push({ x: t, y: yI });

        yE = yE + dtStep * f(yE);
        const yPred = yH + dtStep * f(yH);
        yH = yH + (dtStep / 2) * (f(yH) + f(yPred));
        const k1 = f(yR);
        const k2 = f(yR + 0.5 * dtStep * k1);
        const k3 = f(yR + 0.5 * dtStep * k2);
        const k4 = f(yR + dtStep * k3);
        yR = yR + (dtStep / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        yI = yI / (1 + kVal * dtStep);
      }
      const stiff = kVal * dtVal > 1.2;
      const rec = stiff ? "Implicit or RK4 recommended (stiff decay)." : "Heun/RK4 recommended for accuracy.";
      return { euler: ePts, heun: hPts, rk4: rPts, implicit: iPts, symplectic: [], energyEuler: [], energySym: [], rec };
    }

    let xE = y0Val;
    let vE = v0Val;
    let xS = y0Val;
    let vS = v0Val;
    let xR = y0Val;
    let vR = v0Val;
    const accel = (xVal: number) => -omegaVal * omegaVal * xVal;
    for (let i = 0; i <= steps; i += 1) {
      const t = i * dtStep;
      ePts.push({ x: t, y: xE });
      sPts.push({ x: t, y: xS });
      rPts.push({ x: t, y: xR });
      eEnergy.push({ x: t, y: 0.5 * (vE * vE + omegaVal * omegaVal * xE * xE) });
      sEnergy.push({ x: t, y: 0.5 * (vS * vS + omegaVal * omegaVal * xS * xS) });

      vE += dtStep * accel(xE);
      xE += dtStep * vE;

      vS += dtStep * accel(xS);
      xS += dtStep * vS;

      const k1x = vR;
      const k1v = accel(xR);
      const k2x = vR + 0.5 * dtStep * k1v;
      const k2v = accel(xR + 0.5 * dtStep * k1x);
      const k3x = vR + 0.5 * dtStep * k2v;
      const k3v = accel(xR + 0.5 * dtStep * k2x);
      const k4x = vR + dtStep * k3v;
      const k4v = accel(xR + dtStep * k3x);
      xR += (dtStep / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      vR += (dtStep / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    const rec = dtVal * omegaVal > 0.25 ? "Symplectic or RK4 recommended (large dt)." : "Symplectic keeps energy stable.";
    return { euler: ePts, heun: [], rk4: rPts, implicit: [], symplectic: sPts, energyEuler: eEnergy, energySym: sEnergy, rec };
  }, [model, k, omega, y0, v0, dt, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">ODE Solver Playground</div>
      <div className="demo-grid">
        <label className="field">
          <span>Model</span>
          <select value={model} onChange={(event) => setModel(event.target.value as Model)}>
            <option value="decay">Exponential decay</option>
            <option value="oscillator">Simple oscillator</option>
          </select>
        </label>
        <label className="field">
          <span>k (decay)</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>omega (oscillator)</span>
          <input type="number" value={omega} onChange={(event) => setOmega(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>y0</span>
          <input type="number" value={y0} onChange={(event) => setY0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v0 (oscillator)</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
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
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{rec}</span>
          <span className="pill">
            {model === "decay" ? <MathInline latex={"y'=-k y"} /> : <MathInline latex={"x''+\\omega^2 x=0"} />}
          </span>
        </div>
      </div>
      <div className="demo-stack">
        <PlotCanvas
          series={[
            { id: "euler", points: euler, color: "#d97706", label: "Euler" },
            { id: "heun", points: heun, color: "#4f46e5", label: "Heun" },
            { id: "rk4", points: rk4, color: "#0f766e", label: "RK4" },
            { id: "implicit", points: implicit, color: "#111827", label: "Implicit" },
            { id: "sym", points: symplectic, color: "#2563eb", label: "Symplectic" }
          ].filter((s) => s.points.length)}
          xLabel="t"
          yLabel="y"
          showLegend
        />
        {energyEuler.length ? (
          <PlotCanvas
            series={[
              { id: "e", points: energyEuler, color: "#d97706", label: "Euler energy" },
              { id: "s", points: energySym, color: "#0f766e", label: "Symplectic energy" }
            ]}
            xLabel="t"
            yLabel="E"
            showLegend
          />
        ) : null}
      </div>
    </div>
  );
}

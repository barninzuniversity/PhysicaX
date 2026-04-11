"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

const G = 9.81;

const simpsonIntegrate = (fn: (x: number) => number, a: number, b: number, n = 600) => {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < steps; i += 1) {
    const x = a + h * i;
    sum += fn(x) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
};

const pendulumPeriod = (theta0: number, length: number) => {
  const k = Math.sin(theta0 / 2);
  const integrand = (phi: number) => 1 / Math.sqrt(1 - k * k * Math.sin(phi) ** 2);
  const integral = simpsonIntegrate(integrand, 0, Math.PI / 2, 600);
  return 4 * Math.sqrt(length / G) * integral;
};

const pendulumSmallAngle = (length: number) => 2 * Math.PI * Math.sqrt(length / G);

const pendulumSeries = (theta0: number, length: number) => {
  const base = pendulumSmallAngle(length);
  const t2 = (1 / 16) * theta0 ** 2;
  const t4 = (11 / 3072) * theta0 ** 4;
  const t6 = (173 / 737280) * theta0 ** 6;
  return base * (1 + t2 + t4 + t6);
};

const simulateProjectile = (
  v0: number,
  angle: number,
  dragK: number,
  mass: number,
  dt = 0.005,
  steps = 20000
) => {
  let x = 0;
  let y = 0;
  let vx = v0 * Math.cos(angle);
  let vy = v0 * Math.sin(angle);
  for (let i = 0; i < steps; i += 1) {
    const v = Math.hypot(vx, vy) + 1e-6;
    const ax = -(dragK / mass) * v * vx;
    const ay = -G - (dragK / mass) * v * vy;
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    if (y < 0 && i > 10) {
      break;
    }
  }
  return x;
};

const eulerStep = (y: number, k: number, dt: number) => y + dt * (-k * y);
const rk4Step = (y: number, k: number, dt: number) => {
  const k1 = -k * y;
  const k2 = -k * (y + 0.5 * dt * k1);
  const k3 = -k * (y + 0.5 * dt * k2);
  const k4 = -k * (y + dt * k3);
  return y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
};

export function ApproximationComparatorSim() {
  const { t } = useLocale();
  const [mode, setMode] = useState("pendulum");
  const [length, setLength] = useState("1");
  const [v0, setV0] = useState("25");
  const [dragK, setDragK] = useState("0.15");
  const [mass, setMass] = useState("1.5");
  const [k, setK] = useState("2.0");
  const [n, setN] = useState("1");
  const [temp, setTemp] = useState("320");
  const [vdwA, setVdwA] = useState("0.6");
  const [vdwB, setVdwB] = useState("0.04");
  const [vMin, setVMin] = useState("0.2");
  const [vMax, setVMax] = useState("3.0");

  const pendulumSeriesData = useMemo(() => {
    const L = Math.max(0.1, Number(length) || 1);
    const exact: { x: number; y: number }[] = [];
    const small: { x: number; y: number }[] = [];
    const series: { x: number; y: number }[] = [];
    const error: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i += 1) {
      const theta = (i / 60) * 1.4;
      const T = pendulumPeriod(theta, L);
      const Tsmall = pendulumSmallAngle(L);
      const Tseries = pendulumSeries(theta, L);
      exact.push({ x: theta, y: T });
      small.push({ x: theta, y: Tsmall });
      series.push({ x: theta, y: Tseries });
      error.push({ x: theta, y: ((Tseries - T) / T) * 100 });
    }
    return { exact, small, series, error };
  }, [length]);

  const projectileData = useMemo(() => {
    const speed = Math.max(1, Number(v0) || 25);
    const kVal = Math.max(0, Number(dragK) || 0.1);
    const mVal = Math.max(0.2, Number(mass) || 1.5);
    const noDrag: { x: number; y: number }[] = [];
    const drag: { x: number; y: number }[] = [];
    const error: { x: number; y: number }[] = [];
    for (let i = 10; i <= 80; i += 2) {
      const angle = (i * Math.PI) / 180;
      const R0 = (speed ** 2 * Math.sin(2 * angle)) / G;
      const Rd = simulateProjectile(speed, angle, kVal, mVal);
      noDrag.push({ x: i, y: R0 });
      drag.push({ x: i, y: Rd });
      error.push({ x: i, y: ((Rd - R0) / Math.max(1e-6, R0)) * 100 });
    }
    return { noDrag, drag, error };
  }, [v0, dragK, mass]);

  const solverData = useMemo(() => {
    const kVal = Math.max(0.2, Number(k) || 2);
    const exact = (t: number) => Math.exp(-kVal * t);
    const eulerErr: { x: number; y: number }[] = [];
    const rkErr: { x: number; y: number }[] = [];
    const dts = [0.4, 0.2, 0.1, 0.05, 0.025, 0.0125];
    dts.forEach((dt) => {
      let yE = 1;
      let yR = 1;
      const steps = Math.ceil(2 / dt);
      for (let i = 0; i < steps; i += 1) {
        yE = eulerStep(yE, kVal, dt);
        yR = rk4Step(yR, kVal, dt);
      }
      const exactVal = exact(2);
      eulerErr.push({ x: dt, y: Math.abs(yE - exactVal) });
      rkErr.push({ x: dt, y: Math.abs(yR - exactVal) });
    });
    return { eulerErr, rkErr };
  }, [k]);

  const gasData = useMemo(() => {
    const nVal = Math.max(0.1, Number(n) || 1);
    const tVal = Math.max(10, Number(temp) || 300);
    const aVal = Math.max(0, Number(vdwA) || 0.5);
    const bVal = Math.max(0, Number(vdwB) || 0.02);
    const vLo = Math.max(0.05, Number(vMin) || 0.2);
    const vHi = Math.max(vLo + 0.05, Number(vMax) || 3);
    const R = 8.314;
    const ideal: { x: number; y: number }[] = [];
    const vdw: { x: number; y: number }[] = [];
    const error: { x: number; y: number }[] = [];
    for (let i = 0; i <= 80; i += 1) {
      const V = vLo + ((vHi - vLo) * i) / 80;
      const Pideal = (nVal * R * tVal) / V;
      const denom = Math.max(1e-6, V - nVal * bVal);
      const Pvdw = (nVal * R * tVal) / denom - aVal * (nVal / V) ** 2;
      ideal.push({ x: V, y: Pideal });
      vdw.push({ x: V, y: Pvdw });
      error.push({ x: V, y: ((Pvdw - Pideal) / Math.max(Pideal, 1e-6)) * 100 });
    }
    return { ideal, vdw, error };
  }, [n, temp, vdwA, vdwB, vMin, vMax]);

  return (
    <div className="demo-panel comparator-panel">
      <div className="demo-title">{t("approxComparatorTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("approxComparatorScenario")}</span>
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="pendulum">{t("approxComparatorPendulumOption")}</option>
            <option value="projectile">{t("approxComparatorProjectileOption")}</option>
            <option value="solver">{t("approxComparatorSolverOption")}</option>
            <option value="ideal-gas">{t("approxComparatorIdealGasOption")}</option>
          </select>
        </label>
        {mode === "pendulum" ? (
          <label className="field">
            <span>{t("approxComparatorLength")}</span>
            <input value={length} onChange={(event) => setLength(event.target.value)} type="number" step="any" />
          </label>
        ) : null}
        {mode === "projectile" ? (
          <>
            <label className="field">
              <span>{t("approxComparatorLaunchSpeed")}</span>
              <input value={v0} onChange={(event) => setV0(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorDragCoeff")}</span>
              <input value={dragK} onChange={(event) => setDragK(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorMass")}</span>
              <input value={mass} onChange={(event) => setMass(event.target.value)} type="number" step="any" />
            </label>
          </>
        ) : null}
        {mode === "solver" ? (
          <label className="field">
            <span>{t("approxComparatorDecayRate")}</span>
            <input value={k} onChange={(event) => setK(event.target.value)} type="number" step="any" />
          </label>
        ) : null}
        {mode === "ideal-gas" ? (
          <>
            <label className="field">
              <span>{t("approxComparatorMoles")}</span>
              <input value={n} onChange={(event) => setN(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorTemperature")}</span>
              <input value={temp} onChange={(event) => setTemp(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorVdwA")}</span>
              <input value={vdwA} onChange={(event) => setVdwA(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorVdwB")}</span>
              <input value={vdwB} onChange={(event) => setVdwB(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorVmin")}</span>
              <input value={vMin} onChange={(event) => setVMin(event.target.value)} type="number" step="any" />
            </label>
            <label className="field">
              <span>{t("approxComparatorVmax")}</span>
              <input value={vMax} onChange={(event) => setVMax(event.target.value)} type="number" step="any" />
            </label>
          </>
        ) : null}
      </div>

      {mode === "pendulum" ? (
        <>
          <div className="demo-note">{t("approxComparatorPendulumNote")}</div>
          <div className="plot-grid">
            <PlotCanvas
              series={[
                { id: "exact", points: pendulumSeriesData.exact, color: "#0f172a", label: t("approxComparatorExactLabel") },
                { id: "small", points: pendulumSeriesData.small, color: "#94a3b8", dash: [4, 4], label: t("approxComparatorSmallAngleLabel") },
                { id: "series", points: pendulumSeriesData.series, color: "#2563eb", label: t("approxComparatorSeriesLabel") }
              ]}
              xLabel="theta0 (rad)"
              yLabel="Period (s)"
              showLegend
            />
            <PlotCanvas
              series={[
                { id: "err", points: pendulumSeriesData.error, color: "#f97316", label: t("approxComparatorSeriesErrorLabel") }
              ]}
              xLabel="theta0 (rad)"
              yLabel="Error (%)"
              showLegend
            />
          </div>
          <div className="demo-note">
            <MathBlock latex={String.raw`T_{small} = 2\pi\sqrt{\frac{L}{g}}`} />
          </div>
        </>
      ) : null}

      {mode === "projectile" ? (
        <>
          <div className="plot-grid">
            <PlotCanvas
              series={[
                { id: "no", points: projectileData.noDrag, color: "#0f172a", label: t("approxComparatorNoDragLabel") },
                { id: "drag", points: projectileData.drag, color: "#2563eb", label: t("approxComparatorDragLabel") }
              ]}
              xLabel="Launch angle (deg)"
              yLabel="Range (m)"
              showLegend
            />
            <PlotCanvas
              series={[{ id: "err", points: projectileData.error, color: "#f97316", label: t("approxComparatorDragDeltaLabel") }]}
              xLabel="Launch angle (deg)"
              yLabel="Range change (%)"
              showLegend
            />
          </div>
          <div className="demo-note">{t("approxComparatorProjectileNote")}</div>
        </>
      ) : null}

      {mode === "solver" ? (
        <>
          <div className="plot-grid">
            <PlotCanvas
              series={[
                { id: "euler", points: solverData.eulerErr, color: "#ef4444", label: t("approxComparatorEulerErrorLabel") },
                { id: "rk4", points: solverData.rkErr, color: "#16a34a", label: t("approxComparatorRk4ErrorLabel") }
              ]}
              xLabel="dt"
              yLabel="|error| at t=2"
              showLegend
            />
          </div>
          <div className="demo-note">{t("approxComparatorSolverNote")}</div>
        </>
      ) : null}

      {mode === "ideal-gas" ? (
        <>
          <div className="plot-grid">
            <PlotCanvas
              series={[
                { id: "ideal", points: gasData.ideal, color: "#0f172a", label: t("approxComparatorIdealLabel") },
                { id: "vdw", points: gasData.vdw, color: "#2563eb", label: t("approxComparatorVdwLabel") }
              ]}
              xLabel="V"
              yLabel="P"
              showLegend
            />
            <PlotCanvas
              series={[
                { id: "err", points: gasData.error, color: "#f97316", label: t("approxComparatorVdwErrorLabel") }
              ]}
              xLabel="V"
              yLabel="ΔP / P (%)"
              showLegend
            />
          </div>
          <div className="demo-note">{t("approxComparatorIdealGasNote")}</div>
        </>
      ) : null}
    </div>
  );
}

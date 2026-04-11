"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type CycleMode = "otto" | "diesel" | "brayton";

const clampEta = (value: number) => {
  if (!Number.isFinite(value)) {
    return NaN;
  }
  return Math.min(1, Math.max(0, value));
};

export function CycleEfficiencySim() {
  const [th, setTh] = useState("900");
  const [tc, setTc] = useState("300");
  const [gamma, setGamma] = useState("1.4");
  const [r, setR] = useState("10");
  const [rho, setRho] = useState("2");
  const [rp, setRp] = useState("8");
  const [mode, setMode] = useState<CycleMode>("otto");

  const {
    etaCarnot,
    etaOtto,
    etaDiesel,
    etaBrayton,
    curve,
    xLabel
  } = useMemo(() => {
    const thVal = Number(th);
    const tcVal = Number(tc);
    const gammaVal = Number(gamma);
    const rVal = Number(r);
    const rhoVal = Number(rho);
    const rpVal = Number(rp);

    const carnot = thVal > 0 && tcVal > 0 ? clampEta(1 - tcVal / thVal) : NaN;
    const otto = rVal > 1 && gammaVal > 1 ? clampEta(1 - 1 / Math.pow(rVal, gammaVal - 1)) : NaN;
    const diesel =
      rVal > 1 && rhoVal > 1 && gammaVal > 1
        ? clampEta(
            1 -
              (1 / Math.pow(rVal, gammaVal - 1)) *
                ((Math.pow(rhoVal, gammaVal) - 1) / (gammaVal * (rhoVal - 1)))
          )
        : NaN;
    const brayton =
      rpVal > 1 && gammaVal > 1
        ? clampEta(1 - 1 / Math.pow(rpVal, (gammaVal - 1) / gammaVal))
        : NaN;

    const points: { x: number; y: number }[] = [];
    let label = "compression ratio r";
    if (mode === "otto" || mode === "diesel") {
      const maxR = 20;
      const minR = 2;
      const steps = 60;
      for (let i = 0; i <= steps; i += 1) {
        const rStep = minR + ((maxR - minR) * i) / steps;
        const eta = mode === "otto"
          ? 1 - 1 / Math.pow(rStep, gammaVal - 1)
          : 1 -
            (1 / Math.pow(rStep, gammaVal - 1)) *
              ((Math.pow(rhoVal, gammaVal) - 1) / (gammaVal * (rhoVal - 1)));
        points.push({ x: rStep, y: clampEta(eta) });
      }
      label = "compression ratio r";
    }
    if (mode === "brayton") {
      const minRp = 2;
      const maxRp = 20;
      const steps = 60;
      for (let i = 0; i <= steps; i += 1) {
        const rpStep = minRp + ((maxRp - minRp) * i) / steps;
        const eta = 1 - 1 / Math.pow(rpStep, (gammaVal - 1) / gammaVal);
        points.push({ x: rpStep, y: clampEta(eta) });
      }
      label = "pressure ratio r_p";
    }

    return {
      etaCarnot: carnot,
      etaOtto: otto,
      etaDiesel: diesel,
      etaBrayton: brayton,
      curve: points,
      xLabel: label
    };
  }, [th, tc, gamma, r, rho, rp, mode]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Cycle Efficiency Explorer</div>
      <div className="demo-grid">
        <label className="field">
          <span>Th (K)</span>
          <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Tc (K)</span>
          <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>r (compression)</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>rho (cutoff)</span>
          <input type="number" value={rho} onChange={(event) => setRho(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>r_p (pressure)</span>
          <input type="number" value={rp} onChange={(event) => setRp(event.target.value)} step="any" />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "otto" ? "active" : ""}`} onClick={() => setMode("otto")}>
          Otto
        </button>
        <button type="button" className={`control-chip ${mode === "diesel" ? "active" : ""}`} onClick={() => setMode("diesel")}>
          Diesel
        </button>
        <button type="button" className={`control-chip ${mode === "brayton" ? "active" : ""}`} onClick={() => setMode("brayton")}>
          Brayton
        </button>
      </div>
      <div className="metric-grid">
        <div className="metric-card">Carnot: {Number.isFinite(etaCarnot) ? (etaCarnot * 100).toFixed(1) : "--"}%</div>
        <div className="metric-card">Otto: {Number.isFinite(etaOtto) ? (etaOtto * 100).toFixed(1) : "--"}%</div>
        <div className="metric-card">Diesel: {Number.isFinite(etaDiesel) ? (etaDiesel * 100).toFixed(1) : "--"}%</div>
        <div className="metric-card">Brayton: {Number.isFinite(etaBrayton) ? (etaBrayton * 100).toFixed(1) : "--"}%</div>
      </div>
      <PlotCanvas
        series={[{ id: "curve", points: curve, color: "#0b7285", fill: true, label: `${mode} efficiency` }]}
        xLabel={xLabel}
        yLabel="eta"
        showLegend
      />
      <div className="demo-note">
        <MathInline latex={String.raw`\eta_{Carnot}=1-\frac{T_c}{T_h},\; \eta_{Otto}=1-\frac{1}{r^{\gamma-1}},\; \eta_{Brayton}=1-\frac{1}{r_p^{(\gamma-1)/\gamma}}`} />
      </div>
    </div>
  );
}


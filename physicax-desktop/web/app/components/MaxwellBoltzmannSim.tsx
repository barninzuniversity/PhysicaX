"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const kB = 1.380649e-23;

export function MaxwellBoltzmannSim() {
  const [mass, setMass] = useState("4.65e-26");
  const [temp, setTemp] = useState("300");
  const [temp2, setTemp2] = useState("600");

  const { series, stats } = useMemo(() => {
    const mVal = Number(mass);
    const tVal = Number(temp);
    const t2Val = Number(temp2);
    if (!Number.isFinite(mVal) || !Number.isFinite(tVal) || !Number.isFinite(t2Val) || mVal <= 0 || tVal <= 0) {
      return { series: [], stats: null };
    }

    const vMp = Math.sqrt((2 * kB * tVal) / mVal);
    const vAvg = Math.sqrt((8 * kB * tVal) / (Math.PI * mVal));
    const vRms = Math.sqrt((3 * kB * tVal) / mVal);
    const vMax = Math.max(vRms * 4, Math.sqrt((3 * kB * t2Val) / mVal) * 4);

    const buildDist = (t: number) => {
      const pts: { x: number; y: number }[] = [];
      const coeff = 4 * Math.PI * Math.pow(mVal / (2 * Math.PI * kB * t), 1.5);
      const steps = 140;
      for (let i = 0; i <= steps; i += 1) {
        const v = (vMax * i) / steps;
        const f = coeff * v * v * Math.exp((-mVal * v * v) / (2 * kB * t));
        pts.push({ x: v, y: f });
      }
      return pts;
    };

    const primary = buildDist(tVal);
    const compare = t2Val > 0 ? buildDist(t2Val) : [];

    return {
      series: [
        { id: "t1", points: primary, color: "#0b7285", label: `T=${tVal} K` },
        ...(t2Val > 0 ? [{ id: "t2", points: compare, color: "#d97706", label: `T=${t2Val} K` }] : [])
      ],
      stats: { vMp, vAvg, vRms }
    };
  }, [mass, temp, temp2]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Maxwell-Boltzmann Distribution</div>
      <div className="demo-grid">
        <label className="field">
          <span>mass (kg)</span>
          <input type="number" value={mass} onChange={(event) => setMass(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T1 (K)</span>
          <input type="number" value={temp} onChange={(event) => setTemp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T2 (K)</span>
          <input type="number" value={temp2} onChange={(event) => setTemp2(event.target.value)} step="any" />
        </label>
      </div>
      <div className="metric-grid">
        <div className="metric-card">v_mp: {stats ? stats.vMp.toFixed(1) : "--"} m/s</div>
        <div className="metric-card">v_avg: {stats ? stats.vAvg.toFixed(1) : "--"} m/s</div>
        <div className="metric-card">v_rms: {stats ? stats.vRms.toFixed(1) : "--"} m/s</div>
      </div>
      <PlotCanvas series={series} xLabel="v" yLabel="f(v)" showLegend />
      <div className="demo-note">
        <MathInline latex={String.raw`f(v)=4\pi \left(\frac{m}{2\pi k T}\right)^{3/2} v^2 e^{-m v^2/(2 k T)}`} />
      </div>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const R = 8.314462618;

type Mode = "mixing" | "heatflow" | "engines" | "irreversible";

export function EntropyVisualizerSim() {
  const [mode, setMode] = useState<Mode>("mixing");
  const [n1, setN1] = useState("1");
  const [n2, setN2] = useState("1");
  const [tHot, setTHot] = useState("500");
  const [tCold, setTCold] = useState("300");
  const [q, setQ] = useState("800");
  const [th, setTh] = useState("600");
  const [tc, setTc] = useState("300");
  const [tSystem, setTSystem] = useState("350");
  const [tEnv, setTEnv] = useState("290");
  const [qIrrev, setQIrrev] = useState("500");
  const [sigmaGen, setSigmaGen] = useState("0.2");

  const { deltaS, curve } = useMemo(() => {
    const n1Val = Number(n1);
    const n2Val = Number(n2);
    const tH = Number(tHot);
    const tC = Number(tCold);
    const qVal = Number(q);
    const thVal = Number(th);
    const tcVal = Number(tc);

    if (mode === "mixing" && n1Val > 0 && n2Val > 0) {
      const total = n1Val + n2Val;
      const s = -R * (n1Val * Math.log(n1Val / total) + n2Val * Math.log(n2Val / total));
      const pts = [];
      for (let x = 0; x <= 1; x += 0.05) {
        const a = Math.max(1e-6, x);
        const b = Math.max(1e-6, 1 - x);
        pts.push({ x, y: -R * (a * Math.log(a) + b * Math.log(b)) });
      }
      return { deltaS: s, curve: pts };
    }

    if (mode === "heatflow" && tH > 0 && tC > 0) {
      const sHot = -qVal / tH;
      const sCold = qVal / tC;
      const s = sHot + sCold;
      const pts = [];
      for (let Q = 0; Q <= qVal; Q += Math.max(1, qVal / 40)) {
        pts.push({ x: Q, y: -Q / tH + Q / tC });
      }
      return { deltaS: s, curve: pts };
    }

    if (mode === "engines" && thVal > 0 && tcVal > 0) {
      const eta = 1 - tcVal / thVal;
      const pts = [];
      for (let t = 0; t <= 1; t += 0.05) {
        pts.push({ x: t, y: eta * t });
      }
      return { deltaS: eta, curve: pts };
    }

    if (mode === "irreversible") {
      const tSys = Number(tSystem);
      const tEnvVal = Number(tEnv);
      const qVal = Number(qIrrev);
      const sigmaVal = Math.max(0, Number(sigmaGen));
      if (tSys > 0 && tEnvVal > 0) {
        const sSys = qVal / tSys;
        const sEnv = -qVal / tEnvVal;
        const sGen = sigmaVal * Math.abs(qVal) / Math.max(1, Math.min(tSys, tEnvVal));
        const sTot = sSys + sEnv + sGen;
        const pts = [];
        for (let t = 0; t <= 1; t += 0.05) {
          pts.push({ x: t, y: sTot * t });
        }
        return { deltaS: sTot, curve: pts };
      }
    }

    return { deltaS: NaN, curve: [] };
  }, [mode, n1, n2, tHot, tCold, q, th, tc, tSystem, tEnv, qIrrev, sigmaGen]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Entropy Visualizer</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "mixing" ? "active" : ""}`} onClick={() => setMode("mixing")}>
          Mixing
        </button>
        <button type="button" className={`control-chip ${mode === "heatflow" ? "active" : ""}`} onClick={() => setMode("heatflow")}>
          Heat Flow
        </button>
        <button type="button" className={`control-chip ${mode === "engines" ? "active" : ""}`} onClick={() => setMode("engines")}>
          Engines
        </button>
        <button type="button" className={`control-chip ${mode === "irreversible" ? "active" : ""}`} onClick={() => setMode("irreversible")}>
          Irreversible
        </button>
      </div>

      {mode === "mixing" ? (
        <div className="demo-grid">
          <label className="field">
            <span>n1 (mol)</span>
            <input type="number" value={n1} onChange={(event) => setN1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>n2 (mol)</span>
            <input type="number" value={n2} onChange={(event) => setN2(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "heatflow" ? (
        <div className="demo-grid">
          <label className="field">
            <span>Hot reservoir T_h (K)</span>
            <input type="number" value={tHot} onChange={(event) => setTHot(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Cold reservoir T_c (K)</span>
            <input type="number" value={tCold} onChange={(event) => setTCold(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Heat Q (J)</span>
            <input type="number" value={q} onChange={(event) => setQ(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "engines" ? (
        <div className="demo-grid">
          <label className="field">
            <span>T_h (K)</span>
            <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>T_c (K)</span>
            <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "irreversible" ? (
        <div className="demo-grid">
          <label className="field">
            <span>T system (K)</span>
            <input type="number" value={tSystem} onChange={(event) => setTSystem(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>T environment (K)</span>
            <input type="number" value={tEnv} onChange={(event) => setTEnv(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Heat Q (J)</span>
            <input type="number" value={qIrrev} onChange={(event) => setQIrrev(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Irreversibility</span>
            <input type="number" value={sigmaGen} onChange={(event) => setSigmaGen(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">ΔS = {Number.isFinite(deltaS) ? deltaS.toFixed(3) : "--"} J/K</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\Delta S = \sum \frac{Q_i}{T_i}\quad,\quad S_{mix} = -R\sum x_i\ln x_i`} />
        </div>
      </div>

      <PlotCanvas series={[{ id: "entropy", points: curve, color: "#0f766e" }]} xLabel="progress" yLabel="ΔS" />
    </div>
  );
}

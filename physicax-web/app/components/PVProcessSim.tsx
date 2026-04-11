"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const R = 8.314462618;

export function PVProcessSim() {
  const [process, setProcess] = useState("isothermal");
  const [n, setN] = useState("1");
  const [t1, setT1] = useState("300");
  const [t2, setT2] = useState("450");
  const [v1, setV1] = useState("0.02");
  const [v2, setV2] = useState("0.05");
  const [gamma, setGamma] = useState("1.4");
  const [polyN, setPolyN] = useState("1.2");
  const [progress, setProgress] = useState("0.6");
  const [irreversibility, setIrreversibility] = useState("0.15");

  const { pvPoints, tvPoints, ptPoints, tsPoints, stPoints, utPoints, htPoints, info, summary } = useMemo(() => {
    const nVal = Number(n);
    const t1Val = Number(t1);
    const t2Val = Number(t2);
    const v1Val = Number(v1);
    const v2Val = Number(v2);
    const gVal = Number(gamma);
    const nPolyVal = Number(polyN);
    const irrVal = Number(irreversibility);
    if (
      !Number.isFinite(nVal) ||
      !Number.isFinite(t1Val) ||
      !Number.isFinite(t2Val) ||
      !Number.isFinite(v1Val) ||
      !Number.isFinite(v2Val) ||
      !Number.isFinite(gVal) ||
      v1Val <= 0 ||
      v2Val <= 0
    ) {
      return {
        pvPoints: [],
        tvPoints: [],
        ptPoints: [],
        tsPoints: [],
        stPoints: [],
        utPoints: [],
        htPoints: [],
        info: "--",
        summary: { w: NaN, q: NaN, du: NaN, ds: NaN }
      };
    }

    const vMin = Math.min(v1Val, v2Val);
    const vMax = Math.max(v1Val, v2Val);
    const steps = 60;
    const pts: { x: number; y: number }[] = [];
    const tv: { x: number; y: number }[] = [];
    const states: { p: number; v: number; t: number }[] = [];
    const cv = R / (gVal - 1);
    const p1Val = (nVal * R * t1Val) / v1Val;
    let w = 0;
    let q = 0;
    let du = 0;
    let ds = 0;

    const pushState = (p: number, v: number, t: number) => {
      pts.push({ x: v, y: p });
      tv.push({ x: v, y: t });
      states.push({ p, v, t });
    };

    const buildExtras = () => {
      const pt: { x: number; y: number }[] = [];
      const ts: { x: number; y: number }[] = [];
      const st: { x: number; y: number }[] = [];
      const ut: { x: number; y: number }[] = [];
      const ht: { x: number; y: number }[] = [];
      states.forEach((state) => {
        const s =
          nVal * cv * Math.log(state.t / t1Val) +
          nVal * R * Math.log(state.v / v1Val);
        const u = nVal * cv * state.t;
        const h = u + state.p * state.v;
        pt.push({ x: state.t, y: state.p });
        ts.push({ x: s, y: state.t });
        st.push({ x: state.t, y: s });
        ut.push({ x: state.t, y: u });
        ht.push({ x: state.t, y: h });
      });
      return { ptPoints: pt, tsPoints: ts, stPoints: st, utPoints: ut, htPoints: ht };
    };

    if (process === "isothermal") {
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = (nVal * R * t1Val) / v;
        pushState(p, v, t1Val);
      }
      w = nVal * R * t1Val * Math.log(v2Val / v1Val);
      q = w;
      du = 0;
      ds = nVal * R * Math.log(v2Val / v1Val);
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`P V = n R T`, summary: { w, q, du, ds }, ...extras };
    }

    if (process === "isobaric") {
      const p0 = (nVal * R * t1Val) / v1Val;
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const t = (p0 * v) / (nVal * R);
        pushState(p0, v, t);
      }
      const tEnd = (p0 * v2Val) / (nVal * R);
      w = p0 * (v2Val - v1Val);
      du = nVal * cv * (tEnd - t1Val);
      q = w + du;
      ds = nVal * (cv + R) * Math.log(tEnd / t1Val);
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`P=\text{const},\; W=P(V_2 - V_1)`, summary: { w, q, du, ds }, ...extras };
    }

    if (process === "isochoric") {
      const v = v1Val;
      const p1 = (nVal * R * t1Val) / v;
      const p2 = (nVal * R * t2Val) / v;
      for (let i = 0; i <= steps; i += 1) {
        const p = p1 + (p2 - p1) * (i / steps);
        const t = t1Val + (t2Val - t1Val) * (i / steps);
        pushState(p, v, t);
      }
      w = 0;
      du = nVal * cv * (t2Val - t1Val);
      q = du;
      ds = nVal * cv * Math.log(t2Val / t1Val);
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`V=\text{const},\; W=0`, summary: { w, q, du, ds }, ...extras };
    }

    if (process === "adiabatic" || process === "adiabatic_irrev") {
      const gEff = process === "adiabatic_irrev" ? Math.max(1.05, gVal - Math.max(0, irrVal)) : gVal;
      const c = (nVal * R * t1Val) * Math.pow(v1Val, gEff - 1);
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = c / Math.pow(v, gEff);
        const t = (p * v) / (nVal * R);
        pushState(p, v, t);
      }
      const pEnd = (nVal * R * t1Val * Math.pow(v1Val, gEff - 1)) / Math.pow(v2Val, gEff);
      const tEnd = (pEnd * v2Val) / (nVal * R);
      w = (pEnd * v2Val - p1Val * v1Val) / (1 - gEff);
      du = nVal * cv * (tEnd - t1Val);
      q = process === "adiabatic_irrev" ? 0.1 * Math.abs(w) : 0;
      ds = process === "adiabatic_irrev" ? Math.abs(q) / Math.max(1, t1Val) : 0;
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`P V^{\gamma} = \text{const}`, summary: { w, q, du, ds }, ...extras };
    }

    if (process === "polytropic") {
      const nPoly = Number.isFinite(nPolyVal) ? nPolyVal : 1.2;
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = ((nVal * R * t1Val) * Math.pow(v1Val, nPoly - 1)) / Math.pow(v, nPoly);
        const t = (p * v) / (nVal * R);
        pushState(p, v, t);
      }
      const pEnd = ((nVal * R * t1Val) * Math.pow(v1Val, nPoly - 1)) / Math.pow(v2Val, nPoly);
      const tEnd = (pEnd * v2Val) / (nVal * R);
      w = Math.abs(nPoly - 1) < 1e-6 ? nVal * R * t1Val * Math.log(v2Val / v1Val) : (pEnd * v2Val - (nVal * R * t1Val / v1Val) * v1Val) / (1 - nPoly);
      du = nVal * cv * (tEnd - t1Val);
      q = w + du;
      ds = nVal * cv * Math.log(tEnd / t1Val) + nVal * R * Math.log(v2Val / v1Val);
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`P V^{n}=\text{const}`, summary: { w, q, du, ds }, ...extras };
    }

    if (process === "free" || process === "throttle") {
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = (nVal * R * t1Val) / v;
        pushState(p, v, t1Val);
      }
      w = 0;
      q = 0;
      du = 0;
      ds = nVal * R * Math.log(v2Val / v1Val);
      const extras = buildExtras();
      return { pvPoints: pts, tvPoints: tv, info: String.raw`T=\text{const},\; W=0`, summary: { w, q, du, ds }, ...extras };
    }

    const extras = buildExtras();
    return { pvPoints: pts, tvPoints: tv, info: "", summary: { w: NaN, q: NaN, du: NaN, ds: NaN }, ...extras };
  }, [process, n, t1, t2, v1, v2, gamma, polyN, irreversibility]);

  const progressVal = Math.max(0, Math.min(1, Number(progress)));
  const idx = pvPoints.length ? Math.min(pvPoints.length - 1, Math.floor(progressVal * (pvPoints.length - 1))) : 0;
  const pvMarker = pvPoints[idx] ? [{ id: "pv-mark", points: [pvPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];
  const tvMarker = tvPoints[idx] ? [{ id: "tv-mark", points: [tvPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];
  const ptMarker = ptPoints[idx] ? [{ id: "pt-mark", points: [ptPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];
  const tsMarker = tsPoints[idx] ? [{ id: "ts-mark", points: [tsPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];
  const utMarker = utPoints[idx] ? [{ id: "ut-mark", points: [utPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];
  const htMarker = htPoints[idx] ? [{ id: "ht-mark", points: [htPoints[idx]], color: "#111827", mode: "scatter" as const }] : [];

  return (
    <div className="demo-panel">
      <div className="demo-title">Thermo Process Simulator (P-V)</div>
      <div className="demo-grid">
        <label className="field">
          <span>Process</span>
          <select value={process} onChange={(event) => setProcess(event.target.value)}>
            <option value="isothermal">Isothermal</option>
            <option value="isobaric">Isobaric</option>
            <option value="isochoric">Isochoric</option>
            <option value="adiabatic">Adiabatic (reversible)</option>
            <option value="adiabatic_irrev">Adiabatic (irreversible)</option>
            <option value="polytropic">Polytropic</option>
            <option value="free">Free expansion</option>
            <option value="throttle">Throttling</option>
          </select>
        </label>
        <label className="field">
          <span>n (mol)</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T1 (K)</span>
          <input type="number" value={t1} onChange={(event) => setT1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T2 (K, isochoric)</span>
          <input type="number" value={t2} onChange={(event) => setT2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V1 (m^3)</span>
          <input type="number" value={v1} onChange={(event) => setV1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V2 (m^3)</span>
          <input type="number" value={v2} onChange={(event) => setV2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>polytropic n</span>
          <input type="number" value={polyN} onChange={(event) => setPolyN(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>irreversibility</span>
          <input type="number" value={irreversibility} onChange={(event) => setIrreversibility(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>path progress</span>
          <input type="range" min="0" max="1" step="0.01" value={progress} onChange={(event) => setProgress(event.target.value)} />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{info ? <MathInline latex={info} /> : "--"}</span>
          <span className="pill">W = {Number.isFinite(summary?.w) ? summary.w.toFixed(1) : "--"} J</span>
          <span className="pill">Q = {Number.isFinite(summary?.q) ? summary.q.toFixed(1) : "--"} J</span>
          <span className="pill">dU = {Number.isFinite(summary?.du) ? summary.du.toFixed(1) : "--"} J</span>
          <span className="pill">dS = {Number.isFinite(summary?.ds) ? summary.ds.toFixed(2) : "--"} J/K</span>
        </div>
      </div>
      <div className="demo-stack">
        <PlotCanvas
          series={[{ id: "pv", points: pvPoints, color: "#1f8a8a", label: "P-V" }, ...pvMarker]}
          xLabel="V"
          yLabel="P"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "tv", points: tvPoints, color: "#d97706", label: "T-V" }, ...tvMarker]}
          xLabel="V"
          yLabel="T"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "pt", points: ptPoints, color: "#2563eb", label: "P-T" }, ...ptMarker]}
          xLabel="T"
          yLabel="P"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "ts", points: tsPoints, color: "#0f766e", label: "T-S" }, ...tsMarker]}
          xLabel="S"
          yLabel="T"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "ut", points: utPoints, color: "#9333ea", label: "U-T" }, ...utMarker]}
          xLabel="T"
          yLabel="U"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "ht", points: htPoints, color: "#d97706", label: "H-T" }, ...htMarker]}
          xLabel="T"
          yLabel="H"
          showLegend
        />
      </div>
    </div>
  );
}

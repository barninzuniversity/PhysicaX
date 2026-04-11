"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const R = 8.314462618;

type ProcessMode =
  | "isothermal"
  | "isobaric"
  | "isochoric"
  | "adiabatic"
  | "polytropic"
  | "free"
  | "throttle";

type Step = {
  id: string;
  mode: ProcessMode;
  target: string;
};

const MODES: { id: ProcessMode; label: string; targetLabel: string }[] = [
  { id: "isothermal", label: "Isothermal (T const)", targetLabel: "V2 (m^3)" },
  { id: "isobaric", label: "Isobaric (P const)", targetLabel: "V2 (m^3)" },
  { id: "isochoric", label: "Isochoric (V const)", targetLabel: "T2 (K)" },
  { id: "adiabatic", label: "Adiabatic (rev)", targetLabel: "V2 (m^3)" },
  { id: "polytropic", label: "Polytropic", targetLabel: "V2 (m^3)" },
  { id: "free", label: "Free expansion", targetLabel: "V2 (m^3)" },
  { id: "throttle", label: "Throttling (isoenthalpic)", targetLabel: "V2 (m^3)" }
];

const makeId = () => Math.random().toString(36).slice(2, 8);

export function CycleBuilderSim() {
  const [n, setN] = useState("1");
  const [t1, setT1] = useState("300");
  const [p1, setP1] = useState("101325");
  const [v1, setV1] = useState("0.0246");
  const [gamma, setGamma] = useState("1.4");
  const [polyN, setPolyN] = useState("1.2");
  const [steps, setSteps] = useState<Step[]>([
    { id: makeId(), mode: "isothermal", target: "0.03" },
    { id: makeId(), mode: "adiabatic", target: "0.015" }
  ]);

  const addStep = () => {
    setSteps((prev) => [...prev, { id: makeId(), mode: "isothermal", target: "0.03" }]);
  };

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  const moveStep = (id: string, dir: number) => {
    setSteps((prev) => {
      const idx = prev.findIndex((step) => step.id === id);
      const next = [...prev];
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= prev.length) {
        return prev;
      }
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  };

  const { pvPoints, tvPoints, summary, stepSummaries } = useMemo(() => {
    const nVal = Number(n);
    const tVal = Number(t1);
    const pVal = Number(p1);
    const vVal = Number(v1);
    const gVal = Number(gamma);
    const polyVal = Number(polyN);
    if (
      !Number.isFinite(nVal) ||
      !Number.isFinite(tVal) ||
      !Number.isFinite(pVal) ||
      !Number.isFinite(vVal) ||
      vVal <= 0 ||
      nVal <= 0 ||
      !Number.isFinite(gVal) ||
      gVal <= 1
    ) {
      return { pvPoints: [], tvPoints: [], summary: null, stepSummaries: [] };
    }
    const cv = R / (gVal - 1);
    let state = { p: pVal, v: vVal, t: tVal };
    const pv: { x: number; y: number }[] = [];
    const tv: { x: number; y: number }[] = [];
    let totalW = 0;
    let totalQ = 0;
    let totalDU = 0;
    const summaries: { id: string; w: number; q: number; du: number; ds: number }[] = [];

    const addSegment = (vStart: number, vEnd: number, tStart: number, tEnd: number, pFn: (v: number) => number) => {
      const stepsCount = 50;
      for (let i = 0; i <= stepsCount; i += 1) {
        const v = vStart + (vEnd - vStart) * (i / stepsCount);
        pv.push({ x: v, y: pFn(v) });
        const t = tStart + (tEnd - tStart) * (i / stepsCount);
        tv.push({ x: v, y: t });
      }
    };

    for (const step of steps) {
      const mode = step.mode;
      const target = Number(step.target);
      if (!Number.isFinite(target)) {
        continue;
      }
      const p1s = state.p;
      const v1s = state.v;
      const t1s = state.t;

      let p2 = p1s;
      let v2 = v1s;
      let t2 = t1s;
      let w = 0;
      let q = 0;
      let du = 0;
      let ds = 0;

      if (mode === "isochoric") {
        v2 = v1s;
        t2 = target;
        p2 = (nVal * R * t2) / v2;
        du = nVal * cv * (t2 - t1s);
        q = du;
        ds = nVal * cv * Math.log(t2 / t1s);
        addSegment(v1s, v2, t1s, t2, () => p1s + (p2 - p1s));
      } else if (mode === "isobaric") {
        p2 = p1s;
        v2 = Math.max(1e-6, target);
        t2 = (p2 * v2) / (nVal * R);
        w = p1s * (v2 - v1s);
        du = nVal * cv * (t2 - t1s);
        q = du + w;
        ds = nVal * (cv + R) * Math.log(t2 / t1s);
        addSegment(v1s, v2, t1s, t2, () => p1s);
      } else if (mode === "isothermal") {
        v2 = Math.max(1e-6, target);
        t2 = t1s;
        p2 = (nVal * R * t2) / v2;
        w = nVal * R * t2 * Math.log(v2 / v1s);
        du = 0;
        q = w;
        ds = nVal * R * Math.log(v2 / v1s);
        addSegment(v1s, v2, t1s, t2, (v) => (nVal * R * t2) / v);
      } else if (mode === "adiabatic") {
        v2 = Math.max(1e-6, target);
        t2 = t1s * Math.pow(v1s / v2, gVal - 1);
        p2 = (nVal * R * t2) / v2;
        w = (p2 * v2 - p1s * v1s) / (1 - gVal);
        du = nVal * cv * (t2 - t1s);
        q = 0;
        ds = 0;
        addSegment(v1s, v2, t1s, t2, (v) => (p1s * Math.pow(v1s, gVal)) / Math.pow(v, gVal));
      } else if (mode === "polytropic") {
        v2 = Math.max(1e-6, target);
        const nP = Number.isFinite(polyVal) ? polyVal : 1.2;
        if (Math.abs(nP - 1) < 1e-6) {
          t2 = t1s;
          p2 = (nVal * R * t2) / v2;
          w = nVal * R * t2 * Math.log(v2 / v1s);
          du = 0;
          q = w;
          ds = nVal * R * Math.log(v2 / v1s);
          addSegment(v1s, v2, t1s, t2, (v) => (nVal * R * t2) / v);
        } else {
          t2 = t1s * Math.pow(v1s / v2, nP - 1);
          p2 = (nVal * R * t2) / v2;
          w = (p2 * v2 - p1s * v1s) / (1 - nP);
          du = nVal * cv * (t2 - t1s);
          q = du + w;
          ds = nVal * cv * Math.log(t2 / t1s) + nVal * R * Math.log(v2 / v1s);
          addSegment(v1s, v2, t1s, t2, (v) => (p1s * Math.pow(v1s, nP)) / Math.pow(v, nP));
        }
      } else if (mode === "free") {
        v2 = Math.max(1e-6, target);
        t2 = t1s;
        p2 = (nVal * R * t2) / v2;
        w = 0;
        du = 0;
        q = 0;
        ds = nVal * R * Math.log(v2 / v1s);
        addSegment(v1s, v2, t1s, t2, (v) => (nVal * R * t2) / v);
      } else if (mode === "throttle") {
        v2 = Math.max(1e-6, target);
        t2 = t1s;
        p2 = (nVal * R * t2) / v2;
        w = 0;
        du = 0;
        q = 0;
        ds = nVal * R * Math.log(v2 / v1s);
        addSegment(v1s, v2, t1s, t2, (v) => (nVal * R * t2) / v);
      }

      totalW += w;
      totalQ += q;
      totalDU += du;
      summaries.push({ id: step.id, w, q, du, ds });
      state = { p: p2, v: v2, t: t2 };
    }

    return {
      pvPoints: pv,
      tvPoints: tv,
      summary: { w: totalW, q: totalQ, du: totalDU },
      stepSummaries: summaries
    };
  }, [n, t1, p1, v1, gamma, polyN, steps]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Multi-Step Cycle Builder</div>
      <div className="demo-grid">
        <label className="field">
          <span>n (mol)</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T1 (K)</span>
          <input type="number" value={t1} onChange={(event) => setT1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>P1 (Pa)</span>
          <input type="number" value={p1} onChange={(event) => setP1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V1 (m^3)</span>
          <input type="number" value={v1} onChange={(event) => setV1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>polytropic n</span>
          <input type="number" value={polyN} onChange={(event) => setPolyN(event.target.value)} step="any" />
        </label>
      </div>

      <div className="demo-output">
        <div className="demo-note">Add steps, reorder them, and trace the full cycle path.</div>
        {steps.map((step, idx) => {
          const meta = MODES.find((item) => item.id === step.mode);
          const summary = stepSummaries.find((item) => item.id === step.id);
          return (
            <div key={step.id} className="demo-grid" style={{ marginTop: "8px" }}>
              <label className="field">
                <span>step {idx + 1}</span>
                <select value={step.mode} onChange={(event) => updateStep(step.id, { mode: event.target.value as ProcessMode })}>
                  {MODES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{meta?.targetLabel ?? "target"}</span>
                <input
                  type="number"
                  value={step.target}
                  onChange={(event) => updateStep(step.id, { target: event.target.value })}
                  step="any"
                />
              </label>
              <div className="control-row" style={{ justifyContent: "flex-start" }}>
                <button type="button" className="control-chip" onClick={() => moveStep(step.id, -1)}>↑</button>
                <button type="button" className="control-chip" onClick={() => moveStep(step.id, 1)}>↓</button>
                <button type="button" className="control-chip" onClick={() => removeStep(step.id)}>Remove</button>
              </div>
              {summary ? (
                <div className="inline-kv">
                  <span className="pill">W = {summary.w.toFixed(1)} J</span>
                  <span className="pill">Q = {summary.q.toFixed(1)} J</span>
                  <span className="pill">ΔU = {summary.du.toFixed(1)} J</span>
                  <span className="pill">ΔS = {summary.ds.toFixed(2)} J/K</span>
                </div>
              ) : null}
            </div>
          );
        })}
        <div className="control-row" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="control-button" onClick={addStep}>
            Add step
          </button>
        </div>
      </div>

      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">Total W = {summary ? summary.w.toFixed(1) : "--"} J</span>
          <span className="pill">Total Q = {summary ? summary.q.toFixed(1) : "--"} J</span>
          <span className="pill">Total ΔU = {summary ? summary.du.toFixed(1) : "--"} J</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`Q=\Delta U + W,\;\; \Delta U = n C_v (T_2 - T_1)`} />
        </div>
      </div>

      <div className="demo-stack">
        <PlotCanvas series={[{ id: "pv", points: pvPoints, color: "#0b7285", label: "P-V path", fill: false }]} xLabel="V" yLabel="P" showLegend />
        <PlotCanvas series={[{ id: "tv", points: tvPoints, color: "#b45309", label: "T-V path", fill: false }]} xLabel="V" yLabel="T" showLegend />
      </div>
    </div>
  );
}

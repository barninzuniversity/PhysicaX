"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";

const k = 8.9875517923e9;

export function CoulombFieldSim() {
  const [q1, setQ1] = useState("1e-6");
  const [q2, setQ2] = useState("-1e-6");
  const [x1, setX1] = useState("-0.2");
  const [x2, setX2] = useState("0.2");
  const [x, setX] = useState("0.1");

  const { e, direction } = useMemo(() => {
    const q1Val = Number(q1);
    const q2Val = Number(q2);
    const x1Val = Number(x1);
    const x2Val = Number(x2);
    const xVal = Number(x);
    if (
      !Number.isFinite(q1Val) ||
      !Number.isFinite(q2Val) ||
      !Number.isFinite(x1Val) ||
      !Number.isFinite(x2Val) ||
      !Number.isFinite(xVal)
    ) {
      return { e: NaN, direction: "--" };
    }
    const r1 = xVal - x1Val;
    const r2 = xVal - x2Val;
    if (r1 === 0 || r2 === 0) {
      return { e: NaN, direction: "singularity" };
    }
    const e1 = (k * q1Val) / (r1 * Math.abs(r1));
    const e2 = (k * q2Val) / (r2 * Math.abs(r2));
    const eVal = e1 + e2;
    const dir = eVal > 0 ? "+x" : eVal < 0 ? "-x" : "0";
    return { e: eVal, direction: dir };
  }, [q1, q2, x1, x2, x]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Coulomb Field (1D)</div>
      <div className="demo-grid">
        <label className="field">
          <span>q1 (C)</span>
          <input type="number" value={q1} onChange={(event) => setQ1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x1 (m)</span>
          <input type="number" value={x1} onChange={(event) => setX1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>q2 (C)</span>
          <input type="number" value={q2} onChange={(event) => setQ2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x2 (m)</span>
          <input type="number" value={x2} onChange={(event) => setX2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x (probe)</span>
          <input type="number" value={x} onChange={(event) => setX(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">E = {Number.isFinite(e) ? e.toExponential(3) : "--"} N/C</span>
          <span className="pill">direction: {direction}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`E = k \frac{q}{r^2}`} /> along the x-axis (sign gives direction).
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";

const R = 8.314462618;

export function IdealGasDemo() {
  const [n, setN] = useState("1");
  const [t, setT] = useState("300");
  const [v, setV] = useState("0.025");

  const { p, pAtm } = useMemo(() => {
    const nVal = Number(n);
    const tVal = Number(t);
    const vVal = Number(v);
    if (!Number.isFinite(nVal) || !Number.isFinite(tVal) || !Number.isFinite(vVal) || vVal <= 0) {
      return { p: NaN, pAtm: NaN };
    }
    const pVal = (nVal * R * tVal) / vVal;
    return { p: pVal, pAtm: pVal / 101325 };
  }, [n, t, v]);

  const pText = Number.isFinite(p) ? `${p.toFixed(2)} Pa` : "--";
  const atmText = Number.isFinite(pAtm) ? `${pAtm.toFixed(4)} atm` : "--";

  return (
    <div className="demo-panel">
      <div className="demo-title">Ideal Gas Solver</div>
      <div className="demo-grid">
        <label className="field">
          <span>n (mol)</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>T (K)</span>
          <input type="number" value={t} onChange={(event) => setT(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>V (m^3)</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">P = {pText}</span>
          <span className="pill">P = {atmText}</span>
        </div>
        <div className="demo-note">
          Computed from <MathInline latex={String.raw`P V = n R T`} />.
        </div>
      </div>
    </div>
  );
}

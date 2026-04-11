"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";

export function StringHarmonicsDemo() {
  const [n, setN] = useState("1");
  const [v, setV] = useState("100");
  const [l, setL] = useState("0.5");

  const { f } = useMemo(() => {
    const nVal = Number(n);
    const vVal = Number(v);
    const lVal = Number(l);
    if (!Number.isFinite(nVal) || !Number.isFinite(vVal) || !Number.isFinite(lVal) || lVal <= 0) {
      return { f: NaN };
    }
    return { f: (nVal * vVal) / (2 * lVal) };
  }, [n, v, l]);

  const fText = Number.isFinite(f) ? `${f.toFixed(2)} Hz` : "--";

  return (
    <div className="demo-panel">
      <div className="demo-title">String Harmonics</div>
      <div className="demo-grid">
        <label className="field">
          <span>n</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>v (m/s)</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>L (m)</span>
          <input type="number" value={l} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">f_n = {fText}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`f_n = \frac{n v}{2 L}`} />
        </div>
      </div>
    </div>
  );
}

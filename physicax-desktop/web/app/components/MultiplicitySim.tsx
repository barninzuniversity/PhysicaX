"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const logFactorial = (n: number) => {
  let sum = 0;
  for (let i = 2; i <= n; i += 1) {
    sum += Math.log(i);
  }
  return sum;
};

export function MultiplicitySim() {
  const [total, setTotal] = useState("30");

  const { points } = useMemo(() => {
    const nVal = Math.min(60, Math.max(10, Math.floor(Number(total))));
    if (!Number.isFinite(nVal)) {
      return { points: [] };
    }
    const logNFact = logFactorial(nVal);
    const logVals: number[] = [];
    for (let n = 0; n <= nVal; n += 1) {
      const logC = logNFact - logFactorial(n) - logFactorial(nVal - n);
      logVals.push(logC);
    }
    const maxLog = Math.max(...logVals);
    const weights = logVals.map((lv) => Math.exp(lv - maxLog));
    const sum = weights.reduce((acc, val) => acc + val, 0);

    const pts = weights.map((w, i) => ({ x: i, y: w / sum }));
    return { points: pts };
  }, [total]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Multiplicity (Two-Box Model)</div>
      <div className="demo-grid">
        <label className="field">
          <span>N total</span>
          <input type="number" value={total} onChange={(event) => setTotal(event.target.value)} step="1" />
        </label>
      </div>
      <PlotCanvas series={[{ id: "prob", points, color: "#0b7285", fill: true }]} xLabel="n in box A" yLabel="P(n)" />
      <div className="demo-note">
        <MathInline latex={String.raw`P(n) \propto \binom{N}{n}`} />
      </div>
    </div>
  );
}

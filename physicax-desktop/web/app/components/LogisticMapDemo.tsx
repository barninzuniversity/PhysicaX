"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";

export function LogisticMapDemo() {
  const [r, setR] = useState("3.7");
  const [x0, setX0] = useState("0.2");
  const [steps, setSteps] = useState("30");

  const values = useMemo(() => {
    const rVal = Number(r);
    const xVal = Number(x0);
    const nVal = Math.max(1, Math.min(200, Math.floor(Number(steps))));
    if (!Number.isFinite(rVal) || !Number.isFinite(xVal) || !Number.isFinite(nVal)) {
      return [];
    }
    let x = xVal;
    const out: number[] = [];
    for (let i = 0; i < nVal; i += 1) {
      x = rVal * x * (1 - x);
      out.push(x);
    }
    return out;
  }, [r, x0, steps]);

  const tail = values.slice(-8).map((value, index) => (
    <span className="pill mono" key={`${value}-${index}`}>
      {value.toFixed(5)}
    </span>
  ));

  return (
    <div className="demo-panel">
      <div className="demo-title">Logistic Map Iteration</div>
      <div className="demo-grid">
        <label className="field">
          <span>r (0 to 4)</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0 (0 to 1)</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">{tail.length ? tail : <span className="pill">--</span>}</div>
        <div className="demo-note">
          <MathInline latex={String.raw`x_{n+1} = r x_n (1 - x_n)`} />
        </div>
      </div>
    </div>
  );
}

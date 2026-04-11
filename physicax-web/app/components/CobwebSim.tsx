"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function CobwebSim() {
  const [r, setR] = useState("3.4");
  const [x0, setX0] = useState("0.2");
  const [iters, setIters] = useState("30");

  const { curve, diagonal, path, last } = useMemo(() => {
    const rVal = Number(r);
    const x0Val = Number(x0);
    const itersVal = Math.max(1, Math.min(80, Math.floor(Number(iters))));
    if (!Number.isFinite(rVal) || !Number.isFinite(x0Val)) {
      return { curve: [], diagonal: [], path: [], last: NaN };
    }
    const curvePts: { x: number; y: number }[] = [];
    const diagPts: { x: number; y: number }[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i += 1) {
      const x = i / steps;
      curvePts.push({ x, y: rVal * x * (1 - x) });
      diagPts.push({ x, y: x });
    }

    let x = x0Val;
    const cobweb: { x: number; y: number }[] = [];
    cobweb.push({ x, y: 0 });
    for (let i = 0; i < itersVal; i += 1) {
      const y = rVal * x * (1 - x);
      cobweb.push({ x, y });
      cobweb.push({ x: y, y });
      x = y;
    }

    return { curve: curvePts, diagonal: diagPts, path: cobweb, last: x };
  }, [r, x0, iters]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Cobweb Diagram</div>
      <div className="demo-grid">
        <label className="field">
          <span>r</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" min="0" max="4" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" min="0" max="1" />
        </label>
        <label className="field">
          <span>iterations</span>
          <input type="number" value={iters} onChange={(event) => setIters(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">x_n ˜ {Number.isFinite(last) ? last.toFixed(4) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`f(x) = r x (1 - x)`} />
        </div>
      </div>
      <PlotCanvas
        series={[
          { id: "curve", points: curve, color: "#0b7285", label: "f(x)" },
          { id: "diag", points: diagonal, color: "#9ca3af", dash: [6, 4], label: "y=x" },
          { id: "path", points: path, color: "#d97706", lineWidth: 1.4, label: "orbit" }
        ]}
        xLabel="x"
        yLabel="y"
        showLegend
      />
    </div>
  );
}


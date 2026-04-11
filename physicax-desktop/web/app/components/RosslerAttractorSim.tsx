"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Projection = "xy" | "xz" | "yz";

export function RosslerAttractorSim() {
  const [a, setA] = useState("0.2");
  const [b, setB] = useState("0.2");
  const [c, setC] = useState("5.7");
  const [dt, setDt] = useState("0.02");
  const [steps, setSteps] = useState("2400");
  const [projection, setProjection] = useState<Projection>("xy");

  const { points } = useMemo(() => {
    const aVal = Number(a);
    const bVal = Number(b);
    const cVal = Number(c);
    const dtVal = Number(dt);
    const stepsVal = Math.min(6000, Math.max(400, Math.floor(Number(steps))));
    if (!Number.isFinite(aVal) || !Number.isFinite(bVal) || !Number.isFinite(cVal) || !Number.isFinite(dtVal)) {
      return { points: [] };
    }
    if (dtVal <= 0) {
      return { points: [] };
    }
    let x = 0.1;
    let y = 0;
    let z = 0;
    const pts: { x: number; y: number }[] = [];
    const deriv = (xVal: number, yVal: number, zVal: number) => ({
      dx: -yVal - zVal,
      dy: xVal + aVal * yVal,
      dz: bVal + zVal * (xVal - cVal)
    });
    for (let i = 0; i < stepsVal; i += 1) {
      const k1 = deriv(x, y, z);
      const k2 = deriv(x + 0.5 * dtVal * k1.dx, y + 0.5 * dtVal * k1.dy, z + 0.5 * dtVal * k1.dz);
      const k3 = deriv(x + 0.5 * dtVal * k2.dx, y + 0.5 * dtVal * k2.dy, z + 0.5 * dtVal * k2.dz);
      const k4 = deriv(x + dtVal * k3.dx, y + dtVal * k3.dy, z + dtVal * k3.dz);
      x += (dtVal / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
      y += (dtVal / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
      z += (dtVal / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
      if (i > 100) {
        if (projection === "xy") {
          pts.push({ x, y });
        } else if (projection === "xz") {
          pts.push({ x, y: z });
        } else {
          pts.push({ x: y, y: z });
        }
      }
    }
    return { points: pts };
  }, [a, b, c, dt, steps, projection]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Rössler Attractor</div>
      <div className="demo-grid">
        <label className="field">
          <span>a</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>b</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>c</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>projection</span>
          <select value={projection} onChange={(event) => setProjection(event.target.value as Projection)}>
            <option value="xy">x-y</option>
            <option value="xz">x-z</option>
            <option value="yz">y-z</option>
          </select>
        </label>
      </div>
      <div className="demo-note">
        <MathInline latex={String.raw`x'=-y-z,\; y'=x+a y,\; z'=b+z(x-c)`} />
      </div>
      <PlotCanvas
        series={[{ id: "rossler", points, color: "#0b7285" }]}
        xLabel={projection[0]}
        yLabel={projection[1]}
      />
    </div>
  );
}

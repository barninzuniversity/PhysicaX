"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";
import { PlotlyPlot } from "./PlotlyPlot";

export function PhasePortraitSim() {
  const [mu, setMu] = useState("1");
  const [x0, setX0] = useState("1");
  const [y0, setY0] = useState("0");
  const [dt, setDt] = useState("0.02");
  const [steps, setSteps] = useState("2000");

  const { points } = useMemo(() => {
    const muVal = Number(mu);
    const x0Val = Number(x0);
    const y0Val = Number(y0);
    const dtVal = Number(dt);
    const stepsVal = Math.min(4000, Math.max(400, Math.floor(Number(steps))));
    if (!Number.isFinite(muVal) || !Number.isFinite(x0Val) || !Number.isFinite(y0Val)) {
      return { points: [] };
    }
    if (dtVal <= 0) {
      return { points: [] };
    }
    let x = x0Val;
    let y = y0Val;
    const pts: { x: number; y: number }[] = [];

    const f = (xVal: number, yVal: number) => ({
      dx: yVal,
      dy: muVal * (1 - xVal * xVal) * yVal - xVal
    });

    for (let i = 0; i < stepsVal; i += 1) {
      pts.push({ x, y });
      const k1 = f(x, y);
      const k2 = f(x + 0.5 * dtVal * k1.dx, y + 0.5 * dtVal * k1.dy);
      const k3 = f(x + 0.5 * dtVal * k2.dx, y + 0.5 * dtVal * k2.dy);
      const k4 = f(x + dtVal * k3.dx, y + dtVal * k3.dy);
      x += (dtVal / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
      y += (dtVal / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
    }
    return { points: pts };
  }, [mu, x0, y0, dt, steps]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Phase Portrait (Van der Pol)</div>
      <div className="demo-grid">
        <label className="field">
          <span>mu</span>
          <input type="number" value={mu} onChange={(event) => setMu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x0</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>y0</span>
          <input type="number" value={y0} onChange={(event) => setY0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
      </div>
      <PlotlyPlot
        data={[
          {
            x: points.map((p) => p.x),
            y: points.map((p) => p.y),
            type: "scattergl",
            mode: "lines",
            line: { color: "#d97706", width: 2 }
          }
        ]}
        layout={{ xaxis: { title: "x" }, yaxis: { title: "y" } }}
      />
      <PlotCanvas series={[{ id: "phase", points, color: "#d97706" }]} xLabel="x" yLabel="y" />
      <div className="demo-note">
        <MathInline latex={String.raw`x'=y,\; y'=\mu(1-x^2) y - x`} />
      </div>
    </div>
  );
}

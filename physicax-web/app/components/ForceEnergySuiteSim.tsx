"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "incline" | "friction" | "potential" | "escape" | "energy";

export function ForceEnergySuiteSim() {
  const [mode, setMode] = useState<Mode>("incline");
  const [mass, setMass] = useState("2");
  const [angle, setAngle] = useState("20");
  const [mu, setMu] = useState("0.2");
  const [v0, setV0] = useState("10");
  const [height, setHeight] = useState("5");
  const [k, setK] = useState("4");
  const [xMax, setXMax] = useState("5");

  const { accel, work, potCurve, energyCurve } = useMemo(() => {
    const m = Number(mass);
    const theta = (Number(angle) * Math.PI) / 180;
    const muVal = Number(mu);
    const v0Val = Number(v0);
    const h = Number(height);
    const kVal = Number(k);
    const xmax = Math.max(1, Number(xMax));
    const g = 9.81;

    const a = g * (Math.sin(theta) - muVal * Math.cos(theta));
    const workF = muVal * m * g * Math.cos(theta) * xmax;

    const pot: { x: number; y: number }[] = [];
    for (let i = 0; i <= 80; i += 1) {
      const x = (xmax * i) / 80;
      const u = 0.5 * kVal * x * x;
      pot.push({ x, y: u });
    }

    const energy: { x: number; y: number }[] = [];
    for (let i = 0; i <= 80; i += 1) {
      const x = (xmax * i) / 80;
      const ke = 0.5 * m * (v0Val * v0Val);
      const pe = m * g * (h - x * Math.sin(theta));
      energy.push({ x, y: ke + pe });
    }

    return { accel: a, work: workF, potCurve: pot, energyCurve: energy };
  }, [mass, angle, mu, v0, height, k, xMax]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Force + Energy Suite</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "incline" ? "active" : ""}`} onClick={() => setMode("incline")}>
          Inclined Plane
        </button>
        <button type="button" className={`control-chip ${mode === "friction" ? "active" : ""}`} onClick={() => setMode("friction")}>
          Friction Work
        </button>
        <button type="button" className={`control-chip ${mode === "potential" ? "active" : ""}`} onClick={() => setMode("potential")}>
          Potential Well
        </button>
        <button type="button" className={`control-chip ${mode === "escape" ? "active" : ""}`} onClick={() => setMode("escape")}>
          Escape Velocity
        </button>
        <button type="button" className={`control-chip ${mode === "energy" ? "active" : ""}`} onClick={() => setMode("energy")}>
          Energy Partition
        </button>
      </div>

      <div className="demo-grid">
        <label className="field">
          <span>mass (kg)</span>
          <input type="number" value={mass} onChange={(event) => setMass(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>angle (deg)</span>
          <input type="number" value={angle} onChange={(event) => setAngle(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>mu</span>
          <input type="number" value={mu} onChange={(event) => setMu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v0 (m/s)</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>height (m)</span>
          <input type="number" value={height} onChange={(event) => setHeight(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>spring k (N/m)</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>x max (m)</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
      </div>

      <div className="demo-output">
        {mode === "incline" ? (
          <>
            <div className="inline-kv">
              <span className="pill">a = {Number.isFinite(accel) ? accel.toFixed(2) : "--"} m/s²</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`a=g(\sin\theta-\mu\cos\theta)`} />
            </div>
          </>
        ) : null}
        {mode === "friction" ? (
          <>
            <div className="inline-kv">
              <span className="pill">W_f = {Number.isFinite(work) ? work.toFixed(2) : "--"} J</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`W_f=\mu m g \cos\theta \, s`} />
            </div>
          </>
        ) : null}
        {mode === "escape" ? (
          <>
            <div className="inline-kv">
              <span className="pill">v_escape = {Number.isFinite(height) ? Math.sqrt(2 * 9.81 * Number(height)).toFixed(2) : "--"} m/s</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`v_{esc}=\sqrt{2 g h}`} />
            </div>
          </>
        ) : null}
      </div>

      {mode === "potential" ? (
        <PlotCanvas series={[{ id: "U", points: potCurve, color: "#0b7285", label: "U(x)" }]} xLabel="x" yLabel="U" showLegend />
      ) : null}
      {mode === "energy" ? (
        <PlotCanvas series={[{ id: "E", points: energyCurve, color: "#2563eb", label: "E(x)" }]} xLabel="x" yLabel="Energy" showLegend />
      ) : null}
    </div>
  );
}

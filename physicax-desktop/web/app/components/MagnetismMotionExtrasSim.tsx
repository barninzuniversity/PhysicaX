"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "cyclotron" | "drift" | "induction";

export function MagnetismMotionExtrasSim() {
  const [mode, setMode] = useState<Mode>("cyclotron");
  const [q, setQ] = useState("1.6e-19");
  const [m, setM] = useState("9.11e-31");
  const [b, setB] = useState("1");
  const [e, setE] = useState("0.2");
  const [v0, setV0] = useState("1e5");

  const { path, info } = useMemo(() => {
    const qVal = Number(q);
    const mVal = Number(m);
    const bVal = Number(b);
    const eVal = Number(e);
    const vVal = Number(v0);
    const pts: { x: number; y: number }[] = [];

    if (mode === "cyclotron") {
      const omega = (qVal * bVal) / mVal;
      for (let i = 0; i <= 200; i += 1) {
        const t = i / 200;
        const x = (vVal / omega) * Math.cos(omega * t);
        const y = (vVal / omega) * Math.sin(omega * t);
        pts.push({ x, y });
      }
      return { path: pts, info: `ω = qB/m` };
    }

    if (mode === "drift") {
      const vD = eVal / bVal;
      for (let i = 0; i <= 200; i += 1) {
        const t = i / 200;
        pts.push({ x: vD * t, y: Math.sin(2 * Math.PI * t) });
      }
      return { path: pts, info: `v_d = E/B` };
    }

    for (let i = 0; i <= 200; i += 1) {
      const t = i / 200;
      const emf = -bVal * Math.cos(2 * Math.PI * t);
      pts.push({ x: t, y: emf });
    }
    return { path: pts, info: "Lenz law emf sign" };
  }, [mode, q, m, b, e, v0]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Magnetism + Motion</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "cyclotron" ? "active" : ""}`} onClick={() => setMode("cyclotron")}>
          Charged Particle
        </button>
        <button type="button" className={`control-chip ${mode === "drift" ? "active" : ""}`} onClick={() => setMode("drift")}>
          E×B Drift
        </button>
        <button type="button" className={`control-chip ${mode === "induction" ? "active" : ""}`} onClick={() => setMode("induction")}>
          Induction
        </button>
      </div>
      <div className="demo-grid">
        <label className="field">
          <span>charge q</span>
          <input type="number" value={q} onChange={(event) => setQ(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>mass m</span>
          <input type="number" value={m} onChange={(event) => setM(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>B field</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>E field</span>
          <input type="number" value={e} onChange={(event) => setE(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>v0</span>
          <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <MathInline latex={String.raw`\mathbf{F}=q(\mathbf{E}+\mathbf{v}\times\mathbf{B})`} />
        <div className="demo-note">{info}</div>
      </div>
      <PlotCanvas series={[{ id: "path", points: path, color: "#2563eb" }]} xLabel="x" yLabel="y" />
    </div>
  );
}

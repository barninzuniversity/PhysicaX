"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "box" | "tunnel" | "wavepacket" | "superposition";

export function QuantumSuiteSim() {
  const [mode, setMode] = useState<Mode>("box");
  const [n, setN] = useState("1");
  const [length, setLength] = useState("1");
  const [energy, setEnergy] = useState("5");
  const [barrier, setBarrier] = useState("8");
  const [sigma, setSigma] = useState("0.2");
  const [time, setTime] = useState("1");
  const [mix, setMix] = useState("0.5");

  const { points, summary } = useMemo(() => {
    const nVal = Math.max(1, Math.floor(Number(n)));
    const L = Math.max(0.2, Number(length));
    const E = Number(energy);
    const V0 = Number(barrier);
    const sig = Math.max(0.05, Number(sigma));
    const t = Number(time);
    const mixVal = Number(mix);
    const pts: { x: number; y: number }[] = [];
    let summaryText = "";

    if (mode === "box") {
      for (let i = 0; i <= 200; i += 1) {
        const x = (L * i) / 200;
        const y = Math.sin((nVal * Math.PI * x) / L);
        pts.push({ x, y });
      }
      summaryText = `E_n ∝ n²/L²`;
    }

    if (mode === "tunnel") {
      const k = Math.sqrt(Math.max(0, V0 - E));
      const T = E < V0 ? Math.exp(-2 * k) : 1;
      summaryText = `T ≈ ${T.toFixed(3)}`;
      for (let i = 0; i <= 200; i += 1) {
        const x = -1 + (2 * i) / 200;
        const y = E < V0 ? Math.exp(-k * Math.abs(x)) : Math.cos(x * Math.sqrt(E));
        pts.push({ x, y });
      }
    }

    if (mode === "wavepacket") {
      for (let i = 0; i <= 200; i += 1) {
        const x = -2 + (4 * i) / 200;
        const width = Math.sqrt(sig * sig + 0.2 * t * t);
        const y = Math.exp(-0.5 * (x * x) / (width * width));
        pts.push({ x, y });
      }
      summaryText = "Gaussian packet spreading";
    }

    if (mode === "superposition") {
      for (let i = 0; i <= 200; i += 1) {
        const x = (L * i) / 200;
        const y = mixVal * Math.sin(Math.PI * x / L) + (1 - mixVal) * Math.sin(2 * Math.PI * x / L);
        pts.push({ x, y });
      }
      summaryText = "ψ = a ψ1 + (1-a) ψ2";
    }

    return { points: pts, summary: summaryText };
  }, [mode, n, length, energy, barrier, sigma, time, mix]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Quantum Intuition Lab</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "box" ? "active" : ""}`} onClick={() => setMode("box")}>
          Particle in Box
        </button>
        <button type="button" className={`control-chip ${mode === "tunnel" ? "active" : ""}`} onClick={() => setMode("tunnel")}>
          Tunneling
        </button>
        <button type="button" className={`control-chip ${mode === "wavepacket" ? "active" : ""}`} onClick={() => setMode("wavepacket")}>
          Wavepacket
        </button>
        <button type="button" className={`control-chip ${mode === "superposition" ? "active" : ""}`} onClick={() => setMode("superposition")}>
          Superposition
        </button>
      </div>

      <div className="demo-grid">
        <label className="field">
          <span>n</span>
          <input type="number" value={n} onChange={(event) => setN(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>length</span>
          <input type="number" value={length} onChange={(event) => setLength(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>energy</span>
          <input type="number" value={energy} onChange={(event) => setEnergy(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>barrier</span>
          <input type="number" value={barrier} onChange={(event) => setBarrier(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>sigma</span>
          <input type="number" value={sigma} onChange={(event) => setSigma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>time</span>
          <input type="number" value={time} onChange={(event) => setTime(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>mix</span>
          <input type="number" value={mix} onChange={(event) => setMix(event.target.value)} step="any" />
        </label>
      </div>

      <div className="demo-output">
        <div className="demo-note">{summary}</div>
        <MathInline latex={String.raw`\psi_n(x)=\sqrt{\frac{2}{L}}\sin\left(\frac{n\pi x}{L}\right)`} />
      </div>

      <PlotCanvas series={[{ id: "psi", points, color: "#2563eb" }]} xLabel="x" yLabel="ψ" />
    </div>
  );
}

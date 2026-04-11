"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { PlotlyPlot } from "./PlotlyPlot";
import { MathInline } from "./MathBlock";

const kB = 1.380649e-23;

type Mode = "boltzmann" | "equipartition" | "montecarlo" | "ising" | "lattice";
type Spin = 1 | -1;

export function StatMechExtrasSim() {
  const [mode, setMode] = useState<Mode>("boltzmann");
  const [temp, setTemp] = useState("300");
  const [deltaE, setDeltaE] = useState("2e-21");
  const [dof, setDof] = useState("3");
  const [mcSteps, setMcSteps] = useState("500");
  const [gridSize, setGridSize] = useState("24");
  const [coupling, setCoupling] = useState("1");

  const results = useMemo(() => {
    const T = Math.max(1e-6, Number(temp));
    const dE = Number(deltaE);
    const dofVal = Number(dof);
    const steps = Math.max(50, Math.min(2000, Number(mcSteps)));
    const n = Math.max(10, Math.min(40, Math.floor(Number(gridSize))));
    const J = Number(coupling);

    const boltz = Math.exp(-dE / (kB * T));
    const energies = Array.from({ length: 40 }, (_, i) => i * (dE / 10));
    const boltzCurve = energies.map((E) => ({ x: E, y: Math.exp(-E / (kB * T)) }));

    const equip = dofVal > 0 ? 0.5 * dofVal * kB * T : NaN;

    let mcAvg = 0;
    if (Number.isFinite(steps)) {
      let x = 0;
      let v = 0;
      for (let i = 0; i < steps; i += 1) {
        const proposal = x + (Math.random() - 0.5) * 0.5;
        const dU = 0.5 * (proposal * proposal - x * x);
        if (dU <= 0 || Math.random() < Math.exp(-dU / (kB * T))) {
          x = proposal;
        }
        v += x * x;
      }
      mcAvg = v / steps;
    }

    const spins: Spin[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => (Math.random() > 0.5 ? 1 : -1) as Spin)
    );
    const beta = 1 / (kB * T);
    const metropolis = 120;
    for (let iter = 0; iter < metropolis; iter += 1) {
      for (let i = 0; i < n * n; i += 1) {
        const x = Math.floor(Math.random() * n);
        const y = Math.floor(Math.random() * n);
        const s = spins[x][y];
        const nn =
          spins[(x + 1) % n][y] +
          spins[(x - 1 + n) % n][y] +
          spins[x][(y + 1) % n] +
          spins[x][(y - 1 + n) % n];
        const dE = 2 * J * s * nn;
        if (dE <= 0 || Math.random() < Math.exp(-beta * dE)) {
          spins[x][y] = s === 1 ? -1 : 1;
        }
      }
    }
    const magnet = spins.flat().reduce((acc, s) => acc + s, 0) / (n * n);

    const lattice = Array.from({ length: n }, () => Array.from({ length: n }, () => (Math.random() > 0.7 ? 1 : 0)));

    return {
      boltz,
      boltzCurve,
      equip,
      mcAvg,
      spins,
      magnet,
      lattice
    };
  }, [temp, deltaE, dof, mcSteps, gridSize, coupling]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Stat Mech Extras</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "boltzmann" ? "active" : ""}`} onClick={() => setMode("boltzmann")}>
          Boltzmann
        </button>
        <button type="button" className={`control-chip ${mode === "equipartition" ? "active" : ""}`} onClick={() => setMode("equipartition")}>
          Equipartition
        </button>
        <button type="button" className={`control-chip ${mode === "montecarlo" ? "active" : ""}`} onClick={() => setMode("montecarlo")}>
          Monte Carlo
        </button>
        <button type="button" className={`control-chip ${mode === "ising" ? "active" : ""}`} onClick={() => setMode("ising")}>
          Ising
        </button>
        <button type="button" className={`control-chip ${mode === "lattice" ? "active" : ""}`} onClick={() => setMode("lattice")}>
          Lattice Gas
        </button>
      </div>

      <div className="demo-grid">
        <label className="field">
          <span>Temperature (K)</span>
          <input type="number" value={temp} onChange={(event) => setTemp(event.target.value)} step="any" />
        </label>
        {mode === "boltzmann" ? (
          <label className="field">
            <span>ΔE (J)</span>
            <input type="number" value={deltaE} onChange={(event) => setDeltaE(event.target.value)} step="any" />
          </label>
        ) : null}
        {mode === "equipartition" ? (
          <label className="field">
            <span>Degrees of freedom</span>
            <input type="number" value={dof} onChange={(event) => setDof(event.target.value)} step="1" />
          </label>
        ) : null}
        {mode === "montecarlo" ? (
          <label className="field">
            <span>MC steps</span>
            <input type="number" value={mcSteps} onChange={(event) => setMcSteps(event.target.value)} step="1" />
          </label>
        ) : null}
        {mode === "ising" || mode === "lattice" ? (
          <label className="field">
            <span>grid size</span>
            <input type="number" value={gridSize} onChange={(event) => setGridSize(event.target.value)} step="1" />
          </label>
        ) : null}
        {mode === "ising" ? (
          <label className="field">
            <span>coupling J</span>
            <input type="number" value={coupling} onChange={(event) => setCoupling(event.target.value)} step="any" />
          </label>
        ) : null}
      </div>

      <div className="demo-output">
        {mode === "boltzmann" ? (
          <>
            <div className="inline-kv">
              <span className="pill">Boltzmann factor = {Number.isFinite(results.boltz) ? results.boltz.toExponential(3) : "--"}</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`p \propto e^{-\Delta E/k_B T}`} />
            </div>
          </>
        ) : null}
        {mode === "equipartition" ? (
          <>
            <div className="inline-kv">
              <span className="pill">⟨E⟩ = {Number.isFinite(results.equip) ? results.equip.toExponential(3) : "--"} J</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`\langle E\rangle=\frac{f}{2}k_B T`} />
            </div>
          </>
        ) : null}
        {mode === "montecarlo" ? (
          <>
            <div className="inline-kv">
              <span className="pill">⟨x²⟩ ~ {Number.isFinite(results.mcAvg) ? results.mcAvg.toExponential(3) : "--"}</span>
            </div>
            <div className="demo-note">Metropolis sampling of a harmonic toy potential.</div>
          </>
        ) : null}
        {mode === "ising" ? (
          <>
            <div className="inline-kv">
              <span className="pill">magnetization = {Number.isFinite(results.magnet) ? results.magnet.toFixed(2) : "--"}</span>
            </div>
            <div className="demo-note">2D Ising toy model with Metropolis updates.</div>
          </>
        ) : null}
        {mode === "lattice" ? (
          <div className="demo-note">Binary occupancy lattice gas snapshot.</div>
        ) : null}
      </div>

      {mode === "boltzmann" ? (
        <PlotCanvas series={[{ id: "boltz", points: results.boltzCurve, color: "#2563eb" }]} xLabel="Energy" yLabel="weight" />
      ) : null}

      {mode === "ising" ? (
        <PlotlyPlot
          data={[
            {
              type: "heatmap",
              z: results.spins,
              colorscale: "RdBu",
              zmin: -1,
              zmax: 1
            }
          ]}
          layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
          style={{ height: "360px" }}
        />
      ) : null}

      {mode === "lattice" ? (
        <PlotlyPlot
          data={[
            {
              type: "heatmap",
              z: results.lattice,
              colorscale: [
                [0, "#f4f2ec"],
                [1, "#0b7285"]
              ],
              zmin: 0,
              zmax: 1
            }
          ]}
          layout={{ margin: { l: 40, r: 10, t: 20, b: 30 } }}
          style={{ height: "360px" }}
        />
      ) : null}
    </div>
  );
}

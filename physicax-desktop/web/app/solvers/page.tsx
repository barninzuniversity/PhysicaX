import { SolverStepDemo } from "../components/SolverStepDemo";

export default function SolversPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Solver Comparison</h2>
        <p>
          This page compares numerical solvers and highlights where they succeed or fail. The default
          ODE solver is RK4, with Euler and Heun included for education and comparison.
        </p>
      </section>

      <section className="section reveal">
        <h2>Solver Profiles</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Euler</h3>
            <p>Global error: O(h)</p>
            <p>Fast but unstable for oscillatory systems.</p>
            <p>Use for teaching and error visualization.</p>
          </div>
          <div className="model-card">
            <h3>Heun</h3>
            <p>Global error: O(h^2)</p>
            <p>Predictor-corrector improves stability.</p>
            <p>Good balance for demo comparisons.</p>
          </div>
          <div className="model-card">
            <h3>RK4</h3>
            <p>Global error: O(h^4)</p>
            <p>Default for ODEs and most models.</p>
            <p>Better energy behavior than Euler.</p>
          </div>
          <div className="model-card">
            <h3>Symplectic (Planned)</h3>
            <p>Ideal for Hamiltonian systems.</p>
            <p>Preserves long-term energy behavior.</p>
            <p>Recommended for orbits and pendulums.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Live Solver Comparison</h2>
        <p>Compare Euler, Heun, and RK4 on a simple test equation.</p>
        <SolverStepDemo />
      </section>

      <section className="section reveal">
        <h2>Comparison Visuals</h2>
        <div className="plot-grid">
          <div className="plot-card">
            <div className="plot-title">Error vs Step Size</div>
            <p>Log-log plot showing convergence rates.</p>
          </div>
          <div className="plot-card">
            <div className="plot-title">Energy Drift</div>
            <p>SHO energy over time for Euler vs RK4.</p>
          </div>
          <div className="plot-card">
            <div className="plot-title">Phase Portrait</div>
            <p>Phase space comparison for pendulum models.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Stability Warnings</h2>
        <ul className="governance-list">
          <li>Warn when dt is large relative to natural frequency.</li>
          <li>Warn when explicit Euler adds energy to stable systems.</li>
          <li>Warn on PDE CFL violations in heat or wave solvers.</li>
        </ul>
      </section>
    </>
  );
}

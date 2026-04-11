import { FeatureChecklist } from "../components/FeatureChecklist";

export default function TestingPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Scientific Testing Strategy</h2>
        <p>
          Testing is mandatory for any numerical or formula-heavy module. This page summarizes the
          required test types and the rules used across the platform.
        </p>
      </section>

      <section className="section reveal">
        <h2>Core Test Types</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Reference Tests</h3>
            <p>Compare against known analytical solutions where possible.</p>
          </div>
          <div className="card">
            <h3>Invariant Tests</h3>
            <p>Energy conservation, monotonicity, entropy constraints.</p>
          </div>
          <div className="card">
            <h3>Edge-Case Tests</h3>
            <p>Validate domain limits, singularities, and invalid inputs.</p>
          </div>
          <div className="card">
            <h3>Solver Convergence</h3>
            <p>Confirm error improves as timestep decreases.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Interactive Test Checklist</h2>
        <FeatureChecklist
          title="Core Test Coverage"
          storageKey="testing-core"
          items={[
            "Reference tests against analytic solutions.",
            "Invariant tests (energy, entropy, monotonicity).",
            "Edge-case tests for invalid domains.",
            "Solver convergence tests vs dt."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>Numerical Sanity Checks</h2>
        <ul className="governance-list">
          <li>Warn if timestep is too large relative to natural frequency.</li>
          <li>Detect NaN/Inf and abort with diagnostics.</li>
          <li>Warn on unstable explicit PDE schemes.</li>
          <li>Use tolerances for float comparisons.</li>
        </ul>
      </section>

      <section className="section reveal">
        <h2>Recommended Golden Cases</h2>
        <FeatureChecklist
          title="Golden Cases"
          storageKey="testing-golden"
          items={[
            "Ideal gas at STP and known volume.",
            "SHM period for a known k/m.",
            "Projectile range without drag.",
            "Logistic map fixed-point behavior at r=2.9.",
            "Heat equation convergence on a known initial condition."
          ]}
        />
      </section>
    </>
  );
}

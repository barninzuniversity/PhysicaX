import { FeatureChecklist } from "../components/FeatureChecklist";

export default function GovernancePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Formula Governance</h2>
        <p>
          This is the non-negotiable rule set that keeps PhysicaX scientifically credible. Every
          model must reference a single canonical formula registry entry and expose assumptions,
          domains, and warnings to the user.
        </p>
        <div className="callout">
          Global sign convention: W = work done by the system. Do not mix conventions.
        </div>
      </section>

      <section className="section reveal">
        <h2>Mandatory Per-Model Checklist</h2>
        <ul className="governance-list">
          <li>Use canonical equations from the formula registry only.</li>
          <li>Convert inputs to SI, compute in SI, convert outputs for display.</li>
          <li>Expose assumptions and domain restrictions in the UI.</li>
          <li>Add at least 3 validation cases (exact, limiting, invalid).</li>
          <li>Detect NaN/Inf, singularities, and unstable timesteps.</li>
          <li>Return raw values, derived values, and metadata.</li>
        </ul>
      </section>

      <section className="section reveal">
        <h2>Interactive Compliance Checklist</h2>
        <FeatureChecklist
          title="Per-Model Governance"
          description="Mark each rule as implemented for the current model."
          storageKey="governance-checklist"
          items={[
            "Canonical equations referenced from registry.",
            "Inputs normalized to SI units.",
            "Assumptions and domains displayed in UI.",
            "Validation cases (exact, limiting, invalid).",
            "NaN/Inf and singularities handled.",
            "Diagnostics and metadata returned."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>Unit Policy</h2>
        <div className="columns">
          <div className="column">
            <h3>Always Convert</h3>
            <ul>
              <li>Temperature: T(K) = T(C) + 273.15</li>
              <li>Pressure: 1 atm = 101325 Pa, 1 bar = 1e5 Pa</li>
              <li>Volume: 1 L = 1e-3 m^3</li>
              <li>Angles: radians internally</li>
            </ul>
          </div>
          <div className="column">
            <h3>Never Allow</h3>
            <ul>
              <li>Negative Kelvin temperatures</li>
              <li>Negative absolute pressure in ideal gas</li>
              <li>Log of non-positive arguments</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Common Formula Failure Modes</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Pendulum Equation</h3>
            <p>Exact equation uses sin(theta). Small-angle is an approximation only.</p>
          </div>
          <div className="card">
            <h3>Entropy in Adiabatic</h3>
            <p>DeltaS = 0 only for reversible adiabatic. Not true for irreversible.</p>
          </div>
          <div className="card">
            <h3>Euler for Orbits</h3>
            <p>Explicit Euler can destroy orbits. Prefer RK4 or symplectic methods.</p>
          </div>
        </div>
      </section>
    </>
  );
}

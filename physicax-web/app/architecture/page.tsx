import { ResponseBuilder } from "../components/ResponseBuilder";

export default function ArchitecturePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Model Registry Architecture</h2>
        <p>
          Every model is registered with a standard interface so the frontend can render forms
          automatically and the backend can validate generically. This eliminates formula drift and
          keeps the project scalable.
        </p>
        <div className="code-block">
          <pre><code>{`ModelDefinition:
- id
- domain
- title
- description
- difficulty
- tags
- parameters schema
- initial conditions schema
- solver options
- validation rules
- compute()
- build_plots()
- build_summary()`}</code></pre>
        </div>
      </section>

      <section className="section reveal">
        <h2>Simulation Engine Layers</h2>
        <div className="columns">
          <div className="column">
            <h3>Layer 1: Models</h3>
            <ul>
              <li>Equations, assumptions, parameter domains</li>
              <li>Exact solutions when available</li>
              <li>Derived metrics and output schemas</li>
            </ul>
          </div>
          <div className="column">
            <h3>Layer 2: Solvers</h3>
            <ul>
              <li>ODE solvers (Euler, Heun, RK4)</li>
              <li>PDE solvers with stability checks</li>
              <li>Monte Carlo sampling and random walks</li>
            </ul>
          </div>
          <div className="column">
            <h3>Layer 3: Validation</h3>
            <ul>
              <li>Reference tests and invariants</li>
              <li>Domain warnings and singularity detection</li>
              <li>Stability and timestep checks</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Formula Registry Folder Layout</h2>
        <div className="code-block">
          <pre><code>{`/apps/api/src/physics/
  constants/
  formulas/
  models/
  validators/
  solvers/
  tests/
  FORMULA_GOVERNANCE.md`}</code></pre>
        </div>
        <p>
          FORMULA_GOVERNANCE.md should define sign conventions, unit policy, approved equations,
          numerical method rules, and testing requirements per model.
        </p>
      </section>

      <section className="section reveal">
        <h2>Standard Simulation Response Shape</h2>
        <p>Every simulation endpoint returns a structured response to keep the frontend consistent.</p>
        <div className="code-block">
          <pre><code>{`SimulationResult:
- metadata (model id, run id, status, runtime)
- warnings, assumptions
- summary, key outputs, derived values
- equations (governing + approximations)
- datasets (time series, phase space, distributions)
- plots (frontend-renderable specs)
- animation (frames or compact spec)
- diagnostics (stability notes, conservation checks)
- exports (downloadable artifacts)`}</code></pre>
        </div>
      </section>

      <section className="section reveal">
        <h2>Response Builder</h2>
        <p>Select which sections appear in a simulation response payload.</p>
        <ResponseBuilder />
      </section>

      <section className="section reveal">
        <h2>Architecture Diagram</h2>
        <div className="diagram">
          <svg viewBox="0 0 900 360" role="img" aria-label="Architecture diagram">
            <rect x="20" y="20" width="860" height="320" rx="24" fill="#f8f4ec" stroke="#d9cfc1" />
            <rect x="80" y="60" width="220" height="80" rx="16" fill="#ffffff" stroke="#d9cfc1" />
            <text x="190" y="95" textAnchor="middle" fontSize="14">Frontend (Next.js)</text>
            <rect x="340" y="60" width="220" height="80" rx="16" fill="#ffffff" stroke="#d9cfc1" />
            <text x="450" y="95" textAnchor="middle" fontSize="14">API (FastAPI)</text>
            <rect x="600" y="60" width="220" height="80" rx="16" fill="#ffffff" stroke="#d9cfc1" />
            <text x="710" y="95" textAnchor="middle" fontSize="14">Workers</text>

            <rect x="120" y="200" width="660" height="110" rx="18" fill="#ffffff" stroke="#d9cfc1" />
            <text x="450" y="230" textAnchor="middle" fontSize="14">Domain Engines</text>
            <text x="450" y="255" textAnchor="middle" fontSize="12" fill="#4d5b63">
              thermo-engine, mechanics-engine, chaos-engine, numerics-core
            </text>
            <text x="450" y="275" textAnchor="middle" fontSize="12" fill="#4d5b63">
              formula registry, validators, tests
            </text>
          </svg>
        </div>
      </section>
    </>
  );
}

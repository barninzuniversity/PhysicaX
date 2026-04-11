import { UILayoutDemo } from "../components/UILayoutDemo";

export default function UIPage() {
  return (
    <>
      <section className="section reveal">
        <h2>UI Standards</h2>
        <p>
          The UI is a desktop-first scientific workspace. It must feel like a professional lab tool,
          not a toy. Use a consistent layout across all labs and expose equations and assumptions
          clearly.
        </p>
      </section>

      <section className="section reveal">
        <h2>Workspace Layout</h2>
        <div className="columns">
          <div className="column">
            <h3>Left Panel</h3>
            <ul>
              <li>Model selection</li>
              <li>Parameter inputs</li>
              <li>Initial conditions</li>
            </ul>
          </div>
          <div className="column">
            <h3>Main Panel</h3>
            <ul>
              <li>Plots and animations</li>
              <li>Phase space and distributions</li>
              <li>Comparison overlays</li>
            </ul>
          </div>
          <div className="column">
            <h3>Right Panel</h3>
            <ul>
              <li>Derived values</li>
              <li>Assumptions and warnings</li>
              <li>Solver diagnostics</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Layout Toggle Preview</h2>
        <p>Toggle panels to simulate workspace layout configurations.</p>
        <UILayoutDemo />
      </section>

      <section className="section reveal">
        <h2>Tabs and Panels</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Results</h3>
            <p>Primary plots, time series, phase space, distributions.</p>
          </div>
          <div className="card">
            <h3>Theory</h3>
            <p>Canonical equations, assumptions, derivations and approximations.</p>
          </div>
          <div className="card">
            <h3>Saved</h3>
            <p>Version history, fork, share, and export controls.</p>
          </div>
          <div className="card">
            <h3>Compare</h3>
            <p>Exact vs numerical, model A vs model B, solver A vs solver B.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Formula Display Panel</h2>
        <p>Every simulation should surface the canonical equations with assumptions and warnings.</p>
        <div className="callout">
          Example structure: Model title, canonical equations, assumptions, domain restrictions, warnings.
        </div>
      </section>
    </>
  );
}

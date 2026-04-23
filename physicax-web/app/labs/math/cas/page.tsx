import Link from "next/link";
import { CasLab } from "../../../components/CasLab";

const casSignals = [
  {
    value: "19",
    label: "operations",
    note: "Simplify, solve, integrate, differentiate, factor, expand, units, and matrix workflows."
  },
  {
    value: "Step-aware",
    label: "output",
    note: "Keep symbolic steps visible so the result feels teachable instead of opaque."
  },
  {
    value: "WASM local",
    label: "runtime",
    note: "The symbolic engine stays local-first, which fits the rest of PhysicaX."
  }
];

const casWorkflow = [
  {
    title: "Write the expression clearly",
    body: "Start from the expression or matrix you actually want to reason about, not just the final operator."
  },
  {
    title: "Add assumptions and substitutions",
    body: "Constrain the problem early so the output looks like math for your use case rather than generic algebra."
  },
  {
    title: "Reuse the result immediately",
    body: "Copy it, graph it, or feed it into the rest of the studio while the context is still fresh."
  }
];

export default function CasPage() {
  return (
    <>
      <section className="section reveal">
        <div className="hero math-studio-hero">
          <div>
            <div className="hero-kicker">Math Studio / CAS</div>
            <h1>A command-window style algebra surface for symbolic work, matrices, and unit-aware transformations.</h1>
            <p className="hero-lede">
              This is the part of PhysicaX that should feel closest to a serious scientific computing environment:
              expression-driven, fast to iterate, and good enough for class, research prep, and model cleanup.
            </p>
            <div className="hero-badges">
              <span>Symbolic solve + simplify</span>
              <span>Matrix operations</span>
              <span>Series + limits</span>
              <span>Unit conversion</span>
            </div>
            <div className="hero-actions">
              <Link className="control-button" href="#cas-workspace">
                Jump to workspace
              </Link>
              <Link className="control-chip" href="/labs/math/graphing">
                Plot the result
              </Link>
              <Link className="control-chip" href="/labs/math/workbench">
                Compare in ODE workbench
              </Link>
            </div>
            <div className="hero-signal-grid">
              {casSignals.map((item) => (
                <div className="signal-card" key={item.label}>
                  <div className="signal-value">{item.value}</div>
                  <div className="signal-label">{item.label}</div>
                  <div className="signal-note">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-panel math-studio-panel">
            <div className="math-console">
              <div className="math-console-bar">
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-title">Symbolic command window</span>
              </div>
              <div className="math-console-body">
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>factor(x^4 - 1)</span>
                </div>
                <div className="math-console-line math-console-output">(x - 1) (x + 1) (x^2 + 1)</div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>Matrix([[1, 2], [3, 4]]).eigenvals()</span>
                </div>
                <div className="math-console-line math-console-output">lambda = 5.372, -0.372</div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>limit((sin(x))/x, x -&gt; 0)</span>
                </div>
                <div className="math-console-line math-console-output">ans = 1</div>
              </div>
            </div>
            <div className="panel-card">
              <h3>Best uses</h3>
              <ul className="feature-list">
                <li>Clean up model equations before plotting or simulation.</li>
                <li>Handle matrix workflows without leaving the app.</li>
                <li>Show derivation steps in a way that still works for teaching.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="workflow-strip">
          {casWorkflow.map((item, index) => (
            <div className="workflow-card" key={item.title}>
              <div className="workflow-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal" id="cas-workspace">
        <div className="section-header">
          <p className="section-kicker">Workspace</p>
          <h2>CAS Workspace</h2>
          <p className="section-lede">
            The engine below is where the real work happens. The new framing is here to make the power feel more
            approachable, faster to learn, and easier to present.
          </p>
        </div>
        <CasLab />
      </section>
    </>
  );
}

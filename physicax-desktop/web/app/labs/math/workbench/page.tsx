import Link from "next/link";
import { FeatureChecklist } from "../../../components/FeatureChecklist";
import { EquationWorkbench } from "../../../components/EquationWorkbench";

const workbenchSignals = [
  {
    value: "ODE-first",
    label: "workflow",
    note: "Define the model, then inspect displacement, velocity, and period from the same surface."
  },
  {
    value: "RK4",
    label: "solver",
    note: "Fast enough for quick exploration while still being credible for classroom and prototyping use."
  },
  {
    value: "Plot-backed",
    label: "feedback",
    note: "Every edit becomes a visual change, which is exactly what keeps users engaged."
  }
];

const workbenchSteps = [
  {
    title: "Write the system",
    body: "Describe the dynamics directly in terms of y, v, t, and your parameters."
  },
  {
    title: "Tune the initial conditions",
    body: "Change the launch state until the system tells a story worth comparing or teaching."
  },
  {
    title: "Read the diagnostics",
    body: "Use extrema and period estimates to reason about the solution instead of staring at the plot alone."
  }
];

const workbenchDemoPath = [
  "Start from the default damped oscillator and explain what each parameter changes before you type anything custom.",
  "Lower dt and extend tMax until the period estimate feels stable enough to defend out loud.",
  "Compare the workbench trace with a simulator, graph, or symbolic result before escalating the claim."
];

const workbenchChecklist = [
  "Name the state variable, the derivative level, and what the equation is supposed to predict.",
  "Explain the parameters and their units before changing them.",
  "Check dt, tMax, and the period estimate before trusting subtle timing claims.",
  "Escalate into the simulator, desktop runtime, or CFD lane only after the compact model already makes sense."
];

export default function MathWorkbenchPage() {
  return (
    <>
      <section className="section reveal">
        <div className="hero math-studio-hero">
          <div>
            <div className="hero-kicker">Math Studio / Workbench</div>
            <h1>An ODE workbench that feels like a lightweight live script for dynamics.</h1>
            <p className="hero-lede">
              Build custom first- or second-order systems, sweep the important parameters, and use the plots and
              summary diagnostics to understand behavior quickly. This is where the math section stops being abstract.
            </p>
            <div className="hero-badges">
              <span>Custom ODE entry</span>
              <span>Displacement + velocity plots</span>
              <span>Period estimation</span>
              <span>Parameter-driven exploration</span>
            </div>
            <div className="hero-actions">
              <Link className="control-button" href="#workbench">
                Open workbench
              </Link>
              <Link className="control-chip" href="/labs/math/cas">
                Prepare equations in CAS
              </Link>
              <Link className="control-chip" href="/labs/math/graphing">
                Compare with graphing
              </Link>
            </div>
            <div className="hero-signal-grid">
              {workbenchSignals.map((item) => (
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
                <span className="math-console-title">Dynamics script</span>
              </div>
              <div className="math-console-body">
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>y'' = -k*y - c*v</span>
                </div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>params = {"{ k: 1.0, c: 0.1 }"}</span>
                </div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>y(0) = 1, v(0) = 0</span>
                </div>
                <div className="math-console-line math-console-output">response: stable damped oscillation</div>
              </div>
            </div>
            <div className="panel-card">
              <h3>When this shines</h3>
              <ul className="feature-list">
                <li>Explaining classical oscillators and damping behavior.</li>
                <li>Testing custom equations before moving into bigger simulations.</li>
                <li>Showing how parameter changes affect response without extra setup.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="workflow-strip">
          {workbenchSteps.map((item, index) => (
            <div className="workflow-card" key={item.title}>
              <div className="workflow-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="split">
          <div className="demo-panel">
            <div className="demo-title">Prepared example path</div>
            <ul className="feature-list">
              {workbenchDemoPath.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="inline-kv">
              <Link className="control-chip" href="/labs/math/graphing">
                Plot related functions
              </Link>
              <Link className="control-chip" href="/desktop">
                Escalate to desktop runtime
              </Link>
            </div>
          </div>
          <FeatureChecklist
            title="Workbench explainability checklist"
            description="Use this before you treat a custom ODE trace as something worth teaching, documenting, or promoting."
            items={workbenchChecklist}
            storageKey="physicax-workbench-explainability-checklist"
          />
        </div>
      </section>

      <section className="section reveal" id="workbench">
        <div className="section-header">
          <p className="section-kicker">Workspace</p>
          <h2>Custom Dynamics Workbench</h2>
          <p className="section-lede">
            Start with the default damped oscillator, then replace the right-hand side with your own equation. This is
            deliberately lightweight so experimentation stays easy.
          </p>
        </div>
        <EquationWorkbench
          title="Custom dynamics workbench"
          equation="-k*y - c*v"
          paramDefaults={{ k: 1, c: 0.1 }}
          mode="second"
          yLabel="y(t)"
          equationSummary="Use this surface to keep the governing equation, solver settings, and trust cues visible while you explore a custom ODE."
          equationRole="The editable expression returns acceleration y'' as a function of time t, state y, velocity v, and any parameters you place in the JSON block."
          parameterDetails={[
            { key: "k", label: "Restoring gain", description: "Acts like a stiffness or linear feedback term in the default damped-oscillator lane." },
            { key: "c", label: "Damping gain", description: "Controls how aggressively the model removes energy from the response." }
          ]}
          assumptions={[
            "The default lane is a second-order single-state model with y and v as the explicit state pair.",
            "The workbench is meant for explainable prototyping before you move into a richer simulator."
          ]}
          validationHints={[
            "Smaller dt values make the period estimate more trustworthy.",
            "A custom equation deserves a graph or simulator comparison before you present it as physics-ready."
          ]}
          escalationHint="Once the compact model reads clearly here, compare it with graphing, reuse algebra from CAS, or promote into the desktop/CFD lane only if runtime evidence becomes part of the question."
        />
        <div className="details-block" style={{ marginTop: "16px" }}>
          <strong>What to do next</strong>
          <p className="demo-note">
            If the model is now readable and the solver cues look healthy, compare it with graphing or the matching lab
            simulator. Move into the desktop runtime or CFD path only when you need stronger artifact evidence or local
            service control.
          </p>
        </div>
      </section>
    </>
  );
}

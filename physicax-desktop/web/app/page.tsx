import Link from "next/link";
import { GlobalSearch } from "./components/GlobalSearch";

const workflowModes = [
  {
    title: "Browser Workspace",
    body: "Best for fast concept checks, plotting, notebook-style exploration, and classroom use.",
    href: "/labs",
    action: "Open labs",
    badge: "Fast start"
  },
  {
    title: "Desktop App",
    body: "Best for bundled local services, offline work, WSL-friendly Linux packaging, and controlled GPU modes.",
    href: "/desktop",
    action: "Open desktop controls",
    badge: "Local runtime"
  },
  {
    title: "CFD Workflow",
    body: "Best for airflow diagnostics, sampled fields, streamlines, and full OpenFOAM-backed validation.",
    href: "/cfd",
    action: "Open CFD control center",
    badge: "High fidelity"
  }
];

const executionFlow = [
  {
    title: "1. Frame the question",
    body: "Start from a lab, search the formula registry, or resume a saved experiment so the model and assumptions are explicit."
  },
  {
    title: "2. Run and compare",
    body: "Adjust parameters, compare numerical and exact behavior, and keep notes, diagnostics, and plots in the same workspace."
  },
  {
    title: "3. Escalate only when needed",
    body: "Promote the run into desktop-backed CFD or richer exports when the question needs local services, OpenFOAM, or packaged tooling."
  }
];

const platformCards = [
  {
    title: "Validation First",
    body: "One formula registry, SI units, explicit assumptions, and checks that make every model easier to trust."
  },
  {
    title: "Local-First Runtime",
    body: "Use the same workspace in the browser or the desktop app, with a bundled backend and a WSL-safe Linux launcher."
  },
  {
    title: "Research-Ready Outputs",
    body: "Keep saved runs, comparisons, notebooks, exports, and reproducible CFD artifacts together instead of scattering them."
  },
  {
    title: "Classroom Friendly",
    body: "Guided challenges, explainable visuals, and a structure that makes it easier to teach from the same tools you use to explore."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="section reveal hero">
        <div>
          <p className="hero-kicker">Local-first simulation workspace</p>
          <h1>PhysicaX gives you one place to explore physics, validate models, and move into CFD when the question gets serious.</h1>
          <p className="hero-lede">
            Use the browser for fast experiments, the desktop app for bundled local services, and the CFD workflow when
            you need streamlines, sampled fields, and OpenFOAM-backed exports. The whole platform stays organized
            around reusable formulas, SI units, and explicit validation.
          </p>
          <div className="hero-badges">
            <span>Browser + Desktop</span>
            <span>WSL Linux Ready</span>
            <span>OpenFOAM Workflow</span>
            <span>Notebook + Export</span>
            <span>Research + Classroom</span>
          </div>
          <div className="hero-actions">
            <Link className="control-button large" href="/labs">
              Open Labs
            </Link>
            <Link className="control-button secondary" href="/desktop">
              Desktop Controls
            </Link>
            <Link className="control-chip" href="/cfd">
              CFD Control Center
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Start where you are</h3>
            <ul>
              <li>Use the browser when you want quick understanding, graphing, or teaching flow.</li>
              <li>Use the desktop app when you want a packaged local stack and runtime controls.</li>
              <li>Use CFD when drag, airflow, or heat transfer needs sampled outputs and solver diagnostics.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>Operational promises</h3>
            <ul>
              <li>Scientific correctness stays ahead of UI convenience.</li>
              <li>Every lab shares the same workspace logic, so learning transfers quickly.</li>
              <li>High-fidelity workflows are available without making the everyday path feel heavy.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Choose The Right Mode</h2>
        <p>
          PhysicaX is one workspace with three working styles. Pick the mode that matches today&apos;s job instead of
          forcing every task through the same interface.
        </p>
        <div className="card-grid">
          {workflowModes.map((mode) => (
            <div className="card" key={mode.title}>
              <div className="inline-kv">
                <span className="pill pill-active">{mode.badge}</span>
              </div>
              <h3>{mode.title}</h3>
              <p>{mode.body}</p>
              <Link className="control-button secondary" href={mode.href}>
                {mode.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <h2>How Work Moves Through PhysicaX</h2>
        <p>
          The interface is designed to keep explanation close to execution, so you can understand the model, run it,
          and only then escalate into heavier tooling.
        </p>
        <div className="card-grid">
          {executionFlow.map((item) => (
            <div className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <h2>Platform Map</h2>
        <p>
          The platform is organized as a set of labs wrapped by a common workspace shell, a formula registry, and a
          validation layer. This is the architectural idea that keeps the experience scalable.
        </p>
        <div className="diagram">
          <svg viewBox="0 0 900 360" role="img" aria-label="Platform map diagram">
            <rect x="20" y="20" width="860" height="320" rx="24" fill="#f8f4ec" stroke="#d9cfc1" />
            <rect x="60" y="70" width="220" height="80" rx="16" fill="#ffffff" stroke="#d9cfc1" />
            <text x="170" y="110" textAnchor="middle" fontSize="14" fill="#101820">Workspace Shell</text>
            <rect x="60" y="180" width="220" height="110" rx="16" fill="#ffffff" stroke="#d9cfc1" />
            <text x="170" y="210" textAnchor="middle" fontSize="14" fill="#101820">Formula Registry</text>
            <text x="170" y="235" textAnchor="middle" fontSize="12" fill="#4d5b63">Equations + assumptions</text>
            <text x="170" y="255" textAnchor="middle" fontSize="12" fill="#4d5b63">Units + validation</text>

            <rect x="340" y="50" width="520" height="240" rx="18" fill="#ffffff" stroke="#d9cfc1" />
            <text x="600" y="80" textAnchor="middle" fontSize="14" fill="#101820">Labs</text>

            <rect x="370" y="110" width="140" height="50" rx="12" fill="#e8f4f2" />
            <text x="440" y="140" textAnchor="middle" fontSize="12" fill="#101820">ThermoLab</text>

            <rect x="530" y="110" width="140" height="50" rx="12" fill="#fbeee6" />
            <text x="600" y="140" textAnchor="middle" fontSize="12" fill="#101820">MechanicsLab</text>

            <rect x="690" y="110" width="140" height="50" rx="12" fill="#e8f4f2" />
            <text x="760" y="140" textAnchor="middle" fontSize="12" fill="#101820">ChaosLab</text>

            <rect x="370" y="180" width="140" height="50" rx="12" fill="#fbeee6" />
            <text x="440" y="210" textAnchor="middle" fontSize="12" fill="#101820">WaveLab</text>

            <rect x="530" y="180" width="140" height="50" rx="12" fill="#e8f4f2" />
            <text x="600" y="210" textAnchor="middle" fontSize="12" fill="#101820">EMLab</text>

            <rect x="690" y="180" width="140" height="50" rx="12" fill="#fbeee6" />
            <text x="760" y="210" textAnchor="middle" fontSize="12" fill="#101820">ODE/PDE Lab</text>
          </svg>
        </div>
      </section>

      <section className="section reveal">
        <h2>What Ships Together</h2>
        <div className="card-grid">
          {platformCards.map((card) => (
            <div className="card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <h2>Search The Platform</h2>
        <p>Find labs, models, pages, and features with the global index.</p>
        <GlobalSearch />
      </section>

      <section className="section reveal quick-actions">
        <div>
          <h2>Quick Actions</h2>
          <p>Jump straight into the area you need and keep momentum when you already know the job.</p>
        </div>
        <div className="quick-action-grid">
          <a className="quick-card" href="/labs">
            <h3>Open Labs</h3>
            <p>Browse the physics labs and launch a simulation.</p>
          </a>
          <a className="quick-card" href="/desktop">
            <h3>Desktop Controls</h3>
            <p>Manage GPU mode, local backend status, and packaged runtime behavior.</p>
          </a>
          <a className="quick-card" href="/dashboard">
            <h3>Dashboard</h3>
            <p>Resume saved experiments and see recent runs.</p>
          </a>
          <a className="quick-card" href="/registry">
            <h3>Formula Registry</h3>
            <p>Review canonical equations, assumptions, and validation notes.</p>
          </a>
          <a className="quick-card" href="/labs/math/graphing">
            <h3>Graphing Calculator</h3>
            <p>Plot, annotate, and explore functions with tool overlays.</p>
          </a>
          <a className="quick-card" href="/cfd">
            <h3>CFD Control Center</h3>
            <p>Check backend health, launch airflow tools, and follow the OpenFOAM workflow.</p>
          </a>
        </div>
      </section>
    </>
  );
}

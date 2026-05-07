import Link from "next/link";
import { GlobalSearch } from "./components/GlobalSearch";
import { ScenarioPlanner, type PlannerScenario } from "./components/ScenarioPlanner";
import { BrandMark } from "./components/BrandMark";

const signalMetrics = [
  {
    value: "70+",
    label: "routes and labs",
    note: "Mechanics, thermo, waves, EM, chaos, ODE/PDE, math, and platform tools."
  },
  {
    value: "3",
    label: "working modes",
    note: "Browser exploration, operator-grade desktop runtime, and CFD escalation."
  },
  {
    value: "1",
    label: "shared workspace",
    note: "Search, formulas, notes, exports, and operating guidance stay connected."
  },
  {
    value: "OpenFOAM",
    label: "solver handoff",
    note: "Start light, then promote the case only when the question truly needs it."
  }
];

const workflowModes = [
  {
    title: "Browser Workspace",
    body: "Best for fast concept checks, plotting, notebook-style exploration, and classroom use with almost no setup overhead.",
    href: "/labs",
    action: "Open labs",
    badge: "Fast start"
  },
  {
    title: "Desktop App",
    body: "Best for bundled local services, offline work, WSL-friendly Linux packaging, update folders, and controlled GPU modes.",
    href: "/desktop",
    action: "Open desktop controls",
    badge: "Local runtime"
  },
  {
    title: "CFD Workflow",
    body: "Best for airflow diagnostics, sampled fields, streamlines, and full OpenFOAM-backed validation when the model needs deeper evidence.",
    href: "/cfd",
    action: "Open CFD control center",
    badge: "High fidelity"
  }
];

const launchLanes = [
  {
    tag: "Run from this PC",
    title: "Use the checkout that is already on this machine.",
    body: "Best when PhysicaX is already on disk and you want the shortest path into the verified Linux desktop helper flow.",
    command: `cd "/path/to/PhysicaX"\nbash scripts/setup-linux.sh\nbash scripts/run-desktop-linux.sh`,
    href: "/desktop#linux-quick-start",
    action: "Open local launch guide"
  },
  {
    tag: "Clone from GitHub",
    title: "Pull the branch and run from source.",
    body: "Best when you want the repo history, the exact published branch, and the option to run the desktop app, website, or backend from source.",
    command: `git clone --branch codex/full-app-github-runbook-pass https://github.com/barninzuniversity/PhysicaX.git\ncd PhysicaX\nbash scripts/setup-linux.sh\nbash scripts/run-desktop-linux.sh`,
    href: "/desktop#github-runbook",
    action: "Open GitHub source guide"
  },
  {
    tag: "Download release",
    title: "Run the packaged Linux release without source.",
    body: "Best when you want a finished handoff artifact from GitHub with the launcher scripts, README, and verification summary already together.",
    command: `mkdir -p ~/Downloads/physicax-release\ncd ~/Downloads/physicax-release\nwget https://github.com/barninzuniversity/PhysicaX/releases/download/v0.1.0/PhysicaX-0.1.0-linux-release.tar.gz\ntar -xzf PhysicaX-0.1.0-linux-release.tar.gz`,
    href: "/desktop#github-runbook",
    action: "Open packaged release guide"
  }
];

const heroPreviewDeck = [
  {
    label: "Browser",
    title: "Fast explanation",
    body: "Use labs, formulas, and search when you need an answer before you need packaging."
  },
  {
    label: "Desktop",
    title: "Reliable local runtime",
    body: "Switch into the managed app when backend visibility, GPU policy, and Linux handoff matter."
  },
  {
    label: "CFD",
    title: "Evidence-first escalation",
    body: "Promote into solver-backed exports only after the quick checks already look trustworthy."
  }
];

const pathfinderScenarios = [
  {
    id: "explore",
    label: "Explore concepts",
    accent: "Browser-first",
    title: "Start in the browser when the goal is understanding, teaching, or quick iteration.",
    summary: "Fast setup, lightweight exploration, and explanation-rich labs.",
    body: "This path is the fastest way to move from a question to a graph, comparison, or guided simulation. It is ideal when you want to stay focused on the model rather than the runtime.",
    bullets: [
      "Launch labs and formulas without touching packaging or local services.",
      "Use search and shared UI patterns to move between topics quickly.",
      "Keep the session teachable with assumptions, units, and notes close to the visuals."
    ],
    metrics: [
      { label: "Best surface", value: "Web app" },
      { label: "Time to first result", value: "< 1 min" },
      { label: "Ideal for", value: "Class, study, demos" }
    ],
    links: [
      { href: "/labs", label: "Open labs" },
      { href: "/registry", label: "Browse registry", variant: "secondary" },
      { href: "/formulas", label: "Formula library", variant: "chip" }
    ],
    note: "Choose this when the question is still forming and you want the shortest path to a meaningful visual or comparison."
  },
  {
    id: "operate",
    label: "Run locally",
    accent: "Desktop runtime",
    title: "Choose the desktop app when reliability, packaging, and runtime visibility matter more than raw convenience.",
    summary: "Bundled services, GPU policy control, and release-aware local execution.",
    body: "This mode is for serious local operation: offline usage, WSL-safe setup, update-folder handling, and a clearer view into what the packaged stack is doing on the machine.",
    bullets: [
      "Inspect backend and GPU state from the same control surface.",
      "Use compatibility mode when stability matters more than renderer throughput.",
      "Package and hand off Linux releases with a repeatable local workflow."
    ],
    metrics: [
      { label: "Best surface", value: "Desktop app" },
      { label: "Strength", value: "Control + portability" },
      { label: "Ideal for", value: "Operators, local builds" }
    ],
    links: [
      { href: "/desktop", label: "Open desktop controls" },
      { href: "/platform", label: "Review platform surface", variant: "secondary" },
      { href: "/research/workflows", label: "Workflow notes", variant: "chip" }
    ],
    note: "Choose this when you need the app to behave like a managed tool instead of a single browser tab."
  },
  {
    id: "validate",
    label: "Validate flow",
    accent: "CFD escalation",
    title: "Move into CFD when the model needs evidence from sampled fields, streamline artifacts, or backend diagnostics.",
    summary: "Backend-aware validation that escalates from quick checks to heavier solver output.",
    body: "This path keeps CFD grounded: check health first, run the lightest useful validation second, and only then promote the case into OpenFOAM-style export and artifact review.",
    bullets: [
      "Verify the runtime before treating the problem as a physics issue.",
      "Use quick LBM checks to expose setup mistakes early.",
      "Inspect CSV and VTK artifacts instead of trusting logs alone."
    ],
    metrics: [
      { label: "Best surface", value: "CFD control center" },
      { label: "Strength", value: "Evidence chain" },
      { label: "Ideal for", value: "Flow + transport studies" }
    ],
    links: [
      { href: "/cfd", label: "Open CFD control center" },
      { href: "/labs/mechanics/drag/flow-3d", label: "Start airflow lab", variant: "secondary" },
      { href: "/labs/thermo/heat-transfer/volume", label: "Heat workflow", variant: "chip" }
    ],
    note: "Choose this when a simple plot is no longer enough and you need exported fields or stronger validation signals."
  }
] satisfies PlannerScenario[];

const productSpotlights = [
  {
    tag: "Modeling",
    title: "Formula-aware labs that stay explainable",
    body: "PhysicaX keeps formulas, units, assumptions, and visual output close together so the model is easier to trust and teach.",
    bullets: ["Formula registry and glossary", "Guided labs with shared UI language", "Validation notes instead of black-box behavior"]
  },
  {
    tag: "Operations",
    title: "Desktop controls built for local reliability",
    body: "The desktop surface is not just a wrapper. It exposes runtime status, backend health, GPU policy, and package-oriented workflows.",
    bullets: ["Bundled backend awareness", "Compatibility mode for WSL", "Update folder and release handoff"]
  },
  {
    tag: "CFD",
    title: "A graceful path into solver-backed workflows",
    body: "Run a quick validation pass first, then escalate into sampled fields and streamline artifacts when the question deserves a heavier stack.",
    bullets: ["Backend status checks", "LBM-style quick validation", "OpenFOAM-oriented export pipeline"]
  },
  {
    tag: "Teaching",
    title: "One platform that works for class and research",
    body: "The same workspace supports guided learning, self-study, and more serious experiment tracking without forcing a different tool for each mode.",
    bullets: ["Challenges and classroom surfaces", "Search and discoverability", "Notebook and dashboard workflows"]
  }
];

const executionFlow = [
  {
    title: "Frame the question",
    body: "Start from a lab, search the formula registry, or resume a saved experiment so the model and assumptions are explicit."
  },
  {
    title: "Run and compare",
    body: "Adjust parameters, compare numerical and exact behavior, and keep notes, diagnostics, and plots in the same workspace."
  },
  {
    title: "Escalate only when needed",
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

const audienceCards = [
  {
    title: "Educators",
    body: "Use PhysicaX to move from explanation to demonstration without swapping tools in the middle of a lesson.",
    href: "/education",
    action: "See education pages"
  },
  {
    title: "Students",
    body: "Use the labs, formula registry, and guided workflows to turn concepts into repeatable experiments instead of one-off screenshots.",
    href: "/labs",
    action: "Start exploring"
  },
  {
    title: "Builders and researchers",
    body: "Use desktop controls, richer exports, and CFD escalation when you need a local stack you can operate with confidence.",
    href: "/research",
    action: "Open research tools"
  }
];

export default function HomePage() {
  return (
    <>
      <section className="section reveal hero" id="workspace-hero">
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
            <Link className="control-chip" href="#start-anywhere">
              Launch runbook
            </Link>
            <Link className="control-chip" href="/cfd">
              CFD Control Center
            </Link>
          </div>
          <div className="hero-signal-grid">
            {signalMetrics.map((metric) => (
              <div className="signal-card" key={metric.label}>
                <div className="signal-value">{metric.value}</div>
                <div className="signal-label">{metric.label}</div>
                <div className="signal-note">{metric.note}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-brand-shell">
            <div className="hero-brand-head">
              <div className="hero-brand-mark" aria-hidden="true">
                <BrandMark decorative idPrefix="hero-brand" />
              </div>
              <div className="hero-brand-copy">
                <p className="hero-brand-kicker">Shared brand system</p>
                <h3>One identity across the site, the Linux app, and the packaged runtime.</h3>
                <p>
                  PhysicaX is designed to feel like one product even as you move between browser-first learning,
                  operator-grade desktop control, and CFD-backed validation.
                </p>
              </div>
            </div>
            <div className="hero-preview-grid">
              {heroPreviewDeck.map((item) => (
                <div className="hero-preview-card" key={item.label}>
                  <span className="hero-preview-label">{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-card">
            <h3>Operational promises</h3>
            <ul className="feature-list">
              <li>Scientific correctness stays ahead of UI convenience.</li>
              <li>Every lab shares the same workspace logic, so learning transfers quickly.</li>
              <li>High-fidelity workflows are available without making the everyday path feel heavy.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal" id="choose-mode">
        <div className="section-header">
          <p className="section-kicker">Choose the mode</p>
          <h2>Choose the Right Mode</h2>
          <p className="section-lede">
            PhysicaX is one workspace with three working styles. Pick the mode that matches today&apos;s job instead of
            forcing every task through the same interface.
          </p>
        </div>
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

      <section className="section reveal" id="start-anywhere">
        <div className="section-header">
          <p className="section-kicker">Start anywhere</p>
          <h2>Pick The Run Lane That Matches Your Machine</h2>
          <p className="section-lede">
            PhysicaX now exposes the three real ways people start it in practice: run the checkout already on this PC,
            clone the GitHub branch and run from source, or download the packaged Linux release and skip the source
            tree entirely.
          </p>
        </div>
        <div className="card-grid">
          {launchLanes.map((lane) => (
            <div className="card" key={lane.title}>
              <div className="inline-kv">
                <span className="pill pill-active">{lane.tag}</span>
              </div>
              <h3>{lane.title}</h3>
              <p>{lane.body}</p>
              <div className="code-block compact">
                <pre>
                  <code>{lane.command}</code>
                </pre>
              </div>
              <Link className="control-chip" href={lane.href}>
                {lane.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal" id="pathfinder">
        <ScenarioPlanner
          eyebrow="Pathfinder"
          title="Plan the Right PhysicaX Session"
          lede="Pick the kind of job you are doing and PhysicaX should make the next step obvious, not ambiguous."
          scenarios={pathfinderScenarios}
        />
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Product map</p>
          <h2>What Makes PhysicaX Feel Different</h2>
          <p className="section-lede">
            This is not just a collection of simulations. The product is shaped around explanation, operation, and
            escalation, so it works as a serious workspace instead of a demo shelf.
          </p>
        </div>
        <div className="spotlight-grid">
          {productSpotlights.map((spotlight) => (
            <div className="spotlight-card" key={spotlight.title}>
              <span className="spotlight-tag">{spotlight.tag}</span>
              <h3>{spotlight.title}</h3>
              <p>{spotlight.body}</p>
              <ul className="spotlight-list">
                {spotlight.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Execution model</p>
          <h2>How Work Moves Through PhysicaX</h2>
          <p className="section-lede">
            The interface is designed to keep explanation close to execution, so you can understand the model, run it,
            and only then escalate into heavier tooling.
          </p>
        </div>
        <div className="workflow-strip">
          {executionFlow.map((item, index) => (
            <div className="workflow-card" key={item.title}>
              <div className="workflow-index">0{index + 1}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Who it serves</p>
          <h2>Built For Teaching, Exploration, And Serious Runtime Work</h2>
          <p className="section-lede">
            PhysicaX is intentionally broad, but not vague. Each part of the platform is there to support a distinct
            kind of user momentum.
          </p>
        </div>
        <div className="card-grid">
          {audienceCards.map((card) => (
            <Link className="card card-link" href={card.href} key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className="control-chip">{card.action}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Architecture</p>
          <h2>Platform Map</h2>
          <p className="section-lede">
            The platform is organized as a set of labs wrapped by a common workspace shell, a formula registry, and a
            validation layer. This is the architectural idea that keeps the experience scalable.
          </p>
        </div>
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
        <div className="section-header">
          <p className="section-kicker">Platform promises</p>
          <h2>What Ships Together</h2>
          <p className="section-lede">
            These are the product qualities that tie the web app, the desktop runtime, and the CFD workflow into one
            coherent system.
          </p>
        </div>
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
        <div className="section-header">
          <p className="section-kicker">Discovery</p>
          <h2>Search The Platform</h2>
          <p className="section-lede">Find labs, models, pages, and features with the global index.</p>
        </div>
        <GlobalSearch />
      </section>

      <section className="section reveal quick-actions-section" id="launch-board">
        <div className="section-header">
          <p className="section-kicker">Launch board</p>
          <h2>Quick Actions</h2>
          <p className="section-lede">Jump straight into the area you need and keep momentum when you already know the job.</p>
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

import Link from "next/link";
import { CFDStatusCard } from "../components/CFDStatusCard";
import { ScenarioPlanner, type PlannerScenario } from "../components/ScenarioPlanner";

const workflowCards = [
  {
    title: "Quick LBM Validation",
    body: "Use the bundled backend to verify geometry, boundary conditions, and a first-pass velocity field before committing to a heavier run.",
    note: "Fastest path"
  },
  {
    title: "OpenFOAM Export",
    body: "Promote validated cases to full OpenFOAM post-processing when you need sampled CSV fields, pressure, and streamline artifacts.",
    note: "Highest fidelity"
  },
  {
    title: "Desktop + WSL Packaging",
    body: "Run the packaged Linux build with the WSL-safe launcher when you want a repeatable local stack instead of assembling services manually.",
    note: "Best for deployment"
  }
];

const successSignals = [
  {
    title: "Backend ready",
    body: "The CFD status panel should report a reachable backend and a clean response from the /status endpoint."
  },
  {
    title: "Sample grid exported",
    body: "OpenFOAM sampling should produce a uniform grid CSV that the app can inspect and compare."
  },
  {
    title: "Streamlines generated",
    body: "When the streamlines dictionary is present, you should see VTK tracks for visual inspection and downstream tooling."
  }
];

const artifactCards = [
  {
    title: "Health endpoint",
    body: "A successful `/status` check tells you the local runtime is alive before you spend time debugging the wrong layer."
  },
  {
    title: "Uniform grid CSV",
    body: "This is the sampled field artifact you can inspect, compare, and carry into analysis workflows after export."
  },
  {
    title: "Streamline tracks",
    body: "When configured, the streamline VTK output becomes the visual proof that the heavier post-processing path really completed."
  }
];

const cfdScenarios = [
  {
    id: "validate",
    label: "Validate geometry",
    accent: "Fast evidence",
    title: "Use the quick validation lane when you need to catch setup mistakes before spending time on heavy post-processing.",
    summary: "A calm first pass for geometry, boundary conditions, and runtime sanity.",
    body: "This is the right starting point when the question is 'is the stack alive and is the setup sensible?' rather than 'do I already need publication-grade artifacts?'",
    bullets: [
      "Check the backend and basic diagnostics before launching anything expensive.",
      "Use the lightest useful LBM-style run to expose setup issues early.",
      "Promote only after the quick run gives you confidence in the case."
    ],
    metrics: [
      { label: "Fastest win", value: "Health + LBM" },
      { label: "Primary goal", value: "Trust the setup" },
      { label: "Best for", value: "Early iteration" }
    ],
    links: [
      { href: "/cfd", label: "Open diagnostics" },
      { href: "/labs/mechanics/drag/flow-3d", label: "Start airflow lab", variant: "secondary" },
      { href: "/desktop", label: "Desktop runtime", variant: "chip" }
    ],
    note: "This lane is about finding mistakes cheaply, not proving success expensively."
  },
  {
    id: "artifacts",
    label: "Review artifacts",
    accent: "OpenFOAM outputs",
    title: "Use the artifact lane when the case needs sampled fields, pressure outputs, and streamline files you can inspect later.",
    summary: "A higher-fidelity path built around concrete exported evidence.",
    body: "Once the quick checks look healthy, this lane gives you the stronger outputs that make CFD decisions more defensible: sampled grids, pressure fields, and streamline tracks.",
    bullets: [
      "Treat the CSV grid and VTK streamlines as the evidence that the heavy path completed.",
      "Inspect outputs directly instead of trusting logs or process success alone.",
      "Use exported files to compare runs, share artifacts, or move into analysis."
    ],
    metrics: [
      { label: "Best artifact", value: "uniformGrid.csv" },
      { label: "Visual proof", value: "tracks.vtk" },
      { label: "Best for", value: "Review + reporting" }
    ],
    links: [
      { href: "/cfd", label: "Open artifact guide" },
      { href: "/labs/thermo/heat-transfer/volume", label: "Heat transfer lab", variant: "secondary" },
      { href: "/registry/models", label: "Model registry", variant: "chip" }
    ],
    note: "This lane matters when you need more than a yes-or-no success message."
  },
  {
    id: "deploy",
    label: "Package locally",
    accent: "Desktop handoff",
    title: "Use the packaged lane when you want the CFD stack to run as a local product, not a manual collection of services.",
    summary: "A deployment-oriented flow for Linux packaging, WSL launch, and repeatable local operation.",
    body: "This lane is for operators and builders who want a controlled desktop runtime with a bundled backend, release files, and a safer WSL startup path.",
    bullets: [
      "Prefer the packaged desktop route when you want one local stack to validate and hand off.",
      "Use the WSL launcher when AppImage mounting is not the safest startup path.",
      "Treat the packaged runtime and artifacts as part of one release story."
    ],
    metrics: [
      { label: "Best surface", value: "Linux desktop app" },
      { label: "Key helper", value: "run-PhysicaX-wsl.sh" },
      { label: "Best for", value: "Repeatable deploys" }
    ],
    links: [
      { href: "/desktop", label: "Open desktop controls" },
      { href: "/cfd", label: "CFD checklist", variant: "secondary" },
      { href: "/platform", label: "Platform overview", variant: "chip" }
    ],
    note: "This lane is about stability and handoff quality just as much as solver output."
  }
] satisfies PlannerScenario[];

export default function CFDPage() {
  return (
    <>
      <section className="section reveal hero">
        <div>
          <p className="hero-kicker">Validated local CFD workflow</p>
          <h1>Move from quick airflow checks to OpenFOAM-backed exports without losing track of what the solver stack is doing.</h1>
          <p className="hero-lede">
            PhysicaX keeps CFD approachable by splitting the path into clear stages: quick LBM validation, backend
            health checks, and full OpenFOAM export when you need sampled fields, pressure, and streamline artifacts.
          </p>
          <div className="hero-badges">
            <span>LBM quick test</span>
            <span>OpenFOAM 10</span>
            <span>Sample CSV</span>
            <span>Streamlines VTK</span>
            <span>WSL-safe desktop flow</span>
          </div>
          <div className="hero-actions">
            <Link href="/labs/mechanics/drag/flow-3d" className="control-button large">
              Open 3D airflow
            </Link>
            <Link href="/labs/thermo/heat-transfer/volume" className="control-button secondary">
              Open heat transfer
            </Link>
          </div>
          <div className="workflow-strip">
            <div className="workflow-card">
              <div className="workflow-index">01</div>
              <h3>Check service health</h3>
              <p>Confirm the backend responds before treating any CFD problem as a modeling issue.</p>
            </div>
            <div className="workflow-card">
              <div className="workflow-index">02</div>
              <h3>Validate fast</h3>
              <p>Use the lightest useful run first so geometry and boundary-condition mistakes surface quickly.</p>
            </div>
            <div className="workflow-card">
              <div className="workflow-index">03</div>
              <h3>Export artifacts</h3>
              <p>Promote the case only when you need sampled fields, pressure output, or streamline review.</p>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Choose the right engine</h3>
            <ul className="feature-list">
              <li>Use LBM for fast iteration and geometry sanity checks.</li>
              <li>Use OpenFOAM when you need higher-fidelity post-processing outputs.</li>
              <li>Use the packaged desktop flow when you want the whole stack managed locally.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>What you should expect</h3>
            <ul className="feature-list">
              <li>A clear backend status before you launch the heavy step.</li>
              <li>Explicit exported artifacts instead of vague solver success.</li>
              <li>Enough explanation in the UI to know what to run next.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Pick Your CFD Path</h2>
        <div className="card-grid">
          {workflowCards.map((card) => (
            <div className="card" key={card.title}>
              <div className="inline-kv">
                <span className="pill pill-active">{card.note}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <ScenarioPlanner
          eyebrow="Planner"
          title="Choose The CFD Lane Before You Spend Compute"
          lede="The fastest way to calm down a CFD workflow is to make the purpose of the next run explicit."
          scenarios={cfdScenarios}
        />
      </section>

      <section className="section reveal">
        <h2>Backend Status</h2>
        <p>Check this before you assume the physics is wrong. A healthy backend makes the rest of the workflow much easier to interpret.</p>
        <CFDStatusCard />
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Run order</p>
          <h2>Recommended Workflow</h2>
          <p className="section-lede">
            CFD gets much calmer when you treat it like an evidence chain instead of a single magic button.
          </p>
        </div>
        <div className="workflow-strip">
          <div className="workflow-card">
            <div className="workflow-index">01</div>
            <h3>Start with status</h3>
            <p>Use the diagnostics panel to verify the backend is reachable and the current runtime is the one you expect.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">02</div>
            <h3>Run the quick test</h3>
            <p>Launch the LBM smoke test first. It gives you fast feedback on whether the stack is alive before longer runs.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">03</div>
            <h3>Promote to OpenFOAM</h3>
            <p>When the geometry and flow setup look sensible, export to OpenFOAM for sampled grids, pressure fields, and streamlines.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">04</div>
            <h3>Inspect artifacts</h3>
            <p>Look for the CSV grid and streamline VTK outputs. Those files are the proof that the full pipeline actually completed.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>WSL + Desktop Quick Start</h2>
        <div className="code-block">
          <pre>
            <code>{`cd /path/to/PhysicaX/physicax-desktop/dist/linux-release
chmod +x run-PhysicaX-wsl.sh
./run-PhysicaX-wsl.sh`}</code>
          </pre>
        </div>
        <p className="demo-note">
          This is the safest packaged route on WSL because it runs the verified extracted desktop binary directly instead
          of depending on the raw AppImage mount at launch time.
        </p>
      </section>

      <section className="section reveal">
        <h2>Manual Backend Quick Start</h2>
        <div className="code-block">
          <pre>
            <code>{`cd /path/to/PhysicaX/physicax-web/cfd/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000`}</code>
          </pre>
        </div>
        <p className="demo-note">
          Point <span className="mono">CFD_BACKEND_URL</span> to the running backend if you are using the browser workflow
          instead of the packaged desktop runtime.
        </p>
      </section>

      <section className="section reveal">
        <h2>Full OpenFOAM Export</h2>
        <div className="code-block">
          <pre>
            <code>{`# Inside your OpenFOAM case
cp /path/to/PhysicaX/physicax-web/cfd/openfoam/sampleDict system/sampleDict
postProcess -func sample

# Expected artifacts include:
# postProcessing/sample/<time>/uniformGrid.csv
# postProcessing/streamlines/<time>/tracks.vtk`}</code>
          </pre>
        </div>
        <p className="demo-note">
          The app now expects valid OpenFOAM 10 sampling and only runs streamlines when the required configuration is
          present, which avoids the old hard failures.
        </p>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Artifact review</p>
          <h2>What To Look For After A Successful Run</h2>
          <p className="section-lede">
            These artifacts are the concrete outputs that tell you the solver path did more than simply avoid crashing.
          </p>
        </div>
        <div className="card-grid">
          {artifactCards.map((card) => (
            <div className="card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <h2>What Success Looks Like</h2>
        <div className="card-grid">
          {successSignals.map((signal) => (
            <div className="card" key={signal.title}>
              <h3>{signal.title}</h3>
              <p>{signal.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

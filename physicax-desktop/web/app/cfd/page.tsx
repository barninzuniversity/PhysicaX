import Link from "next/link";
import { CFDStatusCard } from "../components/CFDStatusCard";
import { FeatureChecklist } from "../components/FeatureChecklist";
import { ScenarioPlanner, type PlannerScenario } from "../components/ScenarioPlanner";

const workflowCards = [
  {
    title: "Check runtime",
    body: "Confirm the backend is reachable, the active engine is the one you expect, and the local lane is healthy before you interpret physics.",
    note: "Operator first"
  },
  {
    title: "Run quick validation",
    body: "Use the LBM smoke test to catch geometry and boundary-condition mistakes cheaply before paying for heavier export work.",
    note: "Fast evidence"
  },
  {
    title: "Inspect artifacts",
    body: "Read uniform grids, pressure outputs, and streamline evidence directly instead of trusting vague success logs from a heavy run.",
    note: "Concrete proof"
  },
  {
    title: "Escalate to desktop/export",
    body: "Promote into the packaged desktop lane or OpenFOAM export only when the quick path already looks physically sensible.",
    note: "Controlled promotion"
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

const modelClarityCards = [
  {
    title: "Quick LBM validation explains the setup",
    body: "Use the fast lane to verify geometry, boundary conditions, and whether the runtime behaves sensibly before you ask for heavier exports.",
    note: "Best first move"
  },
  {
    title: "OpenFOAM is the evidence layer",
    body: "Promote into OpenFOAM only after the quick pass already looks physically reasonable. That keeps expensive runs attached to a clear purpose.",
    note: "Promote with intent"
  },
  {
    title: "Artifacts close the trust loop",
    body: "Treat the uniform grid, pressure output, and streamline files as the proof that the export lane really completed and is worth reviewing.",
    note: "Files over logs"
  }
];

const cfdEvidenceChecklist = [
  "Confirm the /status endpoint reports a healthy local backend before adjusting the model.",
  "Run the quick LBM validation first to catch geometry and boundary-condition mistakes cheaply.",
  "Escalate into OpenFOAM only after the fast pass looks physically sensible.",
  "Inspect uniformGrid.csv, pressure output, and streamline files before trusting the heavy run."
];

const quickLaunchCards = [
  {
    title: "Run the full desktop runtime",
    command: `cd "/path/to/PhysicaX"\nbash scripts/run-desktop-linux.sh`,
    note: "Expect the Electron window to open after the Linux doctor and runtime prep complete."
  },
  {
    title: "Run the website only",
    command: `cd "/path/to/PhysicaX"\nbash scripts/run-web-linux.sh`,
    note: "Expect a local production web server on http://127.0.0.1:3000."
  },
  {
    title: "Run the CFD backend only",
    command: `cd "/path/to/PhysicaX"\nbash scripts/run-cfd-backend-linux.sh`,
    note: "Expect the FastAPI backend to answer on http://127.0.0.1:8000/status."
  },
  {
    title: "Run the full confidence pass",
    command: `cd "/path/to/PhysicaX"\nenv PHYSICAX_SKIP_SETUP=1 bash scripts/verify-linux.sh`,
    note: "Expect doctor, prep, smoke, packaging, and release-verification checks to run end to end."
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
          <p className="hero-kicker">Validated local CFD control deck</p>
          <h1>Run CFD like an operator: check the runtime, validate cheaply, then promote only when the evidence gets stronger.</h1>
          <p className="hero-lede">
            PhysicaX keeps the local solver story readable by making runtime health, quick validation, and exported
            evidence visible in one place. The goal is not to press a magic button. It is to know what the current lane
            can prove, what it cannot prove yet, and when heavier export work is justified.
          </p>
          <div className="hero-badges">
            <span>Runtime health</span>
            <span>LBM quick test</span>
            <span>OpenFOAM evidence</span>
            <span>Sample CSV</span>
            <span>Desktop + Linux handoff</span>
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
              <h3>Check runtime</h3>
              <p>Confirm the backend responds and the active lane is the one you think you are using.</p>
            </div>
            <div className="workflow-card">
              <div className="workflow-index">02</div>
              <h3>Validate fast</h3>
              <p>Use the lightest useful run first so setup mistakes surface before expensive post-processing.</p>
            </div>
            <div className="workflow-card">
              <div className="workflow-index">03</div>
              <h3>Review evidence</h3>
              <p>Inspect exported fields and streamline outputs before you trust the heavy path.</p>
            </div>
          </div>
        </div>
        <div className="hero-panel cfd-hero-console">
          <CFDStatusCard />
          <div className="panel-card">
            <h3>Control deck</h3>
            <ul className="feature-list">
              <li>Refresh runtime state before changing the model.</li>
              <li>Run the quick LBM lane before escalating into OpenFOAM.</li>
              <li>Use the packaged desktop flow when local runtime trust matters as much as solver output.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>What success looks like</h3>
            <ul className="feature-list">
              <li>A healthy backend and a readable recommended next action.</li>
              <li>Explicit exported artifacts instead of vague “solver succeeded” language.</li>
              <li>A calm escalation path from runtime check to artifact-backed review.</li>
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
        <div className="section-header">
          <p className="section-kicker">Model clarity</p>
          <h2>Keep the CFD story readable as you escalate</h2>
          <p className="section-lede">
            The point of the workflow is not just to run a solver. It is to know what each stage can prove, what it
            cannot prove yet, and when it is worth paying for a heavier validation step.
          </p>
        </div>
        <div className="card-grid">
          {modelClarityCards.map((card) => (
            <div className="card" key={card.title}>
              <div className="inline-kv">
                <span className="pill pill-active">{card.note}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
        <FeatureChecklist
          title="CFD Evidence Ladder"
          description="Use this as the calm path from exploration to evidence. The workflow gets stronger only when each earlier step already makes sense."
          items={cfdEvidenceChecklist}
          storageKey="physicax-cfd-evidence-ladder"
        />
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
        <div className="section-header">
          <p className="section-kicker">Quick launch</p>
          <h2>Use the right launch lane for the job</h2>
          <p className="section-lede">
            Start light when you are exploring, then use the stronger runtime or verification lanes only when you need
            more evidence.
          </p>
        </div>
        <div className="card-grid">
          {quickLaunchCards.map((card) => (
            <div className="card" key={card.title}>
              <h3>{card.title}</h3>
              <div className="code-block compact">
                <pre>
                  <code>{card.command}</code>
                </pre>
              </div>
              <p className="demo-note">{card.note}</p>
            </div>
          ))}
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

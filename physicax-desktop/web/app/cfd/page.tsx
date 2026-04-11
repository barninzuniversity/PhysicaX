import Link from "next/link";
import { CFDStatusCard } from "../components/CFDStatusCard";

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
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Choose the right engine</h3>
            <ul>
              <li>Use LBM for fast iteration and geometry sanity checks.</li>
              <li>Use OpenFOAM when you need higher-fidelity post-processing outputs.</li>
              <li>Use the packaged desktop flow when you want the whole stack managed locally.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>What you should expect</h3>
            <ul>
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
        <h2>Backend Status</h2>
        <p>Check this before you assume the physics is wrong. A healthy backend makes the rest of the workflow much easier to interpret.</p>
        <CFDStatusCard />
      </section>

      <section className="section reveal">
        <h2>Recommended Workflow</h2>
        <div className="card-grid">
          <div className="card">
            <h3>1. Start with status</h3>
            <p>Use the diagnostics panel to verify the backend is reachable and the current runtime is the one you expect.</p>
          </div>
          <div className="card">
            <h3>2. Run the quick test</h3>
            <p>Launch the LBM smoke test first. It gives you fast feedback on whether the stack is alive before longer runs.</p>
          </div>
          <div className="card">
            <h3>3. Promote to OpenFOAM</h3>
            <p>When the geometry and flow setup look sensible, export to OpenFOAM for sampled grids, pressure fields, and streamlines.</p>
          </div>
          <div className="card">
            <h3>4. Inspect artifacts</h3>
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

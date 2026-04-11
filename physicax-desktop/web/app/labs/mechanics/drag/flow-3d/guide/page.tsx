import { MathInline } from "../../../../../components/MathBlock";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>CFD Guide (Pro Precision)</h2>
        <p>
          This guide is for getting F1-style streamlines and pressure maps. The key is to run a real CFD solver (OpenFOAM)
          and feed its field + streamline outputs into PhysicaX.
        </p>
      </section>

      <section className="section reveal">
        <h3>Quick Start Checklist</h3>
        <ul className="list">
          <li>Use <strong>STL</strong> or <strong>PLY</strong> for the VTK view (OBJ is not supported in this VTK build).</li>
          <li>Set <span className="mono">NEXT_PUBLIC_CFD_BACKEND_URL</span> in <span className="mono">.env</span>.</li>
          <li>Generate a case from the CFD panel, run it in OpenFOAM, then load streamlines.</li>
          <li>Switch render engine to <strong>VTK Streamtubes (CFD)</strong>.</li>
        </ul>
      </section>

      <section className="section reveal">
        <h3>Precision Pipeline</h3>
        <ol className="list">
          <li>Upload a watertight mesh (STL/PLY). Make sure the object scale is correct.</li>
          <li>Generate the OpenFOAM case and run it (WSL recommended on Windows).</li>
          <li>Ensure the case writes a velocity field <strong>U</strong> and streamlines (the controlDict already includes a streamLine object).</li>
          <li>Back in PhysicaX, click <strong>Refresh CFD</strong> and switch to VTK mode.</li>
          <li>Enable <strong>contact filter</strong> to keep only surface-hugging streamlines.</li>
        </ol>
      </section>

      <section className="section reveal">
        <h3>Make It Look Like F1 CFD</h3>
        <ul className="list">
          <li>Press <strong>Pro CFD preset</strong> in the airflow panel.</li>
          <li>Increase streamline count/steps for dense, tube-like ribbons.</li>
          <li>Use a small contact margin (0.06-0.12) to remove far-field lines.</li>
          <li>Enable boundary layer tubes for near-wall ribbons.</li>
          <li>Turn on surface banding to get clear pressure zones.</li>
          <li>Enable slice stacks (vorticity/wake) for volumetric context.</li>
          <li>Keep surface pressure on for the heatmap overlay.</li>
        </ul>
      </section>

      <section className="section reveal">
        <h3>Accuracy Notes</h3>
        <p>
          PhysicaX only shows <em>physically exact</em> paths when you run a real CFD solver and load its exported fields.
          Analytic mode is a visual approximation for fast previews.
        </p>
        <div className="demo-note">
          <MathInline latex={String.raw`\\text{Use OpenFOAM for true } \\nabla \\cdot \\vec{u} = 0 \\text{ flow fields.}`} />
        </div>
      </section>

      <section className="section reveal">
        <h3>Troubleshooting</h3>
        <ul className="list">
          <li>No streamlines? Make sure the OpenFOAM run produced a streamLine VTK file.</li>
          <li>Nothing in VTK view? Ensure <span className="mono">NEXT_PUBLIC_CFD_BACKEND_URL</span> is set and the backend is running.</li>
          <li>Heatmap inverted? Use VTK + OpenFOAM for the most accurate surface pressure.</li>
        </ul>
      </section>
    </>
  );
}


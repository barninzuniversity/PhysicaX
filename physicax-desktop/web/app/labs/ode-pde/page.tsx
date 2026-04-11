import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";
import { StabilityDemo } from "../../components/StabilityDemo";

export default function ODEPDELabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>ODE / PDE Lab</h2>
        <p>Numerical solvers, stability, and PDE visualizations.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Solver Playground</h3>
            <p><Link href="/labs/ode-pde/solvers">Open solver tools</Link></p>
          </div>
          <div className="card">
            <h3>Phase Portraits</h3>
            <p><Link href="/labs/ode-pde/phase">Open phase portraits</Link></p>
          </div>
          <div className="card">
            <h3>Heat Equation</h3>
            <p><Link href="/labs/ode-pde/heat">Open heat equation</Link></p>
          </div>
          <div className="card">
            <h3>Wave Equation</h3>
            <p><Link href="/labs/ode-pde/wave">Open wave equation</Link></p>
          </div>
          <div className="card">
            <h3>PDE Explorer</h3>
            <p><Link href="/labs/ode-pde/pde-explorer">Open PDE explorer</Link></p>
          </div>
          <div className="card">
            <h3>Reaction-Diffusion</h3>
            <p><Link href="/labs/ode-pde/reaction-diffusion">Open reaction-diffusion lab</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>ODE</h3>
            <MathBlock latex={String.raw`y' = f(t,y)`} />
          </div>
          <div className="model-card">
            <h3>Heat Equation</h3>
            <MathBlock latex={String.raw`\frac{\partial u}{\partial t} = \alpha \nabla^2 u`} />
          </div>
          <div className="model-card">
            <h3>Wave Equation</h3>
            <MathBlock latex={String.raw`\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u`} />
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Stability Panel</h2>
        <p>Quick CFL check for explicit heat and wave solvers.</p>
        <StabilityDemo />
      </section>
    </>
  );
}

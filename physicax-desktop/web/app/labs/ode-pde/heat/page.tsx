import Link from "next/link";

export default function ODEHeatPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Heat Equation Lab</h2>
        <p>Choose a heat diffusion model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Heat Equation (1D)</h3>
            <p><Link href="/labs/ode-pde/heat/1d">Open 1D heat equation</Link></p>
          </div>
          <div className="card">
            <h3>Heat Equation (2D)</h3>
            <p><Link href="/labs/ode-pde/heat/2d">Open 2D heatmap</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

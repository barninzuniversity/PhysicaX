import Link from "next/link";

export default function ODESolversPage() {
  return (
    <>
      <section className="section reveal">
        <h2>ODE Solver Playground</h2>
        <p>Compare solvers, stability, and step accuracy.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Solver Playground</h3>
            <p><Link href="/labs/ode-pde/solvers/playground">Open full solver playground</Link></p>
          </div>
          <div className="card">
            <h3>Solver Comparison</h3>
            <p><Link href="/labs/ode-pde/solvers/compare">Open solver comparison</Link></p>
          </div>
          <div className="card">
            <h3>Solver Step</h3>
            <p><Link href="/labs/ode-pde/solvers/step">Open step demo</Link></p>
          </div>
          <div className="card">
            <h3>Stability</h3>
            <p><Link href="/labs/ode-pde/solvers/stability">Open stability demo</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

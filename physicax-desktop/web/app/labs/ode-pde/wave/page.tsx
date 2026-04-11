import Link from "next/link";

export default function ODEWavePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Wave Equation Lab</h2>
        <p>Select a wave equation simulator.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Wave Equation (1D)</h3>
            <p><Link href="/labs/ode-pde/wave/1d">Open wave equation</Link></p>
          </div>
          <div className="card">
            <h3>Membrane Modes</h3>
            <p><Link href="/labs/ode-pde/wave/membrane">Open membrane modes</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

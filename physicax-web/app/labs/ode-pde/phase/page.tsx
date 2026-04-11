import Link from "next/link";

export default function ODEPhasePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Phase Portrait Studio</h2>
        <p>Select a phase portrait model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Phase Portrait</h3>
            <p><Link href="/labs/ode-pde/phase/portrait">Open phase portrait</Link></p>
          </div>
          <div className="card">
            <h3>Linear System Explorer</h3>
            <p><Link href="/labs/ode-pde/phase/system">Open system explorer</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

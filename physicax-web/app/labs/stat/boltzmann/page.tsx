import Link from "next/link";

export default function BoltzmannIndex() {
  return (
    <>
      <section className="section reveal">
        <h2>Boltzmann Lab</h2>
        <p>Choose a Boltzmann distribution model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Maxwell-Boltzmann</h3>
            <p><Link href="/labs/stat/boltzmann/maxwell">Open Maxwell-Boltzmann</Link></p>
          </div>
          <div className="card">
            <h3>Two-Level System</h3>
            <p><Link href="/labs/stat/boltzmann/two-level">Open two-level system</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

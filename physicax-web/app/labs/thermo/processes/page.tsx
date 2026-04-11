import Link from "next/link";

export default function ThermoProcessPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Processes + Cycles</h2>
        <p>Choose a thermodynamic process simulator.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>P-V Process Explorer</h3>
            <p><Link href="/labs/thermo/processes/pv">Open P-V explorer</Link></p>
          </div>
          <div className="card">
            <h3>Cycle Efficiency</h3>
            <p><Link href="/labs/thermo/processes/cycle">Open cycle efficiency</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

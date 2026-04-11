import Link from "next/link";

export default function EMFieldsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Electrostatic Fields</h2>
        <p>Choose a field visualization.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Coulomb Field</h3>
            <p><Link href="/labs/em/fields/coulomb">Open Coulomb field</Link></p>
          </div>
          <div className="card">
            <h3>Dipole Field</h3>
            <p><Link href="/labs/em/fields/dipole">Open dipole field</Link></p>
          </div>
          <div className="card">
            <h3>Multi-Charge Map</h3>
            <p><Link href="/labs/em/fields/multi">Open multi-charge map</Link></p>
          </div>
          <div className="card">
            <h3>Field Lines</h3>
            <p><Link href="/labs/em/fields/lines">Open field line tracer</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

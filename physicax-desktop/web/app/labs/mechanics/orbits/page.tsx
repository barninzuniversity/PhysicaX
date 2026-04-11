import Link from "next/link";

export default function OrbitsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Orbit Mechanics</h2>
        <p>Central-force orbital simulations.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Basic Orbit</h3>
            <p><Link href="/labs/mechanics/orbits/basic">Open orbit simulator</Link></p>
          </div>
          <div className="card">
            <h3>N-Body Gravity</h3>
            <p><Link href="/labs/mechanics/orbits/n-body">Open N-body mini-sim</Link></p>
          </div>
          <div className="card">
            <h3>Orbit Precession</h3>
            <p><Link href="/labs/mechanics/orbits/precession">Open precession model</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

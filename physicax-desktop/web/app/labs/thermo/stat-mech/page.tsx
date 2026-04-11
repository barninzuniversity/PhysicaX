import Link from "next/link";
import { StatMechExtrasSim } from "../../../components/StatMechExtrasSim";

export default function StatMechPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Statistical Mechanics</h2>
        <p>Choose a distribution or population model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Maxwell-Boltzmann</h3>
            <p><Link href="/labs/thermo/stat-mech/maxwell">Open Maxwell-Boltzmann</Link></p>
          </div>
          <div className="card">
            <h3>Two-Level System</h3>
            <p><Link href="/labs/thermo/stat-mech/two-level">Open two-level system</Link></p>
          </div>
        </div>
      </section>
      <section className="section reveal">
        <h2>Stat Mech Extras</h2>
        <p>Boltzmann factors, equipartition, lattice gas, and Ising toy models.</p>
        <StatMechExtrasSim />
      </section>
    </>
  );
}

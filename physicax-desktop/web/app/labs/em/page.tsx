import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";

export default function EMLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>EMLab</h2>
        <p>Electric fields, circuits, and charged particle motion.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Electrostatics</h3>
            <p><Link href="/labs/em/fields">Open field visualizations</Link></p>
          </div>
          <div className="card">
            <h3>Circuits</h3>
            <p><Link href="/labs/em/circuits">Open circuit simulators</Link></p>
          </div>
          <div className="card">
            <h3>Charged Particle Motion</h3>
            <p><Link href="/labs/em/motion">Open motion simulator</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Coulomb Law</h3>
            <MathBlock latex={String.raw`E = k \frac{q}{r^2}`} />
          </div>
          <div className="model-card">
            <h3>RLC Circuit</h3>
            <MathBlock latex={String.raw`L q'' + R q' + \frac{1}{C} q = V(t)`} />
          </div>
          <div className="model-card">
            <h3>Lorentz Force</h3>
            <MathBlock latex={String.raw`\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})`} />
          </div>
        </div>
      </section>
    </>
  );
}

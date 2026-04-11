import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";

export default function MechanicsLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Mechanics Lab</h2>
        <p>
          Explore kinematics, forces, oscillations, pendulums, and orbital mechanics. Each
          simulation now lives on its own page for maximum clarity.
        </p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Projectile Motion</h3>
            <p><Link href="/labs/mechanics/projectile">Open projectile simulator</Link></p>
          </div>
          <div className="card">
            <h3>Kinematics Suite</h3>
            <p><Link href="/labs/mechanics/kinematics">Open kinematics toolkit</Link></p>
          </div>
          <div className="card">
            <h3>Force + Energy</h3>
            <p><Link href="/labs/mechanics/energy">Open force/energy systems</Link></p>
          </div>
          <div className="card">
            <h3>Drag + Airflow</h3>
            <p><Link href="/labs/mechanics/drag">Open drag simulator</Link></p>
          </div>
          <div className="card">
            <h3>Pendulums</h3>
            <p><Link href="/labs/mechanics/pendulum">Open pendulum suite</Link></p>
          </div>
          <div className="card">
            <h3>Oscillators</h3>
            <p><Link href="/labs/mechanics/oscillators">Open oscillator lab</Link></p>
          </div>
          <div className="card">
            <h3>Orbits</h3>
            <p><Link href="/labs/mechanics/orbits">Open orbit lab</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Projectile Motion</h3>
            <MathBlock latex={String.raw`x(t)=v_0 \cos\theta\, t,\; y(t)=v_0 \sin\theta\, t-\frac{1}{2}gt^2`} />
          </div>
          <div className="model-card">
            <h3>SHM</h3>
            <MathBlock latex={String.raw`x'' + \frac{k}{m} x = 0`} />
          </div>
          <div className="model-card">
            <h3>Pendulum</h3>
            <MathBlock latex={String.raw`\theta'' + \frac{g}{L} \sin(\theta) = 0`} />
          </div>
          <div className="model-card">
            <h3>Orbit</h3>
            <MathBlock latex={String.raw`\ddot{r} = -\frac{GM}{r^2}`} />
          </div>
        </div>
      </section>
    </>
  );
}

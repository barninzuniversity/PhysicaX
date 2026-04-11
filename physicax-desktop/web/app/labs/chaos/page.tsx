import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";

export default function ChaosLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>ChaosLab</h2>
        <p>Discrete maps, continuous chaos, and sensitivity diagnostics.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Discrete Chaos</h3>
            <p><Link href="/labs/chaos/discrete">Open discrete chaos suite</Link></p>
          </div>
          <div className="card">
            <h3>Continuous Chaos</h3>
            <p><Link href="/labs/chaos/continuous">Open continuous chaos suite</Link></p>
          </div>
          <div className="card">
            <h3>Chaos Diagnostics</h3>
            <p><Link href="/labs/chaos/advanced">Open basins + sweeps</Link></p>
          </div>
          <div className="card">
            <h3>Math Connections</h3>
            <p><Link href="/labs/chaos/connections">Open connections guide</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Logistic Map</h3>
            <MathBlock latex={String.raw`x_{n+1} = r x_n (1-x_n)`} />
          </div>
          <div className="model-card">
            <h3>Lorenz System</h3>
            <MathBlock latex={String.raw`x'=\sigma(y-x),\; y'=x(\rho-z)-y,\; z'=xy-\beta z`} />
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Math Connections</h2>
        <div className="columns">
          <div className="column">
            <h3>Discrete to Physical</h3>
            <p>Logistic and tent maps mirror population dynamics and feedback loops in control systems.</p>
          </div>
          <div className="column">
            <h3>Continuous to Physical</h3>
            <p>Lorenz and Duffing capture convection rolls and nonlinear springs, linking to real lab oscillators.</p>
          </div>
        </div>
      </section>
    </>
  );
}

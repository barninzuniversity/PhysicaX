import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";

export default function ThermoLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>ThermoLab</h2>
        <p>Thermodynamics, processes, cycles, and statistical mechanics.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>State Variables</h3>
            <p><Link href="/labs/thermo/state">Open state variable solver</Link></p>
          </div>
          <div className="card">
            <h3>Processes + Cycles</h3>
            <p><Link href="/labs/thermo/processes">Open processes</Link></p>
          </div>
          <div className="card">
            <h3>Heat Transfer</h3>
            <p><Link href="/labs/thermo/heat-transfer">Open heat transfer</Link></p>
          </div>
          <div className="card">
            <h3>Entropy</h3>
            <p><Link href="/labs/thermo/entropy">Open entropy visualizer</Link></p>
          </div>
          <div className="card">
            <h3>Statistical Mechanics</h3>
            <p><Link href="/labs/thermo/stat-mech">Open stat mech models</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Ideal Gas</h3>
            <MathBlock latex={String.raw`PV = nRT`} />
          </div>
          <div className="model-card">
            <h3>Isothermal</h3>
            <MathBlock latex={String.raw`PV = \text{const}`}></MathBlock>
          </div>
          <div className="model-card">
            <h3>Adiabatic</h3>
            <MathBlock latex={String.raw`PV^\gamma = \text{const}`} />
          </div>
          <div className="model-card">
            <h3>Entropy</h3>
            <MathBlock latex={String.raw`\Delta S = nR \ln\left(\frac{V_2}{V_1}\right)`} />
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";
import { StatMechExtrasSim } from "../../components/StatMechExtrasSim";

export default function StatLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Statistical Physics Lab</h2>
        <p>Random walks, diffusion, Boltzmann distributions, and Monte Carlo.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Random Walk + Diffusion</h3>
            <p><Link href="/labs/stat/random-walk">Open random walk suite</Link></p>
          </div>
          <div className="card">
            <h3>Boltzmann Lab</h3>
            <p><Link href="/labs/stat/boltzmann">Open Boltzmann suite</Link></p>
          </div>
          <div className="card">
            <h3>Monte Carlo</h3>
            <p><Link href="/labs/stat/monte-carlo">Open Monte Carlo suite</Link></p>
          </div>
          <div className="card">
            <h3>Multiplicity</h3>
            <p><Link href="/labs/stat/multiplicity">Open multiplicity model</Link></p>
          </div>
          <div className="card">
            <h3>Diffusion</h3>
            <p><Link href="/labs/stat/diffusion">Open diffusion model</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Advanced Stat Mech</h2>
        <p>Equipartition, lattice gas, Ising toy models, and Metropolis sampling.</p>
        <StatMechExtrasSim />
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Random Walk</h3>
            <MathBlock latex={String.raw`\langle x^2 \rangle = N a^2`} />
          </div>
          <div className="model-card">
            <h3>Diffusion</h3>
            <MathBlock latex={String.raw`\langle x^2 \rangle = 2Dt`} />
          </div>
          <div className="model-card">
            <h3>Boltzmann Factor</h3>
            <MathBlock latex={String.raw`p_i = \frac{e^{-E_i/(k_B T)}}{Z}`} />
          </div>
        </div>
      </section>
    </>
  );
}

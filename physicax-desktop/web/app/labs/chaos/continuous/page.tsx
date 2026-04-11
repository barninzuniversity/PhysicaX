import Link from "next/link";

export default function ChaosContinuousPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Continuous Chaos</h2>
        <p>Select an attractor to explore.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Lorenz Attractor</h3>
            <p><Link href="/labs/chaos/continuous/lorenz">Open Lorenz attractor</Link></p>
          </div>
          <div className="card">
            <h3>Rossler Attractor</h3>
            <p><Link href="/labs/chaos/continuous/rossler">Open Rossler attractor</Link></p>
          </div>
          <div className="card">
            <h3>Duffing Oscillator</h3>
            <p><Link href="/labs/chaos/continuous/duffing">Open Duffing system</Link></p>
          </div>
          <div className="card">
            <h3>Driven Pendulum</h3>
            <p><Link href="/labs/chaos/continuous/pendulum">Open driven pendulum</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

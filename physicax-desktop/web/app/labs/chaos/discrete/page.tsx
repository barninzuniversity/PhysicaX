import Link from "next/link";

export default function ChaosDiscretePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Discrete Chaos</h2>
        <p>Explore maps and chaos diagnostics.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Logistic Map</h3>
            <p><Link href="/labs/chaos/discrete/logistic">Open logistic map</Link></p>
          </div>
          <div className="card">
            <h3>Cobweb Diagram</h3>
            <p><Link href="/labs/chaos/discrete/cobweb">Open cobweb diagram</Link></p>
          </div>
          <div className="card">
            <h3>Bifurcation Diagram</h3>
            <p><Link href="/labs/chaos/discrete/bifurcation">Open bifurcation</Link></p>
          </div>
          <div className="card">
            <h3>Lyapunov Exponent</h3>
            <p><Link href="/labs/chaos/discrete/lyapunov">Open Lyapunov tool</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

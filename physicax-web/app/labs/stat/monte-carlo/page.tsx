import Link from "next/link";

export default function MonteCarloIndex() {
  return (
    <>
      <section className="section reveal">
        <h2>Monte Carlo + Multiplicity</h2>
        <p>Sampling-based estimation and microstate counting.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Monte Carlo Pi</h3>
            <p><Link href="/labs/stat/monte-carlo/pi">Open Monte Carlo π</Link></p>
          </div>
          <div className="card">
            <h3>Multiplicity</h3>
            <p><Link href="/labs/stat/multiplicity">Open multiplicity model</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";

export default function RandomWalkIndex() {
  return (
    <>
      <section className="section reveal">
        <h2>Random Walk + Diffusion</h2>
        <p>Select a stochastic model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Random Walk</h3>
            <p><Link href="/labs/stat/random-walk/1d">Open random walk</Link></p>
          </div>
          <div className="card">
            <h3>Random Walk (2D)</h3>
            <p><Link href="/labs/stat/random-walk/2d">Open 2D walk</Link></p>
          </div>
          <div className="card">
            <h3>Diffusion</h3>
            <p><Link href="/labs/stat/diffusion">Open diffusion model</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
